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

export default {
  async fetch(req: Request) {
    try {
      const payload = (await req.json()) as {
        record?: {
          aluno_denunciado?: unknown;
          id_denunciado?: unknown;
          motivo?: unknown;
          descricao?: unknown;
        };
      };

      const registro = payload.record ?? {};
      const denunciadoSeguro = escaparHtml(
        registro.aluno_denunciado ?? registro.id_denunciado ?? "Não informado",
      );
      const motivoAssunto = sanitizarAssuntoEmail(registro.motivo ?? "Denúncia");
      const motivoHtml = escaparHtml(registro.motivo ?? "Não informado");
      const descricaoHtml = escaparHtml(
        registro.descricao || "Sem detalhes fornecidos.",
      ).replace(/\r?\n/g, "<br/>");

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "NexusClass Alertas <onboarding@resend.dev>",
          to: DESTINATARIO_EMAIL,
          subject: `⚠️ Nova Denúncia: ${motivoAssunto}`,
          html: `
            <h2>Nova denúncia registrada no sistema</h2>
            <p><strong>Usuário Denunciado:</strong> ${denunciadoSeguro}</p>
            <p><strong>Motivo:</strong> ${motivoHtml}</p>
            <p><strong>Descrição:</strong><br/>${descricaoHtml}</p>
          `,
        }),
      });

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      console.error("Erro na Edge Function resend-email:", error);
      return new Response(
        JSON.stringify({ error: "Erro interno ao enviar notificação" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
