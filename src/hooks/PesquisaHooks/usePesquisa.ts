import { useState, useMemo } from "react";
import type { UsePesquisaProps } from "@/hooks/PesquisaHooks/type";
import {
  filtrarEOrdenarTurmas,
  filtroTurmaPorTextoStrategy,
  type AbaFiltroTurma,
} from "@/patterns/strategy/FiltroStrategy";

export function usePesquisa({
  aoFecharPesquisa,
  turmas,
  perfil,
  estaInscrito,
  abaInicial = "minhas",
}: UsePesquisaProps) {
  const [textoPesquisa, setTextoPesquisa] = useState("");
  const [aberto, setAberto] = useState(true);
  const [abaAtiva, setAbaAtivaState] = useState<AbaFiltroTurma>(abaInicial);

  const setAbaAtiva = (novaAba: string) => {
    setAbaAtivaState(novaAba as AbaFiltroTurma);
  };

  const mudarAberturaSheet = (estaAberto: boolean) => {
    setAberto(estaAberto);
    if (!estaAberto) {
      aoFecharPesquisa();
    }
  };

  const turmasFiltradas = useMemo(() => {
    return filtroTurmaPorTextoStrategy.filtrar(
      Object.entries(turmas),
      textoPesquisa,
    );
  }, [textoPesquisa, turmas]);

  const turmasOrdenadas = useMemo(() => {
    return filtrarEOrdenarTurmas(turmas, {
      textoPesquisa,
      abaAtiva,
      role: perfil?.role,
      estaInscrito,
    });
  }, [turmas, textoPesquisa, abaAtiva, perfil?.role, estaInscrito]);

  return {
    textoPesquisa,
    setTextoPesquisa,
    aberto,
    mudarAberturaSheet,
    abaAtiva,
    setAbaAtiva,
    turmasFiltradas,
    turmasOrdenadas,
  };
}
