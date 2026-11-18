import { formatarDataLocal } from "@/lib/utils";
import { comunicacaoRepository, escolaTurmaRepository } from "@/repositories";
import { useCallback } from "react";
import type { EventoCalendarioNotificacao, UseCarregarDataProps } from "./type";

export function useCarregarData({
  hasSupabaseConfig,
  supabase,
  perfil,
  setLoadingInscricoes,
  setUsuario,
  toast,
}: UseCarregarDataProps) {
  const buscarMatriculasDoUsuario = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase || !perfil?.id) {
      setLoadingInscricoes(false);
      return;
    }

    setLoadingInscricoes(true);

    try {
      const idsTurmas = await escolaTurmaRepository.listarIdsTurmasPorPapel(
        perfil.id,
        perfil.role,
      );

      const novasInscricoes: Record<string, boolean> = {};
      for (const idTurma of idsTurmas) {
        novasInscricoes[idTurma] = true;
      }

      setUsuario((anterior: Record<string, unknown>) => ({
        ...anterior,
        inscricoes: novasInscricoes,
        listaDosInscritos: idsTurmas,
      }));
    } catch {
      toast.error("Erro ao carregar inscrições", {
        description: "Não conseguimos buscar suas inscrições. Tente recarregar a página.",
      });
    } finally {
      setLoadingInscricoes(false);
    }
  }, [hasSupabaseConfig, supabase, perfil?.id, perfil?.role, setLoadingInscricoes, setUsuario, toast]);

  const verificarLembretesLocais = async (
    _supabaseClient: unknown,
    deveAlertarEvento: (evento: EventoCalendarioNotificacao) => boolean,
    montarDataEvento: (data: string, horario: string) => Date | null,
    alertasEnviadosRef: { current: Set<string> },
  ) => {
    if (!perfil?.id) return;

    const agora = new Date();
    const hoje = formatarDataLocal(agora);
    const amanha = formatarDataLocal(new Date(agora.getTime() + 24 * 60 * 60 * 1000));

    try {
      const idsTurmas = await escolaTurmaRepository.listarIdsTurmasPorPapel(
        perfil.id,
        perfil.role,
      );
      const eventos = await comunicacaoRepository.listarEventos(
        perfil,
        idsTurmas,
        hoje,
      );

      for (const evento of eventos) {
        if (evento.data > amanha) continue;
        if (!deveAlertarEvento(evento)) continue;

        const dataEvento = montarDataEvento(evento.data, evento.horario);
        if (!dataEvento) continue;

        const diferencaMs = dataEvento.getTime() - agora.getTime();
        if (diferencaMs <= 0) continue;

        const diferencaMinutos = diferencaMs / 60000;

        for (const alvo of [5, 1]) {
          const dentroDaJanela = diferencaMinutos <= alvo && diferencaMinutos > alvo - 1;
          if (!dentroDaJanela) continue;

          const chaveAlerta = `${evento.id}-${alvo}`;
          if (alertasEnviadosRef.current.has(chaveAlerta)) continue;

          alertasEnviadosRef.current.add(chaveAlerta);
          toast.warning(
            `Lembrete: "${evento.titulo}" comeca em ${alvo} minuto${alvo === 1 ? "" : "s"}.`,
            {
              description: evento.titulo,
              duration: 12000,
            },
          );
        }
      }
    } catch {
      // Falha silenciosa na verificação local de lembretes
    }
  };

  return { buscarMatriculasDoUsuario, verificarLembretesLocais };
}
