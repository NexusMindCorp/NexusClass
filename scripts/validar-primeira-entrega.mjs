import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { expect } from "@playwright/test";

const pasta = join(process.env.LOCALAPPDATA ?? homedir(), "NexusClass", "playwright");
const url = "http://localhost:5173/NexusClassWeb/";
const browser = await chromium.launch({ channel: "msedge" });
const idExistente = process.argv[2];
if (idExistente && !/^[0-9a-f-]{36}$/.test(idExistente)) {
  throw new Error("Informe apenas o identificador de uma atividade descartável criada pelo roteiro.");
}
const titulo = `[Teste descartável Fase 6] Primeira entrega ${idExistente ?? randomUUID()}`;
const arquivo = "primeira-entrega-e2e.png";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aG1sAAAAASUVORK5CYII=", "base64");

async function abrirAtividades(papel) {
  const caminho = join(pasta, `${papel}.json`);
  const storageState = JSON.parse(await readFile(caminho, "utf8"));
  const contexto = await browser.newContext({ storageState });
  const pagina = await contexto.newPage();
  pagina.setDefaultTimeout(15_000);
  await pagina.goto(url, { waitUntil: "domcontentloaded" });
  const atalho = pagina.getByRole("button", { name: /Banco de Dados - 2026\.3/ });
  await expect(atalho).toBeVisible({ timeout: 25_000 });
  await atalho.click();
  await pagina.getByRole("navigation", { name: "Seções da turma" })
    .getByRole("button", { name: "Atividades", exact: true }).click();
  return { contexto, caminho, pagina };
}

function cartao(pagina) {
  return pagina.locator('[data-slot="card"]').filter({
    has: pagina.getByText(titulo, { exact: true }),
  });
}

try {
  if (!idExistente) {
    const professor = await abrirAtividades("professor");
    await professor.pagina.getByRole("button", { name: "Postar Atividade", exact: true }).click();
    await professor.pagina.locator("#atividade-titulo").fill(titulo);
    await professor.pagina.locator("#atividade-descricao").fill("Atividade descartável para a primeira entrega automatizada.");
    const prazo = new Date(Date.now() + 86_400_000);
    prazo.setMinutes(prazo.getMinutes() - prazo.getTimezoneOffset());
    await professor.pagina.locator("#atividade-data").fill(prazo.toISOString().slice(0, 16));
    await professor.pagina.getByRole("button", { name: "Publicar Atividade", exact: true }).click();
    await expect(cartao(professor.pagina)).toBeVisible({ timeout: 25_000 });
    console.log(`PASSOU: professor publicou a atividade descartável ${titulo}.`);
    await professor.contexto.storageState({ path: professor.caminho });
  }

  const aluno = await abrirAtividades("aluno");
  const card = cartao(aluno.pagina);
  await expect(card).toBeVisible({ timeout: 25_000 });
  const aberto = card.getByRole("button", { name: "Ocultar Área de Entrega", exact: true });
  const fechado = card.getByRole("button", { name: /Entregar Trabalho|Ver Status/ });
  try {
    await expect(aberto.or(fechado)).toBeVisible({ timeout: 15_000 });
    if (!(await aberto.isVisible())) await fechado.click();
  } catch (erro) {
    console.error("Botões no cartão:", await card.getByRole("button").allTextContents());
    throw erro;
  }
  await expect(card.getByRole("button", { name: "Anexar arquivo de entrega", exact: true })).toBeVisible();
  await card.locator('input[type="file"]').setInputFiles({
    name: arquivo, mimeType: "image/png", buffer: png,
  });
  const [resposta] = await Promise.all([
    aluno.pagina.waitForResponse((response) =>
      response.request().method() === "POST"
      && new URL(response.url()).pathname.endsWith("/rest/v1/entrega_atividade"),
    { timeout: 25_000 }),
    card.getByRole("button", { name: "Entregar Trabalho", exact: true }).click(),
  ]);
  expect(resposta.ok(), `HTTP ${resposta.status()} na primeira entrega`).toBe(true);
  await expect(card.getByText(arquivo, { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(card.getByTitle("Baixar arquivo entregue")).toBeVisible();
  console.log("PASSOU: aluno fez a primeira entrega e viu a opção de download.");
  await aluno.contexto.storageState({ path: aluno.caminho });
} finally {
  await browser.close();
}
