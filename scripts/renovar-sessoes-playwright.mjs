import { readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const chave = process.env.VITE_SUPABASE_ANON_KEY;
const papeis = new Set(["aluno", "professor", "aluno-escola-3", "controle-dcc000"]);
const selecionados = process.argv.slice(2);
const pasta = join(process.env.LOCALAPPDATA ?? homedir(), "NexusClass", "playwright");
if (!url || !chave || !selecionados.length || selecionados.some((papel) => !papeis.has(papel))) {
  throw new Error("Informe os papéis cadastrados e carregue a configuração pública do projeto de teste.");
}
const chaveSessao = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;

for (const papel of new Set(selecionados)) {
  const caminho = join(pasta, `${papel}.json`);
  const estado = JSON.parse(await readFile(caminho, "utf8"));
  const entrada = estado.origins.find((item) => item.origin === "http://localhost:5173")
    ?.localStorage.find((item) => item.name === chaveSessao);
  const anterior = entrada && JSON.parse(entrada.value);
  if (!anterior?.refresh_token || !anterior.user?.id) {
    console.error(`BLOQUEADO ${papel}: sessão do projeto de teste não encontrada.`);
    process.exitCode = 1;
    continue;
  }
  if (anterior.expires_at * 1000 > Date.now() + 60_000) {
    console.log(`PASSOU ${papel}: sessão ainda válida.`);
    continue;
  }

  const cliente = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await cliente.auth.refreshSession({ refresh_token: anterior.refresh_token });
  if (error || !data.session || data.user?.id !== anterior.user.id) {
    console.error(`BLOQUEADO ${papel}: renovação recusada (${error?.code ?? "sessao_invalida"}).`);
    process.exitCode = 1;
    continue;
  }
  entrada.value = JSON.stringify(data.session);
  const temporario = `${caminho}.${process.pid}.tmp`;
  await writeFile(temporario, JSON.stringify(estado), { flag: "wx", mode: 0o600 });
  await rename(temporario, caminho);
  console.log(`PASSOU ${papel}: sessão renovada.`);
}
