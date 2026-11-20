import assert from "node:assert/strict";
import { chromium } from "playwright";
import { expect } from "@playwright/test";

const url = "http://localhost:5173/NexusClassWeb/";
const atividade = "E3 - Álgebra Relacional";
const tempoParaEntrar = 5 * 60_000;
const nomeAluno = "Testador Noturno";
const browser = await chromium.launch({ channel: "msedge", headless: false });

async function abrirSessao(papel) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  console.log(`Janela de ${papel}: entre e abra DCC000 → Atividades.`);
  return page;
}

async function abrirAreaDeEntrega(page, acao) {
  const card = page.locator('[data-slot="card"]').filter({
    has: page.getByText(atividade, { exact: true }),
  });
  await card.waitFor({ state: "visible", timeout: tempoParaEntrar });
  const aberto = card.getByRole("button", { name: "Ocultar Área de Entrega" });
  const fechado = card.getByRole("button", { name: acao, exact: true });
  await expect(aberto.or(fechado)).toBeVisible({ timeout: tempoParaEntrar });
  if (!(await aberto.isVisible())) {
    await fechado.click();
  }
  return card;
}

async function verificarAluno(page) {
  const card = await abrirAreaDeEntrega(page, "Ver Status");
  await card.getByText("NOTA E FEEDBACK", { exact: true }).waitFor();
  await card.getByText(/^\d+(?:\.\d+)? \/ 100\.0$/).waitFor();
  await card.getByTitle("Baixar arquivo entregue").waitFor();
  assert.equal(await card.getByRole("button", { name: "Substituir arquivo" }).count(), 0);
  console.log("PASSOU aluno: nota visível, download disponível e substituição ausente.");
}

async function verificarProfessor(page) {
  const card = await abrirAreaDeEntrega(page, "Gerenciar Entregas de Alunos");
  const entrega = card.getByText(nomeAluno, { exact: true });
  await entrega.waitFor();
  await card.getByRole("button", { name: "Baixar Trabalho", exact: true }).first().waitFor();
  console.log("PASSOU professor: lista de entregas mostra Testador Noturno e oferece download.");
}

try {
  const aluno = await abrirSessao("aluno — Testador Noturno");
  const professor = await abrirSessao("professor — prof@nexusclass.edu.br");
  const resultados = await Promise.allSettled([
    verificarAluno(aluno),
    verificarProfessor(professor),
  ]);
  for (const [indice, resultado] of resultados.entries()) {
    if (resultado.status === "rejected") {
      console.error(`FALHOU ${indice === 0 ? "aluno" : "professor"}: ${resultado.reason.message}`);
      process.exitCode = 1;
    }
  }
} finally {
  await browser.close();
}
