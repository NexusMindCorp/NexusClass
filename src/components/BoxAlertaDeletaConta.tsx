import { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

export function BoxAlertaDeletaConta({ onClose }: { onClose: () => void }) {
  const [senhaConfirmacao, setSenhaConfirmacao] = useState("");
  const [textoConfirmacao, setTextoConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleConfirmarDelecao = async () => {
    // 1. Validação do texto
    if (textoConfirmacao !== "DELETAR") {
      return toast.error("Você deve digitar DELETAR para confirmar.");
    }

    setCarregando(true);
    // 2. Aqui você chamaria a lógica de deleção do Supabase
    // Exemplo: await supabase.auth.signInWithPassword({ email, password: senhaConfirmacao });
    // Exemplo: await supabase.auth.deleteUser(uid);

    toast.success("Conta deletada com sucesso!");
    setCarregando(false);
    onClose();
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