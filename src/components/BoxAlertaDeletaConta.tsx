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
    <div className="bg-[#1a1a1e] border border-[#2d2d32] p-8 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
      <h3 className="text-xl font-bold text-white">Zona de Perigo</h3>
      <p className="text-gray-400 mt-2 text-sm">Para deletar sua conta, confirme as informações abaixo:</p>

      <div className="space-y-4 mt-6">
        <div>
          <label className="text-xs text-gray-500 font-bold uppercase">Sua senha atual</label>
          <input 
            type="password" 
            className="w-full mt-1 px-3 py-2 bg-[#2d2d32] rounded text-white"
            value={senhaConfirmacao}
            onChange={(e) => setSenhaConfirmacao(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 font-bold uppercase">Digite "DELETAR" para confirmar</label>
          <input 
            className="w-full mt-1 px-3 py-2 bg-[#2d2d32] rounded text-white"
            placeholder="DELETAR"
            value={textoConfirmacao}
            onChange={(e) => setTextoConfirmacao(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button 
          variant="destructive" 
          className="flex-1" 
          onClick={handleConfirmarDelecao}
          disabled={carregando || !senhaConfirmacao || textoConfirmacao !== "DELETAR"}
        >
          {carregando ? "Processando..." : "Confirmar Deleção"}
        </Button>
      </div>
    </div>
  );
}