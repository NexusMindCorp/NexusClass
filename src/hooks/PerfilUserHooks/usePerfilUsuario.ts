import { useState, useEffect } from "react";
import { hasSupabaseConfig } from "@/lib/supabaseClient";
import { perfilRepository } from "@/repositories";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import { getCorNomeUsuario } from "@/lib/utils";
import type { usePerfilUsuarioProps } from "./type";

export function usePerfilUsuario({
  nomeUsuario,
  currentUserProfile,
}: usePerfilUsuarioProps) {
  const [perfilAlvo, setPerfilAlvo] = useState<PerfilUsuario | null>(null);
  const [codigoEscola, setCodigoEscola] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const carregarPerfil = async () => {
      if (!hasSupabaseConfig) {
        setError("Supabase não configurado.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setCodigoEscola(null);
        const data = await perfilRepository.buscarPorNome(nomeUsuario);

        if (!data) {
          if (isMounted) setError("Perfil não encontrado.");
          return;
        }

        if (isMounted) {
          setPerfilAlvo(data);
        }

        const proprioUsuario =
          Boolean(currentUserProfile) && data.id === currentUserProfile?.id;
        if (proprioUsuario && data.id_escola) {
          try {
            const codigo =
              await perfilRepository.obterCodigoPublicoMinhaEscola();
            if (isMounted) {
              setCodigoEscola(codigo);
            }
          } catch (err) {
            console.error("Erro ao obter código público da escola:", err);
          }
        }
      } catch (err: unknown) {
        console.error("Erro ao buscar perfil:", err);
        if (isMounted) {
          setError("Ocorreu um erro ao carregar as informações do perfil.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void carregarPerfil();

    return () => {
      isMounted = false;
    };
  }, [nomeUsuario, currentUserProfile?.id]);

  const ehProprioUsuario = Boolean(
    perfilAlvo && currentUserProfile && perfilAlvo.id === currentUserProfile.id,
  );

  const corAvatar = getCorNomeUsuario(nomeUsuario || "U");

  return {
    perfilAlvo,
    codigoEscola: ehProprioUsuario ? codigoEscola : null,
    loading,
    error,
    ehProprioUsuario,
    corAvatar,
  };
}
