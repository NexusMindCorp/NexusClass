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

const EXPIRACAO_LINK_ANEXO_SEGUNDOS = 60 * 60 * 24 * 7;

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

function obterUrlHttpSegura(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const limpa = url.trim();
  if (!limpa || /[\s<>"'\u0000-\u001F\u007F]/.test(limpa)) return null;
  try {
    const parsed = new URL(limpa);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    if (parsed.username || parsed.password) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function extrairIdInteiroPositivo(valor: unknown): number | null {
  const num = typeof valor === "number" ? valor : Number(valor);
  return Number.isInteger(num) && num > 0 ? num : null;
}

function extrairNomeArquivo(caminho: string): string {
  const partes = caminho.split("/");
  return partes[partes.length - 1] || "Anexo";
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

    let payload: { id_suporte?: unknown };
    try {
      payload = (await req.json()) as { id_suporte?: unknown };
    } catch {
      return respostaJson({ error: "Corpo JSON inválido." }, 400);
    }

    const idSuporte = extrairIdInteiroPositivo(payload?.id_suporte);
    if (!idSuporte) {
      return respostaJson({ error: "id_suporte inválido." }, 400);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: ticket, error: erroTicket } = await supabaseAdmin
      .from("ticket_suporte")
      .select("id_suporte, id_perfil, assunto, mensagem, status")
      .eq("id_suporte", idSuporte)
      .maybeSingle();

    if (erroTicket) {
      console.error("Erro ao consultar chamado:", erroTicket.message);
      return respostaJson({ error: "Falha ao consultar chamado." }, 500);
    }

    if (!ticket) {
      return respostaJson({ error: "Chamado de suporte não encontrado." }, 404);
    }

    if (ticket.id_perfil !== user.id) {
      const { data: perfilChamador } = await supabaseAdmin
        .from("perfil")
        .select("role")
        .eq("id_perfil", user.id)
        .maybeSingle();

      if (perfilChamador?.role !== "master") {
        return respostaJson(
          { error: "Sem permissão para notificar este chamado." },
          403,
        );
      }
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const destinatarioEmail = Deno.env.get("DESTINATARIO_EMAIL");
    const remetenteEmail =
      Deno.env.get("RESEND_FROM_EMAIL") ||
      "NexusClass Suporte <onboarding@resend.dev>";

    if (!resendApiKey || !destinatarioEmail) {
      return respostaJson(
        { error: "Serviço de e-mail não configurado no ambiente." },
        503,
      );
    }

    const { data: perfilAutor } = await supabaseAdmin
      .from("perfil")
      .select("nome, email, role")
      .eq("id_perfil", ticket.id_perfil)
      .maybeSingle();

    const { data: anexosRows } = await supabaseAdmin
      .from("ticket_suporte_anexo")
      .select("id_objeto_storage")
      .eq("id_suporte", ticket.id_suporte);

    const idsObjetos = (anexosRows ?? [])
      .map((a) => a.id_objeto_storage as string)
      .filter(Boolean);

    const linksSeguros: string[] = [];
    if (idsObjetos.length > 0) {
      const { data: objetos } = await supabaseAdmin
        .from("v_storage_objetos")
        .select("id, bucket_id, name")
        .in("id", idsObjetos);

      const caminhos = (objetos ?? [])
        .filter((o) => o.bucket_id === "anexos_suporte" && typeof o.name === "string")
        .map((o) => o.name as string);

      if (caminhos.length > 0) {
        const { data: assinados } = await supabaseAdmin.storage
          .from("anexos_suporte")
          .createSignedUrls(caminhos, EXPIRACAO_LINK_ANEXO_SEGUNDOS);

        for (const item of assinados ?? []) {
          const urlSegura = obterUrlHttpSegura(item.signedUrl);
          if (!urlSegura) continue;
          const rotulo = extrairNomeArquivo(item.path ?? "Anexo");
          linksSeguros.push(
            `<a href="${escaparHtml(urlSegura)}" target="_blank" rel="noopener noreferrer">${escaparHtml(rotulo)}</a>`,
          );
        }
      }
    }

    const anexosHtml =
      linksSeguros.length > 0
        ? `
          <hr/>
          <p><strong>Anexos (links válidos por 7 dias):</strong></p>
          ${linksSeguros.join("<br/>")}
        `
        : "";

    const nomeHtml = escaparHtml(perfilAutor?.nome ?? "Não informado");
    const emailHtml = escaparHtml(perfilAutor?.email ?? "Não informado");
    const assuntoTexto = sanitizarAssuntoEmail(ticket.assunto || "Suporte");
    const assuntoHtml = escaparHtml(ticket.assunto || "Sem assunto");
    const mensagemHtml = escaparHtml(ticket.mensagem ?? "").replace(
      /\r?\n/g,
      "<br/>",
    );

    const bodyResend: Record<string, unknown> = {
      from: remetenteEmail,
      to: [destinatarioEmail],
      subject: `Novo Chamado #${ticket.id_suporte}: ${assuntoTexto}`,
      html: `
        <h2>Novo Pedido de Suporte/Contato (#${escaparHtml(ticket.id_suporte)})</h2>
        <p><strong>Nome do Usuário:</strong> ${nomeHtml}</p>
        <p><strong>E-mail para Retorno:</strong> ${emailHtml}</p>
        <p><strong>Assunto:</strong> ${assuntoHtml}</p>
        <hr/>
        <p><strong>Mensagem:</strong><br/>${mensagemHtml}</p>
        ${anexosHtml}
      `,
    };

    if (
      typeof perfilAutor?.email === "string" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(perfilAutor.email.trim())
    ) {
      bodyResend.reply_to = perfilAutor.email.trim();
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(bodyResend),
    });

    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };

    if (!res.ok) {
      console.error(
        "Erro Resend (resend-suport):",
        res.status,
        data?.message ?? "falha sem detalhe",
      );
      return respostaJson(
        { error: "Falha ao entregar e-mail do chamado." },
        502,
      );
    }

    return respostaJson(
      {
        enviado: true,
        id: data?.id ?? null,
        anexos: linksSeguros.length,
      },
      200,
    );
  } catch (error: unknown) {
    console.error("Erro na Edge Function resend-suport:", error);
    return respostaJson(
      { error: "Erro interno ao enviar chamado." },
      500,
    );
  }
});
