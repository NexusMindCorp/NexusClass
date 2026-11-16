import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const DESTINATARIO_EMAIL = Deno.env.get("DESTINATARIO_EMAIL");

export default {
  async fetch(req: Request) {
    try {
      // 1. Pega os dados que o Webhook do banco enviou
      const payload = await req.json();
      console.log("Payload recebido do banco:", payload);

      // O Webhook do banco manda a nova linha dentro da propriedade "record"
      const { aluno_denunciado, motivo, descricao } = payload.record;

      // 2. Chama a API do Resend
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "NexusClass Alertas <onboarding@resend.dev>", // E-mail padrão do Resend
          to: DESTINATARIO_EMAIL,
          subject: `⚠️ Nova Denúncia: ${motivo}`,
          html: `
            <h2>Nova denúncia registrada no sistema</h2>
            <p><strong>Aluno Denunciado:</strong> ${aluno_denunciado}</p>
            <p><strong>Motivo:</strong> ${motivo}</p>
            <p><strong>Descrição:</strong><br/> ${descricao || 'Sem detalhes fornecidos.'}</p>
          `,
        }),
      });

      const data = await res.json();
      console.log("Resposta do Resend:", data);

      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Erro na Edge Function:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }
};