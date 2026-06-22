import { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";

export function BoxAlertaDeletaConta({
  onClose,
  perfil,
}: {
  onClose: () => void;
  perfil: PerfilUsuario | null;
}) {
  const [senhaConfirmacao, setSenhaConfirmacao] = useState("");
  const [textoConfirmacao, setTextoConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleConfirmarDelecao = async () => {
    // 1. Validação do texto de segurança
    if (textoConfirmacao !== "DELETAR") {
      return toast.error("Você deve digitar DELETAR para confirmar.");
    }

    if (!perfil?.email || !perfil?.id) {
      return toast.error(
        "E-mail ou ID do usuário não encontrado. Tente novamente.",
      );
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

      // 3. Obtém as credenciais e o token da sessão atual
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const supabaseUrl = (supabase as any).supabaseUrl;
      const supabaseKey = (supabase as any).supabaseKey;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Credenciais do Supabase não encontradas.");
      }

      // 4. Invoca a Edge Function no backend via fetch nativo, passando apikey na URL para passar pelo preflight CORS
      const response = await fetch(
        `${supabaseUrl}/functions/v1/deletar-conta?apikey=${supabaseKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Falha na execução do processo de deleção.",
        );
      }

      toast.success("Sua conta foi deletada definitivamente.");

      // 4. Encerra a sessão localmente
      await supabase.auth.signOut();

      // 5. Recarrega a página para atualizar o estado de autenticação geral da aplicação
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
      <p className="text-muted-foreground mt-2 text-sm">
        Para deletar sua conta, confirme as informações abaixo:
      </p>

      <div className="space-y-4 mt-6">
        <div>
          <label className="text-xs text-muted-foreground font-bold uppercase">
            Sua senha atual
          </label>
          <input
            type="password"
            className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            value={senhaConfirmacao}
            onChange={(e) => setSenhaConfirmacao(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-bold uppercase">
            Digite "DELETAR" para confirmar
          </label>
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
          disabled={
            carregando || !senhaConfirmacao || textoConfirmacao !== "DELETAR"
          }
        >
          {carregando ? "Processando..." : "Confirmar Deleção"}
        </Button>
      </div>
    </div>
  );
}
