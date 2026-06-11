import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useOutletContext } from "react-router-dom";
import type { PerfilUsuario } from "@/hooks/useAuth";
export function useConfiguracoesAvancadas() {
      const { perfil } = useOutletContext<{ session: unknown; perfil: PerfilUsuario | null }>();
  const [senhaDoInput, setSenhaDoInput] = useState("");
  const [areaSensivel, setAreaSensivel] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleAlterarSenha = async () => {
    if (!senhaDoInput) return toast.error("A senha não pode ser vazia");
    if (senhaDoInput.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres");
    
    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senhaDoInput });
    if (error) toast.error("Erro: " + error.message);
    else toast.success("Senha alterada!");
    setCarregando(false);
  };

  const handleDeletarConta = () => {
    setAreaSensivel(true);
  };

    return {
      perfil,
      senhaDoInput,
      setSenhaDoInput,
      areaSensivel,
      setAreaSensivel,
      carregando,
      setCarregando,
      handleAlterarSenha,
      handleDeletarConta,
    };
  }