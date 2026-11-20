import { chromium } from "playwright";
import { expect } from "@playwright/test";

const browser = await chromium.launch({ channel: "msedge", headless: false });

try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  await page.goto("http://localhost:5173/NexusClassWeb/", { waitUntil: "domcontentloaded" });
  console.log("Entre como descarte@nexus.com, agora com papel master.");

  const pesquisar = page.getByRole("link", { name: "Pesquisar", exact: true });
  await expect(pesquisar).toBeVisible({ timeout: 5 * 60_000 });
  for (const turma of ["Banco de Dados", "Cálculo Numérico"]) {
    try {
      await pesquisar.click();
      const painel = page.getByRole("dialog");
      await painel.getByPlaceholder("Digite sua pesquisa...").fill(turma);
      const card = painel.locator('[data-slot="card"]').filter({
        has: page.getByText(turma, { exact: true }),
      });
      await expect(card.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
      await card.getByRole("button", { name: "Entrar", exact: true }).click();
      const cabecalho = page.locator('[data-slot="card"]').filter({
        has: page.locator('[data-slot="card-title"]').getByText(turma, { exact: true }),
      });
      await expect(cabecalho.getByRole("navigation", { name: "Seções da turma" })).toBeVisible();
      console.log(`PASSOU master — abriu ${turma} pela pesquisa.`);
    } catch (erro) {
      console.error(`FALHOU master — ${turma}\n${erro.message}`);
      process.exitCode = 1;
      if (await page.getByRole("dialog").isVisible()) await page.keyboard.press("Escape");
    }
  }
} catch (erro) {
  console.error(`BLOQUEADO master — ${erro.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
