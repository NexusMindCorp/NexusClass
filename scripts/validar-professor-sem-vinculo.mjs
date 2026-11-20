import { chromium } from "playwright";
import { expect } from "@playwright/test";

const browser = await chromium.launch({ channel: "msedge", headless: false });
const tempoLogin = 5 * 60_000;

try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  await page.goto("http://localhost:5173/NexusClassWeb/", { waitUntil: "domcontentloaded" });
  console.log("Entre como descarte@nexus.com. O roteiro navegará depois do login.");

  const pesquisa = page.getByRole("link", { name: "Pesquisar", exact: true });
  await expect(pesquisa).toBeVisible({ timeout: tempoLogin });
  await expect(page.getByRole("button", { name: /Banco de Dados - 2026\.3/ })).toHaveCount(0);
  console.log("PASSOU: DCC000 sem atalho docente na sidebar.");

  await pesquisa.click();
  const painel = page.getByRole("dialog");
  await painel.getByPlaceholder("Digite sua pesquisa...").fill("Banco de Dados");
  await expect(painel.getByText("Nenhum resultado encontrado.", { exact: true })).toBeVisible();
  await expect(painel.getByRole("button", { name: "Entrar", exact: true })).toHaveCount(0);
  console.log("PASSOU: pesquisa docente não retorna a DCC000 sem vínculo.");
} catch (erro) {
  console.error(`FALHOU na verificação do professor sem vínculo: ${erro.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
