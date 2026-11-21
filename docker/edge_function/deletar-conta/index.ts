import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TAMANHO_LOTE_STORAGE = 100;

type ObjetoStoragePerfil = {
  id_objeto_storage: string;
  bucket_id: string;
  caminho: string;
};

type FalhaLimpezaStorage = {
  bucket: string;
  caminhos: string[];
  erro: string;
};

type ResultadoLimpezaStorage = {
  removidos: number;
  comFalha: number;
  falhas: FalhaLimpezaStorage[];
};

function respostaJson(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extrairBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  const token = match?.[1]?.trim();
  return token && token.length > 0 ? token : null;
}

function agruparCaminhosPorBucket(
  objetos: ObjetoStoragePerfil[],
): Map<string, string[]> {
  const porBucket = new Map<string, Set<string>>();

  for (const obj of objetos) {
    if (!obj.bucket_id || !obj.caminho) continue;
    const conjunto = porBucket.get(obj.bucket_id) ?? new Set<string>();
    conjunto.add(obj.caminho);
    porBucket.set(obj.bucket_id, conjunto);
  }

  const resultado = new Map<string, string[]>();
  for (const [bucket, conjunto] of porBucket.entries()) {
    resultado.set(bucket, Array.from(conjunto));
  }

  return resultado;
}

async function removerObjetosStorageEmLotes(
  supabaseAdmin: ReturnType<typeof createClient>,
  caminhosPorBucket: Map<string, string[]>,
): Promise<ResultadoLimpezaStorage> {
  let removidos = 0;
  let comFalha = 0;
  const falhas: FalhaLimpezaStorage[] = [];

  for (const [bucket, caminhos] of caminhosPorBucket.entries()) {
    for (let i = 0; i < caminhos.length; i += TAMANHO_LOTE_STORAGE) {
      const lote = caminhos.slice(i, i + TAMANHO_LOTE_STORAGE);
      try {
        const { error } = await supabaseAdmin.storage.from(bucket).remove(lote);
        if (error) {
          comFalha += lote.length;
          falhas.push({ bucket, caminhos: lote, erro: error.message });
        } else {
          removidos += lote.length;
        }
      } catch (err: unknown) {
        const mensagem = err instanceof Error ? err.message : String(err);
        comFalha += lote.length;
        falhas.push({ bucket, caminhos: lote, erro: mensagem });
      }
    }
  }

  return { removidos, comFalha, falhas };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return respostaJson({ error: "Método não permitido. Utilize POST." }, 405);
  }

  try {
    const token = extrairBearerToken(req.headers.get("Authorization"));
    if (!token) {
      return respostaJson(
        { error: "Cabeçalho de autorização ausente ou inválido" },
        401,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return respostaJson(
        {
          error:
            "Variáveis de ambiente do Supabase não configuradas no servidor",
        },
        500,
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Pré-validações somente-leitura (nenhum efeito colateral em caso de falha)
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

    // 2. Coleta prévia dos arquivos do aluno via RPC exclusiva de service_role
    const { data: objetosRaw, error: listarStorageError } =
      await supabaseAdmin.rpc("listar_objetos_storage_perfil", {
        p_id_perfil: user.id,
      });

    if (listarStorageError) {
      console.error(
        "Erro ao listar objetos do Storage via RPC antes da exclusão:",
        listarStorageError,
      );
      return respostaJson(
        { error: "Falha ao preparar a limpeza dos arquivos da conta" },
        500,
      );
    }

    const caminhosPorBucket = agruparCaminhosPorBucket(
      (objetosRaw ?? []) as ObjetoStoragePerfil[],
    );

    // 3. Ponto de commit atômico (ACID): auth.users -> ON DELETE CASCADE em Perfil e filhas.
    //    Se falhar aqui, o PostgreSQL desfaz tudo automaticamente e o Storage segue intacto.
    const { error: deleteUserError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      console.error("Erro ao excluir usuário em auth.users:", deleteUserError);
      return respostaJson(
        { error: "Não foi possível excluir a conta no momento" },
        500,
      );
    }

    // 4. Remoção física no Storage pós-commit em lotes com verificação explícita de erro
    const limpeza = await removerObjetosStorageEmLotes(
      supabaseAdmin,
      caminhosPorBucket,
    );

    if (limpeza.falhas.length > 0) {
      console.error(
        "Limpeza parcial de Storage após exclusão de conta:",
        JSON.stringify({
          userId: user.id,
          removidos: limpeza.removidos,
          comFalha: limpeza.comFalha,
          falhas: limpeza.falhas,
        }),
      );
    }

    return respostaJson(
      {
        message: "Conta e dados deletados com sucesso",
        storage_limpeza_parcial: limpeza.falhas.length > 0,
        arquivos_removidos: limpeza.removidos,
        arquivos_com_falha: limpeza.comFalha,
      },
      200,
    );
  } catch (error: unknown) {
    console.error("Erro inesperado na Edge Function deletar-conta:", error);
    return respostaJson({ error: "Erro interno do servidor" }, 500);
  }
});
