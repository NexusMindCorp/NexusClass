import { chromium } from "playwright";
import { expect } from "@playwright/test";

const url = "http://localhost:5173/NexusClassWeb/";
const tempoLogin = 5 * 60_000;
const tempoTela = 12_000;
const browser = await chromium.launch({ channel: "msedge", headless: false });

async function abrirSessao(papel) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(tempoTela);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  console.log(`Entre como ${papel} na janela correspondente. O roteiro fará a navegação.`);
  return page;
}

async function verificar(papel, cenario, executar) {
  try {
    await executar();
    console.log(`PASSOU ${papel} — ${cenario}`);
    return true;
  } catch (erro) {
    console.error(`FALHOU ${papel} — ${cenario}\n${erro.message}`);
    process.exitCode = 1;
    return false;
  }
}

async function testarSessao(page, papel) {
  const pesquisa = page.getByRole("link", { name: "Pesquisar", exact: true });
  const atalho = page.getByRole("button", { name: /Banco de Dados - 2026\.3/ });
  const cabecalho = page.locator('[data-slot="card"]').filter({
    has: page.locator('[data-slot="card-title"]').getByText("Banco de Dados", { exact: true }),
  });
  const secoes = cabecalho.getByRole("navigation", { name: "Seções da turma" });
  const pronto = await verificar(papel, "login chegou ao menu", async () => {
    await expect(pesquisa).toBeVisible({ timeout: tempoLogin });
  });
  if (!pronto) return;

  if (papel === "aluno") {
    await verificar(papel, "botão Entrar da pesquisa abre a DCC000", async () => {
      await pesquisa.click();
      await page.getByPlaceholder("Digite sua pesquisa...").fill("Banco de Dados");
      const turma = page.getByRole("dialog").locator('[data-slot="card"]').filter({
        hasText: "Banco de Dados",
      });
      await turma.getByRole("button", { name: "Entrar", exact: true }).click();
      await expect(secoes).toBeVisible({ timeout: tempoTela });
      await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: tempoTela });
    });
    // O atalho serve de controle se a entrada pela pesquisa falhar.
    const busca = page.getByRole("dialog");
    if (await busca.isVisible()) await page.keyboard.press("Escape");
  }

  const turmaAberta = await verificar(papel, "atalho da DCC000 abre as seções da turma", async () => {
    await atalho.click();
    await expect(secoes).toBeVisible({ timeout: tempoTela });
  });
  if (!turmaAberta) return;

  await verificar(papel, "ações de dúvida e publicação correspondem ao papel", async () => {
    const duvida = secoes.getByRole("button", { name: "Enviar Dúvida", exact: true });
    const contagem = papel === "aluno" ? 1 : 0;
    await expect(duvida).toHaveCount(contagem, { timeout: tempoTela });
    await secoes.getByRole("button", { name: "Atividades", exact: true }).click();
    const publicar = page.getByRole("button", { name: "Postar Atividade", exact: true });
    await expect(publicar).toHaveCount(1 - contagem, { timeout: tempoTela });
  });
}

try {
  const aluno = await abrirSessao("aluno — Testador Noturno");
  const professor = await abrirSessao("professor — prof@nexusclass.edu.br");
  await Promise.all([testarSessao(aluno, "aluno"), testarSessao(professor, "professor")]);
} finally {
  await browser.close();
}
