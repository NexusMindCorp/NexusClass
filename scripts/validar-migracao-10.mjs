import { chromium } from "playwright";
import { expect } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const url = "http://localhost:5173/NexusClassWeb/";
const origem = new URL(url).origin;
const diretorioSessoes = join(process.env.LOCALAPPDATA ?? homedir(), "NexusClass", "playwright");
const somenteLogin = process.argv.includes("--somente-login");
const somenteAluno = process.argv.includes("--somente-aluno");
const browser = await chromium.launch({ channel: "msedge", headless: false });

async function abrirSessao(papel, identificador, campo) {
  const nomeConta = papel === "aluno" ? "Testador Noturno" : "prof@nexusclass.edu.br";
  const arquivoSessao = join(diretorioSessoes, `${papel}.json`);
  const estado = await readFile(arquivoSessao, "utf8").then(JSON.parse, (erro) => {
    if (erro.code !== "ENOENT") throw erro;
    return undefined;
  });
  const context = await browser.newContext({ storageState: estado });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  await page.addInitScript((rotulo) => {
    document.addEventListener("DOMContentLoaded", () => {
      document.title = rotulo;
    }, { once: true });
  }, `NexusClass — ${nomeConta}`);
  page.on("response", (resposta) => {
    const caminho = new URL(resposta.url()).pathname;
    if (caminho.endsWith("/rest/v1/entrega_atividade")) {
      console.log(`${papel}: entrega ${resposta.request().method()} HTTP ${resposta.status()}`);
    } else if (caminho.startsWith("/storage/v1/object") && resposta.request().method() !== "GET") {
      console.log(`${papel}: Storage ${resposta.request().method()} HTTP ${resposta.status()}`);
    }
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  console.log(estado
    ? `Verificando a sessão guardada de ${nomeConta}. Entre novamente só se o login aparecer.`
    : `Entre como ${nomeConta}. A sessão será guardada ao confirmar a conta.`);
  await expect(page.getByRole("link", { name: "Pesquisar", exact: true }))
    .toBeVisible({ timeout: 5 * 60_000 });
  const storage = await context.storageState();
  const origens = storage.origins.filter((entrada) => entrada.origin === origem);
  const sessao = origens.flatMap((entrada) => entrada.localStorage)
    .find((item) => /^sb-.+-auth-token$/.test(item.name));
  const conta = sessao && JSON.parse(sessao.value).user;
  if (conta?.[campo] !== identificador) {
    throw new Error(`A conta autenticada não corresponde à conta de teste esperada para ${papel}.`);
  }
  await mkdir(diretorioSessoes, { recursive: true, mode: 0o700 });
  await writeFile(arquivoSessao, JSON.stringify({ cookies: [], origins: origens }), { mode: 0o600 });
  console.log(`SESSÃO CONFIRMADA E GUARDADA: ${papel}.`);
  return page;
}

async function abrirEntrega(page, titulo, acao) {
  const atalho = page.getByRole("button", { name: /Banco de Dados - 2026\.3/ });
  await expect(atalho).toBeVisible({ timeout: 5 * 60_000 });
  await atalho.click();
  await page.getByRole("navigation", { name: "Seções da turma" })
    .getByRole("button", { name: "Atividades", exact: true }).click();
  const card = page.locator('[data-slot="card"]').filter({
    has: page.getByText(titulo, { exact: true }),
  });
  await expect(card).toBeVisible({ timeout: 20_000 });
  const aberto = card.getByRole("button", { name: "Ocultar Área de Entrega", exact: true });
  const fechado = card.getByRole("button", { name: acao, exact: true });
  await expect(aberto.or(fechado)).toBeVisible({ timeout: 20_000 });
  if (!(await aberto.isVisible())) {
    await fechado.click();
  }
  return card;
}

async function gravar(page, botao, metodo) {
  const [resposta] = await Promise.all([
    page.waitForResponse((response) =>
      response.request().method() === metodo &&
      new URL(response.url()).pathname.endsWith("/rest/v1/entrega_atividade"),
    { timeout: 20_000 }),
    botao.click(),
  ]);
  expect(resposta.ok(), `Resposta de gravação HTTP ${resposta.status()}`).toBe(true);
}

async function verificarProfessor(page) {
  const card = await abrirEntrega(page, "Teste RN08 — entrega avaliada", "Gerenciar Entregas de Alunos");
  await expect(card.getByText("Testador Noturno", { exact: true })).toBeVisible({ timeout: 20_000 });
  await card.getByRole("button", { name: "Editar Nota/Feedback", exact: true }).click();
  const nota = card.getByRole("spinbutton");
  await nota.fill((await nota.inputValue()) === "60" ? "61" : "60");
  const valor = await nota.inputValue();
  const parecer = `Parecer de teste após migração 10. Nota ${valor}.`;
  await card.locator("textarea").fill(parecer);
  await gravar(page, card.getByRole("button", { name: "Salvar Avaliação", exact: true }), "PATCH");
  await expect(card.getByText(`Nota: ${valor}.0`, { exact: true })).toBeVisible();
  await expect(card.getByText(`"${parecer}"`, { exact: true })).toBeVisible();
  console.log(`PASSOU professor: gravou nota ${valor} e feedback na entrega descartável.`);
}

async function verificarAluno(page) {
  const card = await abrirEntrega(page, "Teste RN07 — dentro do prazo", "Ver Status");
  await expect(card.getByRole("button", { name: "Substituir arquivo", exact: true })).toBeVisible();
  const nome = "reteste-migracao-10.png";
  const arquivo = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aG1sAAAAASUVORK5CYII=",
    "base64",
  );
  await card.locator('input[type="file"]').setInputFiles({
    name: nome,
    mimeType: "image/png",
    buffer: arquivo,
  });
  const confirmacao = page.locator("[data-sonner-toast]").filter({
    hasText: /Atividade entregue com sucesso|Erro ao entregar atividade/,
  });
  await card.getByRole("button", { name: "Confirmar Envio", exact: true }).click();
  await expect(confirmacao).toBeVisible({ timeout: 25_000 });
  expect(await confirmacao.innerText()).toContain("Atividade entregue com sucesso!");
  await expect(card.getByText(nome, { exact: true })).toBeVisible();
  console.log("PASSOU aluno: substituiu o anexo da entrega descartável sem nota.");
}

try {
  const aluno = abrirSessao("aluno", "7490b7a6-7906-4525-8f04-40dd8d67c2ba", "id");
  const testes = [aluno.then((page) => somenteLogin ? undefined : verificarAluno(page))];
  if (!somenteAluno) {
    testes.push(abrirSessao("professor", "prof@nexusclass.edu.br", "email")
      .then((page) => somenteLogin ? undefined : verificarProfessor(page)));
  }
  const resultados = await Promise.allSettled(testes);
  for (const [indice, resultado] of resultados.entries()) {
    if (resultado.status === "rejected") {
      console.error(`FALHOU ${indice === 0 ? "aluno" : "professor"}: ${resultado.reason.message}`);
      process.exitCode = 1;
    }
  }
} finally {
  await browser.close();
}
