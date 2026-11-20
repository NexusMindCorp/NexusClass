import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { expect } from "@playwright/test";

const arquivoSessao = join(process.env.LOCALAPPDATA ?? homedir(), "NexusClass", "playwright", "aluno.json");
const storageState = JSON.parse(await readFile(arquivoSessao, "utf8"));
const browser = await chromium.launch({ channel: "msedge" });

try {
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();
  await page.goto("http://localhost:5173/NexusClassWeb/", { waitUntil: "domcontentloaded" });
  const pesquisa = page.getByRole("link", { name: "Pesquisar", exact: true });
  await expect(pesquisa).toBeVisible({ timeout: 25_000 });
  await pesquisa.click();
  const painel = page.getByRole("dialog");
  await painel.getByPlaceholder("Digite sua pesquisa...").fill("Estrutura de Dados");
  const turma = painel.locator('[data-slot="card"]').filter({
    has: page.getByText("Estrutura de Dados", { exact: true }),
  });
  await turma.getByRole("button", { name: "Entrar", exact: true }).click();
  const cabecalho = page.locator('[data-slot="card"]').filter({
    has: page.locator('[data-slot="card-title"]').getByText("Estrutura de Dados", { exact: true }),
  });
  const secoes = cabecalho.getByRole("navigation", { name: "Seções da turma" });
  await expect(secoes).toBeVisible({ timeout: 15_000 });
  console.log("PASSOU: botão Entrar da pesquisa abriu Estrutura de Dados (DCC001).");

  await secoes.getByRole("button", { name: "Enviar Dúvida", exact: true }).click();
  const titulo = page.getByRole("heading", { name: /^Enviar Dúvida para \S/ });
  await expect(titulo).toBeVisible();
  await expect(titulo).not.toContainText("Anônimo");
  await expect(page.getByRole("textbox", { name: "Conteúdo da Dúvida" })).toBeVisible();
  console.log("PASSOU: DCC001 abriu o formulário com docente identificado.");
  await context.storageState({ path: arquivoSessao });
} finally {
  await browser.close();
}
