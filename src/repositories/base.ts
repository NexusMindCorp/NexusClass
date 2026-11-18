import type { Database } from "@/lib/database.types";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ClienteSupabaseTipado = SupabaseClient<Database>;

export function resolverClienteSupabase(
  client?: ClienteSupabaseTipado | null,
): ClienteSupabaseTipado {
  if (client) return client;
  if (!hasSupabaseConfig || !supabase) {
    throw new Error(
      "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}

export function extrairMensagemErroRepo(
  erro: unknown,
  fallback = "Operação não concluída.",
): string {
  if (erro instanceof Error && erro.message) return erro.message;
  if (
    erro &&
    typeof erro === "object" &&
    "message" in erro &&
    typeof (erro as { message?: unknown }).message === "string"
  ) {
    return (erro as { message: string }).message;
  }
  return fallback;
}

export function traduzirErroMatricula(erro: unknown): Error {
  const msg = extrairMensagemErroRepo(erro, "Erro ao atualizar matrícula.");
  if (msg.includes("RN12") || msg.toLowerCase().includes("escolas diferentes")) {
    return new Error(
      "Você só pode se matricular em turmas da sua escola (RN12).",
    );
  }
  return erro instanceof Error ? erro : new Error(msg);
}
