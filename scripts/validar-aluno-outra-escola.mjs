import { chromium } from "playwright";
import { expect } from "@playwright/test";

const browser = await chromium.launch({ channel: "msedge", headless: false });
const tempoLogin = 5 * 60_000;

try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  await page.goto("http://localhost:5173/NexusClassWeb/", { waitUntil: "domcontentloaded" });
  console.log("Entre como jae@nexus.com. O roteiro fará a navegação após o login.");

  const pesquisa = page.getByRole("link", { name: "Pesquisar", exact: true });
  await expect(pesquisa).toBeVisible({ timeout: tempoLogin });
  await expect(page.getByRole("button", { name: /Banco de Dados - 2026\.3/ })).toHaveCount(0);
  console.log("PASSOU: DCC000 ausente da sidebar da conta de controle.");

  await pesquisa.click();
  const painel = page.getByRole("dialog");
  await painel.getByRole("tab", { name: "Todas", exact: true }).click();
  await expect(painel.getByText("Cálculo Numérico", { exact: true })).toBeVisible();
  console.log("PASSOU: pesquisa mostra a turma de controle da escola 3.");

  await painel.getByPlaceholder("Digite sua pesquisa...").fill("Banco de Dados");
  await expect(painel.getByText("Nenhum resultado encontrado.", { exact: true })).toBeVisible();
  console.log("PASSOU: pesquisa da escola 3 não retorna a DCC000.");
} catch (erro) {
  console.error(`FALHOU na verificação de navegação: ${erro.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
