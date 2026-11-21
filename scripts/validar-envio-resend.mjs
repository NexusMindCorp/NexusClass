/**
 * Script de validação manual do envio de e-mails via Resend (Denúncia e Suporte).
 *
 * Uso (PowerShell):
 *   $env:RESEND_API_KEY="sua_chave_resend"
 *   $env:DESTINATARIO_EMAIL="seu_email@exemplo.com"
 *   node scripts/validar-envio-resend.mjs
 *
 * Opcional:
 *   $env:RESEND_FROM_EMAIL="NexusClass <notificacoes@seudominio.com>"
 *   node scripts/validar-envio-resend.mjs --tipo denuncia
 *   node scripts/validar-envio-resend.mjs --tipo suporte
 */

const MAPA_HTML = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

function escaparHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (char) => MAPA_HTML[char]);
}

function parseDestinatarios(valor) {
  if (!valor) return [];
  const validos = valor
    .split(/[,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
  return Array.from(new Set(validos));
}

function formatarDataBrasil(data = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

function parseTipo(argv) {
  const idx = argv.indexOf("--tipo");
  if (idx === -1) return "ambos";
  const valor = argv[idx + 1]?.trim().toLowerCase();
  if (valor === "denuncia" || valor === "suporte" || valor === "ambos") {
    return valor;
  }
  throw new Error("Use --tipo denuncia | suporte | ambos");
}

function montarHtmlDenuncia(dataFormatada) {
  const descricaoHtml = escaparHtml(
    "Teste automatizado de validação do template de denúncia.\nEscape OWASP conferido: <script>alert('xss')</script> & aspas \"duplas\".",
  ).replace(/\r?\n/g, "<br/>");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nova Denúncia #999 — NexusClass</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e4e4e7;box-shadow:0 4px 14px rgba(24,24,27,0.06);">
          <tr>
            <td style="background-color:#991b1b;background-image:linear-gradient(135deg,#b91c1c 0%,#7f1d1d 100%);padding:26px 28px;color:#ffffff;">
              <span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background-color:rgba(255,255,255,0.16);color:#fef2f2;padding:4px 10px;border-radius:999px;">Moderação · Teste de Denúncia</span>
              <h1 style="margin:12px 0 4px 0;font-size:22px;line-height:1.3;font-weight:700;color:#ffffff;">Nova denúncia registrada (#999)</h1>
              <p style="margin:0;font-size:13px;color:#fecaca;">Registrada em ${escaparHtml(dataFormatada)} (horário de Brasília)</p>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:10px;margin-bottom:20px;">
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;width:36%;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Motivo</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:14px;font-weight:700;color:#991b1b;">Comportamento inadequado (Teste)</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Usuário Denunciado</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:14px;color:#18181b;"><strong>Aluno Teste</strong><br/><span style="font-size:12px;color:#52525b;">aluno.teste@nexusclass.edu.br</span></td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Denunciante</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:14px;color:#18181b;"><strong>Professor Teste</strong><br/><span style="font-size:12px;color:#52525b;">professor.teste@nexusclass.edu.br</span></td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Status Atual</td>
                  <td style="padding:12px 16px;"><span style="display:inline-block;font-size:12px;font-weight:600;background-color:#fef3c7;color:#92400e;border:1px solid #fde68a;padding:3px 10px;border-radius:999px;">Pendente</span></td>
                </tr>
              </table>
              <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#52525b;">Descrição informada</p>
              <div style="background-color:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;padding:16px 18px;font-size:14px;line-height:1.65;color:#27272a;word-break:break-word;">${descricaoHtml}</div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#fafafa;border-top:1px solid #e4e4e7;padding:18px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#71717a;line-height:1.5;">Notificação automática enviada pelo sistema <strong>NexusClass</strong>.<br/>Acesse o painel administrativo com conta <strong>Master</strong> para analisar esta denúncia.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function montarHtmlSuporte(dataFormatada) {
  const mensagemHtml = escaparHtml(
    "Teste automatizado do template de chamado de suporte.\nEscape OWASP validado: <img src=x onerror=alert(1)> & caracteres especiais.",
  ).replace(/\r?\n/g, "<br/>");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Novo Chamado #999 — NexusClass</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e4e4e7;box-shadow:0 4px 14px rgba(24,24,27,0.06);">
          <tr>
            <td style="background-color:#4338ca;background-image:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:26px 28px;color:#ffffff;">
              <span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background-color:rgba(255,255,255,0.18);color:#eef2ff;padding:4px 10px;border-radius:999px;">Central de Suporte · Teste de Chamado</span>
              <h1 style="margin:12px 0 4px 0;font-size:22px;line-height:1.3;font-weight:700;color:#ffffff;">Chamado #999 — Validação do Template HTML</h1>
              <p style="margin:0;font-size:13px;color:#e0e7ff;">Aberto em ${escaparHtml(dataFormatada)} (horário de Brasília)</p>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:10px;margin-bottom:20px;">
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;width:34%;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Solicitante</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:14px;color:#18181b;"><strong>Usuário de Teste</strong> <span style="display:inline-block;margin-left:6px;font-size:11px;font-weight:600;background-color:#f4f4f5;color:#52525b;border:1px solid #d4d4d8;padding:1px 8px;border-radius:999px;">Aluno</span></td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">E-mail de Retorno</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;font-size:14px;color:#3730a3;font-weight:500;">usuario.teste@nexusclass.edu.br</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Status</td>
                  <td style="padding:12px 16px;"><span style="display:inline-block;font-size:12px;font-weight:600;background-color:#dbeafe;color:#1e40af;border:1px solid #bfdbfe;padding:3px 10px;border-radius:999px;">Pendente</span></td>
                </tr>
              </table>
              <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#52525b;">Mensagem do usuário</p>
              <div style="background-color:#f8fafc;border-left:4px solid #4f46e5;border-radius:0 8px 8px 0;padding:16px 18px;font-size:14px;line-height:1.65;color:#27272a;word-break:break-word;">${mensagemHtml}</div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#fafafa;border-top:1px solid #e4e4e7;padding:18px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#71717a;line-height:1.5;">Você pode responder diretamente a este e-mail (<strong>Reply-To</strong> configurado para o solicitante).<br/>Notificação automática da plataforma <strong>NexusClass</strong>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function enviar({ apiKey, from, to, subject, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  const tipo = parseTipo(process.argv.slice(2));
  const apiKey = process.env.RESEND_API_KEY;
  const destinatarios = parseDestinatarios(process.env.DESTINATARIO_EMAIL);
  const from =
    process.env.RESEND_FROM_EMAIL || "NexusClass <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("Defina a variável de ambiente RESEND_API_KEY.");
  }
  if (destinatarios.length === 0) {
    throw new Error(
      "Defina DESTINATARIO_EMAIL com um ou mais e-mails válidos separados por vírgula.",
    );
  }

  const agora = formatarDataBrasil();
  const envios = [];

  if (tipo === "denuncia" || tipo === "ambos") {
    envios.push({
      nome: "resend-email (Denúncia)",
      subject: "[NexusClass] Teste de Template — Nova Denúncia #999",
      html: montarHtmlDenuncia(agora),
    });
  }
  if (tipo === "suporte" || tipo === "ambos") {
    envios.push({
      nome: "resend-suport (Suporte)",
      subject: "[NexusClass] Teste de Template — Novo Chamado #999",
      html: montarHtmlSuporte(agora),
    });
  }

  let houveFalha = false;
  for (const item of envios) {
    const resultado = await enviar({
      apiKey,
      from,
      to: destinatarios,
      subject: item.subject,
      html: item.html,
    });
    console.log(
      `[${item.nome}] HTTP ${resultado.status}:`,
      JSON.stringify(resultado.body),
    );
    if (!resultado.ok) houveFalha = true;
  }

  if (houveFalha) process.exit(1);
}

main().catch((erro) => {
  console.error("[validar-envio-resend] Erro:", erro.message);
  process.exit(1);
});
