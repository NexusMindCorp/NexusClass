import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { expect } from "@playwright/test";

const pasta = join(process.env.LOCALAPPDATA ?? homedir(), "NexusClass", "playwright");
const navegador = await chromium.launch({ channel: "msedge" });
let navegadorControle;
const base = "http://localhost:5173/NexusClassWeb/";
const alunoId = "7490b7a6-7906-4525-8f04-40dd8d67c2ba";
const modulo = `${base}src/lib/supabaseClient.ts`;
const modo = process.argv[2];

async function abrirSessao(papel, aceitarLogin = false) {
  const caminho = join(pasta, `${papel}.json`);
  const storageState = await readFile(caminho, "utf8").then(JSON.parse, (erro) => {
    if (!aceitarLogin || erro.code !== "ENOENT") throw erro;
    return undefined;
  });
  const browser = storageState ? navegador : (navegadorControle = await chromium.launch({
    channel: "msedge", headless: false,
  }));
  const contexto = await browser.newContext({ storageState });
  const pagina = await contexto.newPage();
  await pagina.goto(base, { waitUntil: "domcontentloaded" });
  if (!storageState) console.log("Entre como descarte@nexus.com. O roteiro guarda a sessão da conta descartável.");
  await expect(pagina.getByRole("link", { name: "Pesquisar", exact: true }))
    .toBeVisible({ timeout: storageState ? 25_000 : 5 * 60_000 });
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
  }, { dono: alunoId, objeto: objetoConhecido, modulo });
}

async function consultarPapelControle(pagina) {
  return pagina.evaluate(async (caminho) => {
    const { supabase } = await import(caminho);
    const { data: sessao, error: erroSessao } = await supabase.auth.getUser();
    if (erroSessao || sessao.user?.email !== "descarte@nexus.com") {
      throw new Error("A sessão precisa ser da conta descartável.");
    }
    const { data: perfil, error: erroPerfil } = await supabase.from("perfil")
      .select("role,id_escola").eq("id_perfil", sessao.user.id).single();
    if (erroPerfil) throw new Error("Não foi possível confirmar o papel da conta descartável.");
    const { data: vinculos, error: erroVinculos } = await supabase.from("professor_turma")
      .select("id_turma").eq("id_professor", sessao.user.id).eq("id_turma", 1);
    if (erroVinculos) throw new Error("Não foi possível consultar o vínculo da conta descartável.");
    return { papel: perfil.role, escola: perfil.id_escola, vinculo: vinculos.length > 0 };
  }, modulo);
}

async function testarControleDocente() {
  const master = modo === "--master";
  const [aluno, controle] = await Promise.all([
    abrirSessao("aluno"), abrirSessao("controle-dcc000", true),
  ]);
  const perfil = await consultarPapelControle(controle.pagina);
  assert.deepEqual(perfil, { papel: master ? "master" : "professor", escola: master ? null : 1, vinculo: false });
  await controle.contexto.storageState({ path: controle.caminho });

  const doDono = await consultarEntrega(aluno.pagina);
  assert.ok(doDono.entrega && doDono.arquivo && doDono.objetoId, "A entrega descartável deve estar acessível ao dono.");
  const resultado = await consultarEntrega(controle.pagina, doDono.objetoId);
  assert.equal(resultado.entrega, master, "Resultado inesperado para a leitura da entrega.");
  assert.equal(resultado.arquivo, master, "Resultado inesperado para a leitura do objeto.");
  console.log(master
    ? "PASSOU: master leu a entrega e o objeto vinculado."
    : "PASSOU: professor da mesma escola sem vínculo recebeu resultados vazios para entrega e objeto.");
  await aluno.contexto.storageState({ path: aluno.caminho });
}

async function testarAtualizacaoSemAlterarValor() {
  const aluno = await abrirSessao("aluno");
  const resultado = await aluno.pagina.evaluate(async ({ caminho, dono }) => {
    const { supabase } = await import(caminho);
    const { data: sessao, error: erroSessao } = await supabase.auth.getUser();
    if (erroSessao || sessao.user?.id !== dono) throw new Error("A sessão deve ser do aluno de teste.");
    const { data: atividade, error: erroAtividade } = await supabase.from("atividade")
      .select("id_atividade").eq("id_atividade", 26)
      .eq("titulo", "Teste RN08 — entrega avaliada").single();
    if (erroAtividade || !atividade) throw new Error("A atividade descartável não foi confirmada.");

    const ler = () => supabase.from("entrega_atividade")
      .select("id_entrega,id_objeto_storage,nota,feedback")
      .eq("id_atividade", atividade.id_atividade).eq("id_aluno", dono).single();
    const antes = await ler();
    if (antes.error || !antes.data || antes.data.nota === null) {
      throw new Error("A entrega descartável precisa estar avaliada.");
    }

    // Mesmo valor, na mesma entrega, para evitar mudança de conteúdo.
    const resposta = await supabase.from("entrega_atividade")
      .update({ feedback: antes.data.feedback })
      .eq("id_entrega", antes.data.id_entrega)
      .eq("id_atividade", atividade.id_atividade).eq("id_aluno", dono)
      .select("id_entrega");
    const depois = await ler();
    return {
      erro: resposta.error?.code ?? null,
      linhas: resposta.data?.length ?? null,
      preservada: !depois.error && JSON.stringify(antes.data) === JSON.stringify(depois.data),
    };
  }, { caminho: modulo, dono: alunoId });
  assert.ok(resultado.preservada, "A entrega descartável deve permanecer intacta.");
  assert.ok(resultado.erro === "42501" || (resultado.erro === null && resultado.linhas === 0),
    "A sessão de aluno não deve afetar a entrega avaliada.");
  console.log("PASSOU RN08: a atualização do aluno não afetou a linha avaliada; o estado foi preservado.");
  await aluno.contexto.storageState({ path: aluno.caminho });
}

async function testarEscolas() {
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
}

try {
  if (modo === "--professor-sem-vinculo" || modo === "--master") {
    await testarControleDocente();
  } else if (modo === "--rn08-regressao") {
    await testarAtualizacaoSemAlterarValor();
  } else {
    assert.equal(modo, undefined, "Modo de teste desconhecido.");
    await testarEscolas();
  }
} finally {
  await Promise.all([navegador.close(), navegadorControle?.close()]);
}
