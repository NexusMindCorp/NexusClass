import { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";

export function BoxAlertaDeletaConta({ onClose, perfil }: { onClose: () => void; perfil: PerfilUsuario | null }) {
  const [senhaConfirmacao, setSenhaConfirmacao] = useState("");
  const [textoConfirmacao, setTextoConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleConfirmarDelecao = async () => {
    // 1. Validação do texto de segurança
    if (textoConfirmacao !== "DELETAR") {
      return toast.error("Você deve digitar DELETAR para confirmar.");
    }

    if (!perfil?.email || !perfil?.id) {
      return toast.error("E-mail ou ID do usuário não encontrado. Tente novamente.");
    }

    setCarregando(true);

    try {
      // 2. Valida a senha do usuário tentando fazer login de confirmação
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: perfil.email,
        password: senhaConfirmacao,
      });

      if (authError) {
        throw new Error("Senha atual incorreta. Confirme suas credenciais.");
      }

      // 3. Limpar arquivos do Storage das entregas do aluno
      try {
        const { data: entregas } = await supabase
          .from("entregas_atividades")
          .select("url_anexo")
          .eq("aluno_id", perfil.id)
          .not("url_anexo", "is", null);

        if (entregas && entregas.length > 0) {
          const caminhosEntregas = entregas.map((e) => e.url_anexo).filter(Boolean);
          if (caminhosEntregas.length > 0) {
            await supabase.storage.from("entregas_atividades").remove(caminhosEntregas);
          }
        }
      } catch (err) {
        console.error("Erro ao limpar storage de entregas:", err);
      }

      // 4. Limpar arquivos do Storage das dúvidas do aluno
      try {
        const { data: duvidas } = await supabase
          .from("duvidasalunostoprofessor")
          .select("anexo_url")
          .eq("aluno_id", perfil.id)
          .not("anexo_url", "is", null);

        if (duvidas && duvidas.length > 0) {
          const nomesArquivosDuvidas: string[] = [];
          
          duvidas.forEach((d) => {
            if (!d.anexo_url) return;
            try {
              const urls = JSON.parse(d.anexo_url);
              if (Array.isArray(urls)) {
                urls.forEach((url) => {
                  const nome = url.split("/").pop()?.split("?")[0];
                  if (nome) nomesArquivosDuvidas.push(nome);
                });
              }
            } catch {
              const nome = d.anexo_url.split("/").pop()?.split("?")[0];
              if (nome) nomesArquivosDuvidas.push(nome);
            }
          });

          if (nomesArquivosDuvidas.length > 0) {
            await supabase.storage.from("duvidasalunostoprofessor").remove(nomesArquivosDuvidas);
          }
        }
      } catch (err) {
        console.error("Erro ao limpar storage de dúvidas:", err);
      }

      // 5. Executa a deleção no banco de dados através da RPC
      const { error: rpcError } = await supabase.rpc("deletar_propria_conta");
      if (rpcError) {
        throw new Error(rpcError.message || "Erro ao processar exclusão no banco de dados.");
      }

      toast.success("Sua conta foi deletada definitivamente.");
      
      // 6. Encerra a sessão localmente
      await supabase.auth.signOut();
      
      // 7. Recarrega a página para atualizar o estado de autenticação geral da aplicação
      window.location.reload();
    } catch (error: any) {
      console.error("Erro na deleção de conta:", error);
      toast.error("Falha ao deletar conta", {
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setCarregando(false);
      onClose();
    }
  };

  return (
    <div className="bg-card border border-border p-8 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
      <h3 className="text-xl font-bold text-destructive">Zona de Perigo</h3>
      <p className="text-muted-foreground mt-2 text-sm">Para deletar sua conta, confirme as informações abaixo:</p>

      <div className="space-y-4 mt-6">
        <div>
          <label className="text-xs text-muted-foreground font-bold uppercase">Sua senha atual</label>
          <input
            type="password"
            className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            value={senhaConfirmacao}
            onChange={(e) => setSenhaConfirmacao(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-bold uppercase">Digite "DELETAR" para confirmar</label>
          <input
            className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            placeholder="DELETAR"
            value={textoConfirmacao}
            onChange={(e) => setTextoConfirmacao(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button
          variant="outline"
          className="flex-1 cursor-pointer"
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          variant="destructive"
          className="flex-1 cursor-pointer font-bold transition-all duration-200 hover:bg-red-700 hover:scale-105 hover:shadow-lg active:scale-95"
          onClick={handleConfirmarDelecao}
          disabled={carregando || !senhaConfirmacao || textoConfirmacao !== "DELETAR"}
        >
          {carregando ? "Processando..." : "Confirmar Deleção"}
        </Button>
      </div>
    </div>
  );
}