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

function parseDestinatarios(valor: string | undefined): string[] {
  if (!valor) return [];
  const validos = valor
    .split(/[,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
  return Array.from(new Set(validos));
}

function extrairNomeArquivo(caminho: string): string {
  const partes = caminho.split("/");
  return partes[partes.length - 1] || "Anexo";
}

function formatarDataBrasil(iso?: string | null): string {
  const data = iso ? new Date(iso) : new Date();
  if (Number.isNaN(data.getTime())) return "Agora";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

function montarHtmlSuporte(dados: {
  idSuporte: number;
  nome: string;
  email: string;
  role: string;
  assunto: string;
  status: string;
  mensagemHtml: string;
  anexos: Array<{ nome: string; url: string }>;
  dataFormatada: string;
}): string {
  const blocoAnexos =
    dados.anexos.length > 0
      ? `
        <div style="margin-top:22px;">
          <p style="margin:0 0 10px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#52525b;">Anexos enviados (${dados.anexos.length}) · links válidos por 7 dias</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${dados.anexos
              .map(
                (anexo) => `
                <tr>
                  <td style="padding:0 0 8px 0;">
                    <a href="${escaparHtml(anexo.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#eef2ff;color:#3730a3;border:1px solid #c7d2fe;border-radius:8px;padding:9px 14px;font-size:13px;font-weight:600;text-decoration:none;">
                      Visualizar anexo: ${escaparHtml(anexo.nome)}
                    </a>
                  </td>
                </tr>`,
              )
              .join("")}
          </table>
        </div>
      `
      : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Novo Chamado #${escaparHtml(dados.idSuporte)} — NexusClass</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e4e4e7;box-shadow:0 4px 14px rgba(24,24,27,0.06);">
          <tr>
            <td style="background-color:#4338ca;background-image:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:26px 28px;color:#ffffff;">
              <span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background-color:rgba(255,255,255,0.18);color:#eef2ff;padding:4px 10px;border-radius:999px;">Central de Suporte · Novo Chamado</span>
              <h1 style="margin:12px 0 4px 0;font-size:22px;line-height:1.3;font-weight:700;color:#ffffff;">Chamado #${escaparHtml(dados.idSuporte)} — ${escaparHtml(dados.assunto)}</h1>
              <p style="margin:0;font-size:13px;color:#e0e7ff;">Aberto em ${escaparHtml(dados.dataFormatada)} (horário de Brasília)</p>
            </td>
          </tr>

          <tr>
            <td style="padding:26px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:10px;margin-bottom:20px;">
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;width:34%;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Solicitante</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:14px;color:#18181b;">
                    <strong>${escaparHtml(dados.nome)}</strong>
                    <span style="display:inline-block;margin-left:6px;font-size:11px;font-weight:600;background-color:#f4f4f5;color:#52525b;border:1px solid #d4d4d8;padding:1px 8px;border-radius:999px;text-transform:capitalize;">${escaparHtml(dados.role)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">E-mail de Retorno</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:14px;color:#3730a3;font-weight:500;">${escaparHtml(dados.email)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Status</td>
                  <td style="padding:12px 16px;">
                    <span style="display:inline-block;font-size:12px;font-weight:600;background-color:#dbeafe;color:#1e40af;border:1px solid #bfdbfe;padding:3px 10px;border-radius:999px;text-transform:capitalize;">${escaparHtml(dados.status)}</span>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#52525b;">Mensagem do usuário</p>
              <div style="background-color:#f8fafc;border-left:4px solid #4f46e5;border-radius:0 8px 8px 0;padding:16px 18px;font-size:14px;line-height:1.65;color:#27272a;word-break:break-word;">
                ${dados.mensagemHtml}
              </div>

              ${blocoAnexos}
            </td>
          </tr>

          <tr>
            <td style="background-color:#fafafa;border-top:1px solid #e4e4e7;padding:18px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#71717a;line-height:1.5;">
                Você pode responder diretamente a este e-mail (<strong>Reply-To</strong> configurado para o solicitante).<br/>
                Notificação automática da plataforma <strong>NexusClass</strong>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
      .select("id_suporte, id_perfil, assunto, mensagem, status, created_at")
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
    const destinatarios = parseDestinatarios(Deno.env.get("DESTINATARIO_EMAIL"));
    const remetenteEmail =
      Deno.env.get("RESEND_FROM_EMAIL") ||
      "NexusClass Suporte <onboarding@resend.dev>";

    if (!resendApiKey || destinatarios.length === 0) {
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

    const anexosSeguros: Array<{ nome: string; url: string }> = [];
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
          anexosSeguros.push({
            nome: extrairNomeArquivo(item.path ?? "Anexo"),
            url: urlSegura,
          });
        }
      }
    }

    const assuntoTexto = sanitizarAssuntoEmail(ticket.assunto || "Suporte");
    const mensagemHtml = escaparHtml(ticket.mensagem ?? "").replace(
      /\r?\n/g,
      "<br/>",
    );

    const html = montarHtmlSuporte({
      idSuporte: ticket.id_suporte,
      nome: perfilAutor?.nome ?? "Não informado",
      email: perfilAutor?.email ?? "Não informado",
      role: perfilAutor?.role ?? "usuário",
      assunto: ticket.assunto || "Sem assunto",
      status: ticket.status || "pendente",
      mensagemHtml,
      anexos: anexosSeguros,
      dataFormatada: formatarDataBrasil(ticket.created_at),
    });

    const bodyResend: Record<string, unknown> = {
      from: remetenteEmail,
      to: destinatarios,
      subject: `[NexusClass] Novo Chamado #${ticket.id_suporte}: ${assuntoTexto}`,
      html,
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
        destinatarios: destinatarios.length,
        anexos: anexosSeguros.length,
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
