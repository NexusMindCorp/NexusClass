import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*", // Libera qualquer cabeçalho de requisição
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Trata requisição de preflight CORS (enviada automaticamente pelo navegador)
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Cabeçalho de autorização ausente" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Variáveis de ambiente do Supabase não configuradas no servidor" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Inicializa o cliente admin com a Service Role Key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Valida com segurança o token JWT do usuário no servidor
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida ou expirada" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca a role do usuário no banco de dados para checagem de privilégio
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from("perfis")
      .select("role")
      .eq("id", user.id)
      .single();

    if (perfilError || !perfil) {
      return new Response(JSON.stringify({ error: "Perfil não encontrado no sistema" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trava de segurança: apenas usuários com role 'aluno' podem deletar a própria conta
    if (perfil.role !== "aluno") {
      return new Response(JSON.stringify({ error: "Ação não permitida para este tipo de conta" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Limpar arquivos do Storage vinculados às entregas de atividades
    try {
      const { data: entregas } = await supabaseAdmin
        .from("entregas_atividades")
        .select("url_anexo")
        .eq("aluno_id", user.id)
        .not("url_anexo", "is", null);

      if (entregas && entregas.length > 0) {
        const caminhos = entregas.map((e) => e.url_anexo).filter(Boolean);
        if (caminhos.length > 0) {
          await supabaseAdmin.storage.from("entregas_atividades").remove(caminhos);
        }
      }
    } catch (err) {
      console.error("Erro ao limpar storage de entregas:", err);
    }

    // 2. Limpar arquivos do Storage vinculados a dúvidas do aluno
    try {
      const { data: duvidas } = await supabaseAdmin
        .from("duvidasalunostoprofessor")
        .select("anexo_url")
        .eq("aluno_id", user.id)
        .not("anexo_url", "is", null);

      if (duvidas && duvidas.length > 0) {
        const nomesArquivos: string[] = [];
        
        duvidas.forEach((d) => {
          if (!d.anexo_url) return;
          try {
            const urls = JSON.parse(d.anexo_url);
            if (Array.isArray(urls)) {
              urls.forEach((url) => {
                const nome = url.split("/").pop()?.split("?")[0];
                if (nome) nomesArquivos.push(nome);
              });
            }
          } catch {
            const nome = d.anexo_url.split("/").pop()?.split("?")[0];
            if (nome) nomesArquivos.push(nome);
          }
        });

        if (nomesArquivos.length > 0) {
          await supabaseAdmin.storage.from("duvidasalunostoprofessor").remove(nomesArquivos);
        }
      }
    } catch (err) {
      console.error("Erro ao limpar storage de dúvidas:", err);
    }

    // 3. Excluir dados das tabelas públicas do banco de dados (previne conflitos de FK antes do delete final)
    await supabaseAdmin.from("entregas_atividades").delete().eq("aluno_id", user.id);
    await supabaseAdmin.from("duvidasalunostoprofessor").delete().eq("aluno_id", user.id);
    await supabaseAdmin.from("mensagens").delete().or(`remetente_id.eq.${user.id},destinatario_id.eq.${user.id}`);
    await supabaseAdmin.from("mural_posts").delete().eq("autor_id", user.id);
    
    // Deleta do calendário se a coluna autor_id existir na tabela eventos_calendario
    try {
      await supabaseAdmin.from("eventos_calendario").delete().eq("autor_id", user.id);
    } catch (err) {
      console.error("Falha ao tentar deletar eventos_calendario:", err);
    }

    await supabaseAdmin.from("aluno_turma").delete().eq("aluno_id", user.id);
    await supabaseAdmin.from("perfis").delete().eq("id", user.id);

    // 4. Deletar definitivamente o usuário no auth.users do Supabase
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      throw deleteUserError;
    }

    return new Response(JSON.stringify({ message: "Conta e dados deletados com sucesso" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Erro na Edge Function deletar-conta:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
