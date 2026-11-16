import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const DESTINATARIO_EMAIL = Deno.env.get("DESTINATARIO_EMAIL");

export default {
  async fetch(req: Request) {
    try {
      const payload = await req.json();
      
      // Agora pegamos também o anexos_urls
      const { nome, email, assunto, mensagem, anexos_urls } = payload.record;

      // Monta o HTML dos anexos caso eles existam
      let anexosHtml = "";
      if (anexos_urls && anexos_urls.length > 0) {
        const links = anexos_urls.map((url: string) => `<a href="${url}" target="_blank">Visualizar Anexo</a>`).join('<br/>');
        anexosHtml = `
          <hr/>
          <p><strong>Anexos:</strong></p>
          ${links}
        `;
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
          subject: `📩 Novo Chamado: ${assunto}`,
          html: `
            <h2>Novo Pedido de Suporte/Contato</h2>
            <p><strong>Nome do Usuário:</strong> ${nome}</p>
            <p><strong>E-mail para Retorno:</strong> ${email}</p>
            <p><strong>Assunto:</strong> ${assunto}</p>
            <hr/>
            <p><strong>Mensagem:</strong><br/> ${mensagem}</p>
            ${anexosHtml}
          `,
        }),
      });

      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }
};