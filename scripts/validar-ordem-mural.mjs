import assert from "node:assert/strict";
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
  const atalho = page.getByRole("button", { name: /Banco de Dados - 2026\.3/ });
  await expect(atalho).toBeVisible({ timeout: 25_000 });

  const [resposta] = await Promise.all([
    page.waitForResponse((r) => {
      const url = new URL(r.url());
      return url.pathname.endsWith("/rest/v1/mural_post")
        && url.searchParams.get("id_turma") === "eq.1"
        && r.request().method() === "GET";
    }, { timeout: 25_000 }),
    atalho.click(),
  ]);
  assert.equal(resposta.ok(), true);
  const ordem = new URL(resposta.url()).searchParams.get("order");
  assert.equal(ordem, "created_at.desc,id_post.desc");

  const posts = await resposta.json();
  assert.ok(posts.length >= 2, "São necessários pelo menos dois posts na DCC000.");
  for (let indice = 1; indice < posts.length; indice++) {
    const anterior = posts[indice - 1];
    const atual = posts[indice];
    const intervalo = Date.parse(anterior.created_at) - Date.parse(atual.created_at);
    assert.ok(intervalo > 0 || (intervalo === 0 && anterior.id_post > atual.id_post));
  }
  const primeiro = page.getByText(posts[0].conteudo, { exact: true }).first();
  const ultimo = page.getByText(posts.at(-1).conteudo, { exact: true }).last();
  await expect(primeiro).toBeVisible({ timeout: 20_000 });
  await expect(ultimo).toBeVisible({ timeout: 20_000 });
  const caixaPrimeiro = await primeiro.boundingBox();
  const caixaUltimo = await ultimo.boundingBox();
  assert.ok(caixaPrimeiro && caixaUltimo && caixaPrimeiro.y < caixaUltimo.y);
  console.log(`PASSOU: ${posts.length} posts da DCC000 ordenados por data e ID, com a ordem conferida na tela.`);
  await context.storageState({ path: arquivoSessao });
} finally {
  await browser.close();
}
