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

function parseDestinatarios(valor: string | undefined): string[] {
  if (!valor) return [];
  const validos = valor
    .split(/[,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
  return Array.from(new Set(validos));
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

function montarHtmlDenuncia(dados: {
  idDenuncia: number;
  autorNome: string;
  autorEmail: string;
  denunciadoNome: string;
  denunciadoEmail: string;
  motivo: string;
  status: string;
  descricaoHtml: string;
  dataFormatada: string;
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nova Denúncia #${escaparHtml(dados.idDenuncia)} — NexusClass</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e4e4e7;box-shadow:0 4px 14px rgba(24,24,27,0.06);">
          <tr>
            <td style="background-color:#991b1b;background-image:linear-gradient(135deg,#b91c1c 0%,#7f1d1d 100%);padding:26px 28px;color:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background-color:rgba(255,255,255,0.16);color:#fef2f2;padding:4px 10px;border-radius:999px;">Moderação · Alerta de Denúncia</span>
                    <h1 style="margin:12px 0 4px 0;font-size:22px;line-height:1.3;font-weight:700;color:#ffffff;">Nova denúncia registrada (#${escaparHtml(dados.idDenuncia)})</h1>
                    <p style="margin:0;font-size:13px;color:#fecaca;">Registrada em ${escaparHtml(dados.dataFormatada)} (horário de Brasília)</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:26px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:10px;margin-bottom:20px;">
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;width:36%;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Motivo</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:14px;font-weight:700;color:#991b1b;">${escaparHtml(dados.motivo)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Usuário Denunciado</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:14px;color:#18181b;">
                    <strong>${escaparHtml(dados.denunciadoNome)}</strong><br/>
                    <span style="font-size:12px;color:#52525b;">${escaparHtml(dados.denunciadoEmail)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Denunciante</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:14px;color:#18181b;">
                    <strong>${escaparHtml(dados.autorNome)}</strong><br/>
                    <span style="font-size:12px;color:#52525b;">${escaparHtml(dados.autorEmail)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Status Atual</td>
                  <td style="padding:12px 16px;">
                    <span style="display:inline-block;font-size:12px;font-weight:600;background-color:#fef3c7;color:#92400e;border:1px solid #fde68a;padding:3px 10px;border-radius:999px;text-transform:capitalize;">${escaparHtml(dados.status)}</span>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#52525b;">Descrição informada</p>
              <div style="background-color:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;padding:16px 18px;font-size:14px;line-height:1.65;color:#27272a;word-break:break-word;">
                ${dados.descricaoHtml}
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color:#fafafa;border-top:1px solid #e4e4e7;padding:18px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#71717a;line-height:1.5;">
                Notificação automática enviada pelo sistema <strong>NexusClass</strong>.<br/>
                Acesse o painel administrativo com conta <strong>Master</strong> para analisar e atualizar o status desta denúncia.
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
      .select(
        "id_denuncia, id_autor, id_denunciado, motivo, descricao, status, created_at",
      )
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
    const destinatarios = parseDestinatarios(Deno.env.get("DESTINATARIO_EMAIL"));
    const remetenteEmail =
      Deno.env.get("RESEND_FROM_EMAIL") ||
      "NexusClass Alertas <onboarding@resend.dev>";

    if (!resendApiKey || destinatarios.length === 0) {
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

    const motivoAssunto = sanitizarAssuntoEmail(denuncia.motivo || "Denúncia");
    const descricaoHtml = escaparHtml(
      denuncia.descricao || "Sem detalhes fornecidos.",
    ).replace(/\r?\n/g, "<br/>");

    const html = montarHtmlDenuncia({
      idDenuncia: denuncia.id_denuncia,
      autorNome: autor?.nome ?? "Usuário não identificado",
      autorEmail: autor?.email ?? denuncia.id_autor,
      denunciadoNome: denunciado?.nome ?? "Usuário não identificado",
      denunciadoEmail: denunciado?.email ?? denuncia.id_denunciado,
      motivo: denuncia.motivo || "Não informado",
      status: denuncia.status || "pendente",
      descricaoHtml,
      dataFormatada: formatarDataBrasil(denuncia.created_at),
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: remetenteEmail,
        to: destinatarios,
        subject: `[NexusClass] Nova Denúncia #${denuncia.id_denuncia}: ${motivoAssunto}`,
        html,
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

    return respostaJson(
      {
        enviado: true,
        id: data?.id ?? null,
        destinatarios: destinatarios.length,
      },
      200,
    );
  } catch (error: unknown) {
    console.error("Erro na Edge Function resend-email:", error);
    return respostaJson(
      { error: "Erro interno ao enviar notificação." },
      500,
    );
  }
});
