import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { expect } from "@playwright/test";

const pasta = join(process.env.LOCALAPPDATA ?? homedir(), "NexusClass", "playwright");
const navegador = await chromium.launch({ channel: "msedge" });
const base = "http://localhost:5173/NexusClassWeb/";
const alunoId = "7490b7a6-7906-4525-8f04-40dd8d67c2ba";

async function abrirSessao(papel) {
  const caminho = join(pasta, `${papel}.json`);
  const storageState = JSON.parse(await readFile(caminho, "utf8"));
  const contexto = await navegador.newContext({ storageState });
  const pagina = await contexto.newPage();
  await pagina.goto(base, { waitUntil: "domcontentloaded" });
  await expect(pagina.getByRole("link", { name: "Pesquisar", exact: true })).toBeVisible({ timeout: 25_000 });
  return { caminho, contexto, pagina };
}

function consultarEntrega(pagina, objetoConhecido) {
  return pagina.evaluate(async ({ dono, objeto, modulo }) => {
    const { supabase } = await import(modulo);
    const { data, error } = await supabase.from("entrega_atividade")
      .select("id_objeto_storage")
      .eq("id_atividade", 26).eq("id_aluno", dono).maybeSingle();
    if (error) throw new Error(`Consulta da entrega: ${error.code ?? "erro"}`);

    const objetoId = objeto ?? data?.id_objeto_storage;
    if (!objetoId) return { entrega: data !== null, arquivo: false };
    const { data: arquivos, error: erroArquivo } = await supabase.from("v_storage_objetos")
      .select("id").eq("id", objetoId);
    if (erroArquivo) throw new Error(`Consulta do arquivo: ${erroArquivo.code ?? "erro"}`);
    return { entrega: data !== null, arquivo: arquivos.length > 0, objetoId };
  }, { dono: alunoId, objeto: objetoConhecido, modulo: `${base}src/lib/supabaseClient.ts` });
}

try {
  const [aluno, professor, controle] = await Promise.all(
    ["aluno", "professor", "aluno-escola-3"].map(abrirSessao),
  );
  const doDono = await consultarEntrega(aluno.pagina);
  assert.ok(doDono.entrega && doDono.arquivo && doDono.objetoId,
    "O aluno dono deve ver a entrega e o objeto de teste.");
  console.log("PASSOU: aluno dono leu a entrega e o objeto vinculado.");

  const doDocente = await consultarEntrega(professor.pagina, doDono.objetoId);
  assert.ok(doDocente.entrega && doDocente.arquivo, "O professor vinculado deve ver a entrega e o objeto.");
  console.log("PASSOU: professor vinculado leu a entrega e o objeto vinculado.");

  const deOutraEscola = await consultarEntrega(controle.pagina, doDono.objetoId);
  assert.ok(!deOutraEscola.entrega && !deOutraEscola.arquivo,
    "A conta de outra escola não deve ver a entrega nem o objeto.");
  console.log("PASSOU: aluno de outra escola não recebeu a entrega nem o objeto vinculado.");
  await Promise.all([aluno, professor, controle].map(({ contexto, caminho }) => contexto.storageState({ path: caminho })));
} finally {
  await navegador.close();
}
