import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { setTimeout as esperar } from "node:timers/promises";
import { chromium } from "playwright";
import { expect } from "@playwright/test";

const fuso = "America/Sao_Paulo";
const exigirRealtime = process.argv.includes("--exigir-realtime");
const somenteCincoMinutos = process.argv.includes("--somente-5-min");
const pessoal = process.argv.includes("--pessoal");
const outraEscola = process.argv.includes("--outra-escola");
assert.ok(!outraEscola || (!pessoal && !somenteCincoMinutos),
  "O controle de outra escola usa evento de turma e aviso de 1 minuto.");
const pasta = join(process.env.LOCALAPPDATA ?? homedir(), "NexusClass", "playwright");
const titulo = `[Teste descartável Fase 6] Aviso ${pessoal ? "pessoal" : "DCC000"} ${randomUUID()}`;
const navegador = await chromium.launch({ channel: "msedge" });
let navegadorControle;

async function criarSessao(papel) {
  const caminho = join(pasta, `${papel}.json`);
  const storageState = JSON.parse(await readFile(caminho, "utf8"));
  const contexto = await navegador.newContext({ storageState, timezoneId: fuso, locale: "en-US" });
  return { caminho, contexto, pagina: await contexto.newPage() };
}

async function abrirAplicacao(pagina, tempo = 25_000) {
  await pagina.goto("http://localhost:5173/NexusClassWeb/", { waitUntil: "domcontentloaded" });
  await expect(pagina.getByRole("link", { name: "Calendario", exact: true })).toBeVisible({ timeout: tempo });
}

async function criarControleOutraEscola() {
  const caminho = join(pasta, "aluno-escola-3.json");
  const estado = await readFile(caminho, "utf8").then(JSON.parse, (erro) => {
    if (erro.code !== "ENOENT") throw erro;
    return undefined;
  });
  const browser = estado ? navegador : (navegadorControle = await chromium.launch({
    channel: "msedge", headless: false,
  }));
  const contexto = await browser.newContext({ storageState: estado, timezoneId: fuso, locale: "en-US" });
  const pagina = await contexto.newPage();
  if (!estado) console.log("Entre como jae@nexus.com na janela aberta. O roteiro guarda e reutiliza a sessão.");
  return { caminho, contexto, pagina, novoLogin: !estado };
}

async function abrirControle(controle) {
  await abrirAplicacao(controle.pagina, controle.novoLogin ? 5 * 60_000 : 25_000);
  const estado = await controle.contexto.storageState();
  const origens = estado.origins.filter((entrada) => entrada.origin === "http://localhost:5173");
  const sessao = origens.flatMap((entrada) => entrada.localStorage)
    .find((item) => /^sb-.+-auth-token$/.test(item.name));
  assert.equal(sessao && JSON.parse(sessao.value).user?.email, "jae@nexus.com",
    "A sessão aberta deve ser da conta de controle da escola 3.");
  await controle.contexto.storageState({ path: controle.caminho });
  console.log("PASSOU: sessão da escola 3 confirmada e guardada.");
}

function dadosHorario(data) {
  const formato = new Intl.DateTimeFormat("en-GB", {
    timeZone: fuso,
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const [hora, minuto] = formato.format(data).split(":");
  return { dia: data.toLocaleDateString("en-US", { timeZone: fuso }), hora, minuto };
}

async function selecionar(pagina, valorAtual, opcao) {
  await pagina.getByRole("combobox").filter({ hasText: valorAtual }).click();
  await pagina.getByRole("option", { name: opcao, exact: true }).click();
}

function observarCanal(pagina) {
  const webSocket = { inscrito: false, alertas: new Map() };
  pagina.on("websocket", (socket) => {
    if (!new URL(socket.url()).pathname.includes("/realtime/")) return;
    socket.on("framereceived", ({ payload }) => {
      const texto = payload.toString();
      if (!texto.includes("alertas-calendario-5-min")) return;
      if (texto.includes("phx_reply") && /"status"\s*:\s*"ok"/.test(texto)) webSocket.inscrito = true;
      const momento = texto.match(/"minutos_antes"\s*:\s*(1|5)\b/)?.[1];
      if (texto.includes(titulo) && momento) {
        webSocket.alertas.set(momento, (webSocket.alertas.get(momento) ?? 0) + 1);
      }
    });
  });
  return webSocket;
}

async function observarAvisos(pagina) {
  await pagina.addInitScript((marcador) => {
    const vistos = new WeakSet();
    window.avisosNexusClassE2E = 0;
    const registrar = () => {
      for (const aviso of document.querySelectorAll("[data-sonner-toast]")) {
        if (!vistos.has(aviso) && aviso.textContent?.includes(marcador) && /1 minuto\b/.test(aviso.textContent)) {
          vistos.add(aviso);
          window.avisosNexusClassE2E++;
        }
      }
    };
    new MutationObserver(registrar).observe(document, { subtree: true, childList: true, characterData: true });
  }, titulo);
}

try {
  const aluno = await criarSessao("aluno");
  const professor = await criarSessao("professor");
  const controle = outraEscola ? await criarControleOutraEscola() : null;
  const canalAluno = observarCanal(aluno.pagina);
  const canalProfessor = observarCanal(professor.pagina);
  const canalControle = controle ? observarCanal(controle.pagina) : null;
  if (pessoal) await Promise.all([observarAvisos(aluno.pagina), observarAvisos(professor.pagina)]);
  if (controle) await Promise.all([observarAvisos(aluno.pagina), observarAvisos(controle.pagina)]);
  await Promise.all([
    abrirAplicacao(aluno.pagina), abrirAplicacao(professor.pagina),
    controle && abrirControle(controle),
  ]);
  await expect.poll(() => canalAluno.inscrito
    && (!pessoal || canalProfessor.inscrito)
    && (!canalControle || canalControle.inscrito), { timeout: 25_000 }).toBe(true);

  const tela = professor.pagina;
  await tela.getByRole("link", { name: "Calendario", exact: true }).click();
  // Dar ao cron uma execução completa antes da janela do lembrete.
  const antecedencia = pessoal || outraEscola ? 155_000 : 395_000;
  const data = new Date(Math.ceil((Date.now() + antecedencia) / 60_000) * 60_000);
  const { dia, hora, minuto } = dadosHorario(data);
  await tela.locator(`button[data-day="${dia}"]`).click();
  await tela.getByLabel("Título do evento").fill(titulo);
  if (!pessoal) {
    await selecionar(tela, /Selecione o tipo|Evento Pessoal/, "Evento para Turma");
    await selecionar(tela, "Selecione a turma", "Banco de Dados");
  }
  await selecionar(tela, "Hora", hora);
  // A seleção da hora preenche o minuto inicial como 00.
  if (minuto !== "00") await selecionar(tela, /^00$|Min/, minuto);

  const [resposta] = await Promise.all([
    tela.waitForResponse((r) =>
      new URL(r.url()).pathname.endsWith("/rest/v1/evento_calendario")
      && r.request().method() === "POST"),
    tela.getByRole("button", { name: "Marcar evento" }).click(),
  ]);
  assert.ok(resposta.ok(), `O cadastro do evento retornou HTTP ${resposta.status()}.`);
  const corpo = await resposta.json();
  assert.equal(corpo.tipo, pessoal ? "pessoal" : "turma");
  console.log(`PASSOU: evento descartável salvo (ID ${corpo.id_evento}, horário ${hora}:${minuto} em ${fuso}).`);

  const destinatario = pessoal ? professor.pagina : aluno.pagina;
  const webSocket = pessoal ? canalProfessor : canalAluno;
  const verificacoes = pessoal || outraEscola ? [["1", 180_000]]
    : somenteCincoMinutos ? [["5", 180_000]] : [["5", 180_000], ["1", 315_000]];
  for (const [momento, limite] of verificacoes) {
    const aviso = destinatario.locator("[data-sonner-toast]").filter({ hasText: titulo })
      .filter({ hasText: momento === "5" ? /5 minutos/ : /1 minuto\b/ });
    try {
      await expect(aviso).toBeVisible({ timeout: limite });
      const texto = await aviso.innerText();
      const origem = texto.includes("começa em") ? "banco" : "local";
      console.log(`PASSOU: ${pessoal ? "professor" : "aluno"} viu aviso de ${momento} minuto(s) (${origem}); eventos Realtime recebidos: ${webSocket.alertas.get(momento) ?? 0}.`);
    } catch {
      console.error(`FALHOU: aviso de ${momento} minuto(s) ausente; eventos Realtime recebidos: ${webSocket.alertas.get(momento) ?? 0}.`);
      process.exitCode = 1;
    }
  }
  if (pessoal || controle) {
    await esperar(Math.max(0, data.getTime() + 15_000 - Date.now()));
    const paginaSemVinculo = controle?.pagina ?? aluno.pagina;
    const [avisosDestinatario, avisosSemVinculo] = await Promise.all(
      [destinatario, paginaSemVinculo].map((pagina) => pagina.evaluate(() => window.avisosNexusClassE2E)),
    );
    const eventosSemVinculo = (canalControle ?? canalAluno).alertas.get("1") ?? 0;
    console.log(`Até 15s após o evento: destinatário viu ${avisosDestinatario} aviso(s); conta de controle recebeu ${eventosSemVinculo} evento(s) e viu ${avisosSemVinculo} aviso(s).`);
    if (avisosDestinatario !== 1 || eventosSemVinculo !== 0 || avisosSemVinculo !== 0) process.exitCode = 1;
  }
  if (exigirRealtime || pessoal || outraEscola) {
    for (const [momento] of verificacoes) {
      const recebidos = webSocket.alertas.get(momento) ?? 0;
      if (recebidos !== 1) {
        console.error(`FALHOU Realtime: esperado um evento de ${momento} minuto(s); recebidos: ${recebidos}.`);
        process.exitCode = 1;
      }
    }
  }
  await Promise.all([aluno, professor, ...(controle ? [controle] : [])]
    .map(({ contexto, caminho }) => contexto.storageState({ path: caminho })));
} finally {
  await Promise.all([navegador.close(), navegadorControle?.close()]);
}
