import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { expect } from "@playwright/test";

const fuso = "America/Sao_Paulo";
const exigirRealtime = process.argv.includes("--exigir-realtime");
const somenteCincoMinutos = process.argv.includes("--somente-5-min");
const pasta = join(process.env.LOCALAPPDATA ?? homedir(), "NexusClass", "playwright");
const titulo = `[Teste descartável Fase 6] Aviso DCC000 ${randomUUID()}`;
const navegador = await chromium.launch({ channel: "msedge" });

async function criarSessao(papel) {
  const caminho = join(pasta, `${papel}.json`);
  const storageState = JSON.parse(await readFile(caminho, "utf8"));
  const contexto = await navegador.newContext({ storageState, timezoneId: fuso, locale: "en-US" });
  return { caminho, contexto, pagina: await contexto.newPage() };
}

async function abrirAplicacao(pagina) {
  await pagina.goto("http://localhost:5173/NexusClassWeb/", { waitUntil: "domcontentloaded" });
  await expect(pagina.getByRole("link", { name: "Calendario", exact: true })).toBeVisible({ timeout: 25_000 });
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

try {
  const aluno = await criarSessao("aluno");
  const professor = await criarSessao("professor");
  const webSocket = { inscrito: false, alertas: new Map() };
  aluno.pagina.on("websocket", (socket) => {
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
  await Promise.all([abrirAplicacao(aluno.pagina), abrirAplicacao(professor.pagina)]);
  await expect.poll(() => webSocket.inscrito, { timeout: 25_000 }).toBe(true);

  const tela = professor.pagina;
  await tela.getByRole("link", { name: "Calendario", exact: true }).click();
  // Dar ao cron uma execução completa antes da janela de cinco minutos.
  const data = new Date(Math.ceil((Date.now() + 395_000) / 60_000) * 60_000);
  const { dia, hora, minuto } = dadosHorario(data);
  await tela.locator(`button[data-day="${dia}"]`).click();
  await tela.getByLabel("Título do evento").fill(titulo);
  await selecionar(tela, /Selecione o tipo|Evento Pessoal/, "Evento para Turma");
  await selecionar(tela, "Selecione a turma", "Banco de Dados");
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
  console.log(`PASSOU: evento descartável salvo (ID ${corpo.id_evento}, horário ${hora}:${minuto} em ${fuso}).`);

  const verificacoes = somenteCincoMinutos ? [["5", 180_000]] : [["5", 180_000], ["1", 315_000]];
  for (const [momento, limite] of verificacoes) {
    const aviso = aluno.pagina.locator("[data-sonner-toast]").filter({ hasText: titulo })
      .filter({ hasText: momento === "5" ? /5 minutos/ : /1 minuto\b/ });
    try {
      await expect(aviso).toBeVisible({ timeout: limite });
      const texto = await aviso.innerText();
      const origem = texto.includes("começa em") ? "banco" : "local";
      console.log(`PASSOU: aluno viu aviso de ${momento} minuto(s) (${origem}); eventos Realtime recebidos: ${webSocket.alertas.get(momento) ?? 0}.`);
    } catch {
      console.error(`FALHOU: aviso de ${momento} minuto(s) ausente; eventos Realtime recebidos: ${webSocket.alertas.get(momento) ?? 0}.`);
      process.exitCode = 1;
    }
  }
  if (exigirRealtime) {
    for (const [momento] of verificacoes) {
      const recebidos = webSocket.alertas.get(momento) ?? 0;
      if (recebidos !== 1) {
        console.error(`FALHOU Realtime: esperado um evento de ${momento} minuto(s); recebidos: ${recebidos}.`);
        process.exitCode = 1;
      }
    }
  }
  await Promise.all([aluno, professor].map(({ contexto, caminho }) => contexto.storageState({ path: caminho })));
} finally {
  await navegador.close();
}
