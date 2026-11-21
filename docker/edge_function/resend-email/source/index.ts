import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAPA_HTML: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
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

function escaparHtml(valor: unknown): string {
  return String(valor ?? "").replace(/[&<>"']/g, (char) => MAPA_HTML[char]);
}

function sanitizarAssuntoEmail(valor: unknown): string {
  return String(valor ?? "")
    .replace(/[\r\n\u0000-\u001F\u007F]+/g, " ")
    .trim()
    .slice(0, 150);
}

function extrairIdInteiroPositivo(valor: unknown): number | null {
  const num = typeof valor === "number" ? valor : Number(valor);
  return Number.isInteger(num) && num > 0 ? num : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return respostaJson({ error: "Método não permitido." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return respostaJson(
        { error: "Configuração do Supabase ausente no servidor." },
        500,
      );
    }

    const token = extrairBearerToken(req.headers.get("Authorization"));
    if (!token) {
      return respostaJson({ error: "Token de autenticação ausente." }, 401);
    }

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return respostaJson({ error: "Usuário não autenticado." }, 401);
    }

    let payload: { id_denuncia?: unknown };
    try {
      payload = (await req.json()) as { id_denuncia?: unknown };
    } catch {
      return respostaJson({ error: "Corpo JSON inválido." }, 400);
    }

    const idDenuncia = extrairIdInteiroPositivo(payload?.id_denuncia);
    if (!idDenuncia) {
      return respostaJson({ error: "id_denuncia inválido." }, 400);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: denuncia, error: erroDenuncia } = await supabaseAdmin
      .from("denuncia")
      .select("id_denuncia, id_autor, id_denunciado, motivo, descricao, status")
      .eq("id_denuncia", idDenuncia)
      .maybeSingle();

    if (erroDenuncia) {
      console.error("Erro ao consultar denúncia:", erroDenuncia.message);
      return respostaJson({ error: "Falha ao consultar denúncia." }, 500);
    }

    if (!denuncia) {
      return respostaJson({ error: "Denúncia não encontrada." }, 404);
    }

    if (denuncia.id_autor !== user.id) {
      const { data: perfilChamador } = await supabaseAdmin
        .from("perfil")
        .select("role")
        .eq("id_perfil", user.id)
        .maybeSingle();

      if (perfilChamador?.role !== "master") {
        return respostaJson(
          { error: "Sem permissão para notificar esta denúncia." },
          403,
        );
      }
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const destinatarioEmail = Deno.env.get("DESTINATARIO_EMAIL");
    const remetenteEmail =
      Deno.env.get("RESEND_FROM_EMAIL") ||
      "NexusClass Alertas <onboarding@resend.dev>";

    if (!resendApiKey || !destinatarioEmail) {
      return respostaJson(
        { error: "Serviço de e-mail não configurado no ambiente." },
        503,
      );
    }

    const { data: perfis } = await supabaseAdmin
      .from("perfil")
      .select("id_perfil, nome, email, role")
      .in("id_perfil", [denuncia.id_autor, denuncia.id_denunciado]);

    const mapaPerfis = new Map(
      (perfis ?? []).map((p) => [p.id_perfil as string, p]),
    );
    const autor = mapaPerfis.get(denuncia.id_autor);
    const denunciado = mapaPerfis.get(denuncia.id_denunciado);

    const autorTexto = autor
      ? `${autor.nome} (${autor.email})`
      : denuncia.id_autor;
    const denunciadoTexto = denunciado
      ? `${denunciado.nome} (${denunciado.email})`
      : denuncia.id_denunciado;

    const motivoAssunto = sanitizarAssuntoEmail(denuncia.motivo || "Denúncia");
    const motivoHtml = escaparHtml(denuncia.motivo || "Não informado");
    const descricaoHtml = escaparHtml(
      denuncia.descricao || "Sem detalhes fornecidos.",
    ).replace(/\r?\n/g, "<br/>");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: remetenteEmail,
        to: [destinatarioEmail],
        subject: `Nova Denúncia #${denuncia.id_denuncia}: ${motivoAssunto}`,
        html: `
          <h2>Nova denúncia registrada no NexusClass (#${escaparHtml(denuncia.id_denuncia)})</h2>
          <p><strong>Denunciante:</strong> ${escaparHtml(autorTexto)}</p>
          <p><strong>Usuário Denunciado:</strong> ${escaparHtml(denunciadoTexto)}</p>
          <p><strong>Motivo:</strong> ${motivoHtml}</p>
          <p><strong>Status:</strong> ${escaparHtml(denuncia.status)}</p>
          <hr/>
          <p><strong>Descrição:</strong><br/>${descricaoHtml}</p>
        `,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };

    if (!res.ok) {
      console.error(
        "Erro Resend (resend-email):",
        res.status,
        data?.message ?? "falha sem detalhe",
      );
      return respostaJson(
        { error: "Falha ao entregar notificação de e-mail." },
        502,
      );
    }

    return respostaJson({ enviado: true, id: data?.id ?? null }, 200);
  } catch (error: unknown) {
    console.error("Erro na Edge Function resend-email:", error);
    return respostaJson(
      { error: "Erro interno ao enviar notificação." },
      500,
    );
  }
});
