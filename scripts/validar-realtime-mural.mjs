import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { expect } from "@playwright/test";

const pasta = join(process.env.LOCALAPPDATA ?? homedir(), "NexusClass", "playwright");
const url = "http://localhost:5173/NexusClassWeb/";
const browser = await chromium.launch({ channel: "msedge" });
const publicacao = `[Teste descartável Fase 6] Realtime DCC000 ${randomUUID()}`;

async function criarSessao(papel) {
  const caminho = join(pasta, `${papel}.json`);
  const estado = JSON.parse(await readFile(caminho, "utf8"));
  const contexto = await browser.newContext({ storageState: estado });
  return { contexto, caminho, pagina: await contexto.newPage() };
}

async function abrirMural(pagina) {
  await pagina.goto(url, { waitUntil: "domcontentloaded" });
  const atalho = pagina.getByRole("button", { name: /Banco de Dados - 2026\.3/ });
  await expect(atalho).toBeVisible({ timeout: 25_000 });
  await atalho.click();
  await expect(pagina.getByRole("button", { name: "Postar no mural", exact: true })).toBeVisible();
}

try {
  const aluno = await criarSessao("aluno");
  const professor = await criarSessao("professor");
  const canal = { inscrito: false };
  aluno.pagina.on("websocket", (socket) => {
    if (!new URL(socket.url()).pathname.includes("/realtime/")) return;
    socket.on("framereceived", ({ payload }) => {
      const texto = payload.toString();
      if (texto.includes("realtime:mural_post") && texto.includes("phx_reply")
          && /"status"\s*:\s*"ok"/.test(texto)) canal.inscrito = true;
    });
  });
  await Promise.all([abrirMural(aluno.pagina), abrirMural(professor.pagina)]);
  await expect.poll(() => canal.inscrito, { timeout: 25_000 }).toBe(true);

  await professor.pagina.getByRole("button", { name: "Postar no mural", exact: true }).click();
  await professor.pagina.getByPlaceholder("Escreva sua mensagem aqui...").fill(publicacao);
  await professor.pagina.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(professor.pagina.getByText(publicacao, { exact: true })).toBeVisible();
  console.log("PASSOU: professor publicou o marcador descartável.");

  const aviso = aluno.pagina.locator("[data-sonner-toast]").filter({ hasText: "O mural foi atualizado!" });
  await expect(aviso).toBeVisible({ timeout: 15_000 });
  await aviso.getByRole("button", { name: "Carregar", exact: true }).click();
  await expect(aluno.pagina.getByText(publicacao, { exact: true })).toBeVisible();
  console.log("PASSOU: aluno recebeu a notificação Realtime e carregou a publicação sem recarregar a página.");
  await Promise.all([aluno, professor].map(({ contexto, caminho }) => contexto.storageState({ path: caminho })));
} finally {
  await browser.close();
}
