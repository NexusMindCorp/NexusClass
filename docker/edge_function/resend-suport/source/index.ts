import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const DESTINATARIO_EMAIL = Deno.env.get("DESTINATARIO_EMAIL");

const MAPA_HTML: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

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

export default {
  async fetch(req: Request) {
    try {
      const payload = (await req.json()) as {
        record?: {
          nome?: unknown;
          email?: unknown;
          assunto?: unknown;
          mensagem?: unknown;
          anexos_urls?: unknown;
        };
      };

      const registro = payload.record ?? {};
      const nomeHtml = escaparHtml(registro.nome ?? "Não informado");
      const emailHtml = escaparHtml(registro.email ?? "Não informado");
      const assuntoTexto = sanitizarAssuntoEmail(registro.assunto ?? "Suporte");
      const assuntoHtml = escaparHtml(registro.assunto ?? "Sem assunto");
      const mensagemHtml = escaparHtml(registro.mensagem ?? "").replace(
        /\r?\n/g,
        "<br/>",
      );

      let anexosHtml = "";
      if (Array.isArray(registro.anexos_urls) && registro.anexos_urls.length > 0) {
        const linksSeguros = registro.anexos_urls
          .map((item) => obterUrlHttpSegura(item))
          .filter((url): url is string => url !== null)
          .map(
            (url) =>
              `<a href="${escaparHtml(url)}" target="_blank" rel="noopener noreferrer">Visualizar Anexo</a>`,
          );

        if (linksSeguros.length > 0) {
          anexosHtml = `
            <hr/>
            <p><strong>Anexos:</strong></p>
            ${linksSeguros.join("<br/>")}
          `;
        }
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "NexusClass Suporte <onboarding@resend.dev>",
          to: DESTINATARIO_EMAIL,
          subject: `📩 Novo Chamado: ${assuntoTexto}`,
          html: `
            <h2>Novo Pedido de Suporte/Contato</h2>
            <p><strong>Nome do Usuário:</strong> ${nomeHtml}</p>
            <p><strong>E-mail para Retorno:</strong> ${emailHtml}</p>
            <p><strong>Assunto:</strong> ${assuntoHtml}</p>
            <hr/>
            <p><strong>Mensagem:</strong><br/>${mensagemHtml}</p>
            ${anexosHtml}
          `,
        }),
      });

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      console.error("Erro na Edge Function resend-suport:", error);
      return new Response(
        JSON.stringify({ error: "Erro interno ao enviar chamado" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
