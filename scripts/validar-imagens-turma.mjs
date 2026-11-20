import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { expect } from "@playwright/test";

const arquivoSessao = join(process.env.LOCALAPPDATA ?? homedir(), "NexusClass", "playwright", "aluno.json");
const storageState = JSON.parse(await readFile(arquivoSessao, "utf8"));
const navegador = await chromium.launch({ channel: "msedge" });

try {
  const contexto = await navegador.newContext({ storageState });
  const pagina = await contexto.newPage();
  pagina.on("pageerror", (erro) => console.error("Erro de página:", erro.message));
  await pagina.route("**/nexusclass.edu.br/**", (route) => route.request().resourceType() === "image"
    ? route.abort("failed")
    : route.continue());
  await pagina.goto("http://localhost:5173/NexusClassWeb/", { waitUntil: "domcontentloaded" });
  const pesquisa = pagina.getByRole("link", { name: "Pesquisar", exact: true });
  await expect(pesquisa).toBeVisible({ timeout: 25_000 });
  await pesquisa.click();
  const painel = pagina.getByRole("dialog");
  await painel.getByPlaceholder("Digite sua pesquisa...").fill("Banco de Dados");
  const cartao = painel.locator('[data-slot="card"]').filter({
    has: pagina.getByText("Banco de Dados", { exact: true }),
  });
  const banner = cartao.locator('img[alt="Banner da turma"]');
  await expect(banner).toHaveAttribute("hidden", "");
  const area = await banner.locator("..").boundingBox();
  assert.ok(area && area.height > 0, "O banner deve manter sua área após erro.");
  const nome = (await cartao.getByText(/^Prof: /).innerText()).split("|")[0].replace("Prof:", "").trim();
  await expect(cartao.locator('[data-slot="avatar-fallback"]')).toHaveText(nome[0].toUpperCase());
  await cartao.getByRole("button", { name: "Entrar", exact: true }).click();
  const mural = pagina.getByRole("navigation", { name: "Seções da turma" });
  await expect(mural).toBeVisible();
  await expect(pagina.locator('img[alt^="Banner da turma "]')).toHaveAttribute("hidden", "");
  console.log("PASSOU: imagens indisponíveis não quebram cartão nem mural, inicial aparece e Entrar funciona.");
  await contexto.storageState({ path: arquivoSessao });
} finally {
  await navegador.close();
}
