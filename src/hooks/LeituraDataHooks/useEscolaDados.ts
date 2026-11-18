import { useEffect, useState, useCallback } from "react";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { EscolaProps } from "@/hooks/LeituraDataHooks/type";
import { escolaTurmaRepository, extrairMensagemErroRepo } from "@/repositories";

export function useEscolaDados(
  idEscola?: string | null,
  role?: PerfilUsuario["role"],
) {
  const [listaEscolar, setListaEscolar] = useState<EscolaProps>({
    escola: "",
    ano_letivo: new Date().getFullYear(),
    turmas: {},
  });
  const [carregandoEscola, setCarregandoEscola] = useState(false);
  const [erroEscola, setErroEscola] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase) {
      setErroEscola("Supabase não configurado para carregar turmas.");
      return;
    }

    setCarregandoEscola(true);
    setErroEscola(null);

    try {
      const dados = await escolaTurmaRepository.carregarDadosEscola(idEscola, role);
      setListaEscolar(dados);
    } catch (error) {
      setErroEscola(
        extrairMensagemErroRepo(
          error,
          "Ocorreu um erro inesperado ao carregar os dados escolares.",
        ),
      );
    } finally {
      setCarregandoEscola(false);
    }
  }, [idEscola, role]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return { listaEscolar, carregandoEscola, erroEscola, recarregarEscola: carregar };
}
