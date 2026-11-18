import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKETS_ALUNO = [
  "entregas_atividades",
  "duvidasalunostoprofessor",
  "anexos_suporte",
] as const;

type StorageObjeto = {
  id: string;
  bucket_id: string;
  name: string;
};

function respostaJson(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function coletarIdsObjetosDoAluno(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<string[]> {
  const ids = new Set<string>();

  const [{ data: entregas }, { data: duvidas }, { data: tickets }] =
    await Promise.all([
      supabaseAdmin
        .from("entrega_atividade")
        .select("id_objeto_storage")
        .eq("id_aluno", userId),
      supabaseAdmin
        .from("duvida")
        .select("id_duvida")
        .eq("id_aluno", userId),
      supabaseAdmin
        .from("ticket_suporte")
        .select("id_suporte")
        .eq("id_perfil", userId),
    ]);

  for (const e of entregas ?? []) {
    if (e.id_objeto_storage) ids.add(e.id_objeto_storage);
  }

  const duvidaIds = (duvidas ?? []).map((d) => d.id_duvida);
  if (duvidaIds.length > 0) {
    const { data: duvidaAnexos } = await supabaseAdmin
      .from("duvida_anexo")
      .select("id_objeto_storage")
      .in("id_duvida", duvidaIds);

    for (const a of duvidaAnexos ?? []) {
      if (a.id_objeto_storage) ids.add(a.id_objeto_storage);
    }
  }

  const suporteIds = (tickets ?? []).map((t) => t.id_suporte);
  if (suporteIds.length > 0) {
    const { data: suporteAnexos } = await supabaseAdmin
      .from("ticket_suporte_anexo")
      .select("id_objeto_storage")
      .in("id_suporte", suporteIds);

    for (const a of suporteAnexos ?? []) {
      if (a.id_objeto_storage) ids.add(a.id_objeto_storage);
    }
  }

  return Array.from(ids);
}

async function limparStorageDoAluno(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<void> {
  const idsRelacionais = await coletarIdsObjetosDoAluno(supabaseAdmin, userId);

  const storageAdmin = supabaseAdmin.schema("storage");
  const objetosPorId = new Map<string, StorageObjeto>();

  if (idsRelacionais.length > 0) {
    const { data } = await storageAdmin
      .from("objects")
      .select("id, bucket_id, name")
      .in("id", idsRelacionais);

    for (const obj of (data ?? []) as StorageObjeto[]) {
      objetosPorId.set(obj.id, obj);
    }
  }

  const { data: objetosPorDono } = await storageAdmin
    .from("objects")
    .select("id, bucket_id, name")
    .eq("owner_id", userId)
    .in("bucket_id", [...BUCKETS_ALUNO]);

  for (const obj of (objetosPorDono ?? []) as StorageObjeto[]) {
    objetosPorId.set(obj.id, obj);
  }

  const caminhosPorBucket = new Map<string, string[]>();
  for (const obj of objetosPorId.values()) {
    if (!obj.bucket_id || !obj.name) continue;
    const atual = caminhosPorBucket.get(obj.bucket_id) ?? [];
    atual.push(obj.name);
    caminhosPorBucket.set(obj.bucket_id, atual);
  }

  for (const [bucket, caminhos] of caminhosPorBucket.entries()) {
    if (caminhos.length > 0) {
      await supabaseAdmin.storage.from(bucket).remove(caminhos);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return respostaJson({ error: "Cabeçalho de autorização ausente" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return respostaJson(
        { error: "Variáveis de ambiente do Supabase não configuradas no servidor" },
        500,
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return respostaJson({ error: "Sessão inválida ou expirada" }, 401);
    }

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from("perfil")
      .select("role")
      .eq("id_perfil", user.id)
      .single();

    if (perfilError || !perfil) {
      return respostaJson({ error: "Perfil não encontrado no sistema" }, 404);
    }

    if (perfil.role !== "aluno") {
      return respostaJson(
        { error: "Ação não permitida para este tipo de conta" },
        403,
      );
    }

    // 1. Remover arquivos físicos dos buckets privados via Storage API antes do CASCADE
    try {
      await limparStorageDoAluno(supabaseAdmin, user.id);
    } catch (err) {
      console.error("Erro ao limpar objetos do Storage:", err);
    }

    // 2. Excluir usuário em auth.users: ON DELETE CASCADE limpa Perfil e todas as tabelas filhas
    const { error: deleteUserError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      throw deleteUserError;
    }

    return respostaJson(
      { message: "Conta e dados deletados com sucesso" },
      200,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro interno do servidor";
    console.error("Erro na Edge Function deletar-conta:", error);
    return respostaJson({ error: message }, 500);
  }
});
