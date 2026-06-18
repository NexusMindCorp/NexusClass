import { formatarDataLocal } from "@/lib/utils";
import { useCallback } from "react";
import type { EventoCalendarioNotificacao, UseCarregarDataProps } from "./type";
export function useCarregarData({ hasSupabaseConfig, supabase, perfil, setLoadingInscricoes, setUsuario, toast }: UseCarregarDataProps) {
        const buscarMatriculasDoUsuario = useCallback(async () => {
            if (!hasSupabaseConfig || !supabase || !perfil?.id) {
                setLoadingInscricoes(false);
                return;
            }

            setLoadingInscricoes(true);
            const tabelaAssociativa = perfil.role === "aluno" ? "aluno_turma" : "professor_turma";
            const colunaFiltro = perfil.role === "aluno" ? "aluno_id" : "professor_id";

            try {
                const { data, error } = await supabase
                    .from(tabelaAssociativa)
                    .select("turma_id")
                    .eq(colunaFiltro, perfil.id)

                if (error) throw error

                const novasInscricoes: Record<string, boolean> = {}
                const listaIds: string[] = []

                if (data) {
                    data.forEach((item: any) => {
                        novasInscricoes[item.turma_id] = true
                        listaIds.push(item.turma_id)
                    })
                }

                setUsuario((anterior: any) => ({
                    ...anterior,
                    inscricoes: novasInscricoes,
                    listaDosInscritos: listaIds,
                }))
            } catch (error: any) {
                toast.error("Erro ao carregar inscrições", {
                    description: "Não conseguimos buscar suas inscrições. Tente recarregar a página.",
                })
            } finally {
                setLoadingInscricoes(false);
            }
    }, [perfil]);

        const verificarLembretesLocais = async (supabaseClient: any, deveAlertarEvento: any, montarDataEvento: any, alertasEnviadosRef: any) => {
            const agora = new Date()
            const hoje = formatarDataLocal(agora)
            const amanha = formatarDataLocal(new Date(agora.getTime() + 24 * 60 * 60 * 1000))

            const { data, error } = await supabaseClient
                .from("eventos_calendario")
                .select("id,titulo,data,horario,tipo,turma_id,autor_id")
                .not("horario", "is", null)
                .gte("data", hoje)
                .lte("data", amanha)

            if (error || !data) {
                return
            }

            for (const evento of data as EventoCalendarioNotificacao[]) {
                if (!deveAlertarEvento(evento)) {
                    continue
                }

                const dataEvento = montarDataEvento(evento.data, evento.horario)
                if (!dataEvento) {
                    continue
                }

                const diferencaMs = dataEvento.getTime() - agora.getTime()
                if (diferencaMs <= 0) {
                    continue
                }

                const diferencaMinutos = diferencaMs / 60000

                for (const alvo of [5, 1]) {
                    const dentroDaJanela = diferencaMinutos <= alvo && diferencaMinutos > alvo - 1
                    if (!dentroDaJanela) {
                        continue
                    }

                    const chaveAlerta = `${evento.id}-${alvo}`
                    if (alertasEnviadosRef.current.has(chaveAlerta)) {
                        continue
                    }

                    alertasEnviadosRef.current.add(chaveAlerta)
                    toast.warning(`Lembrete: "${evento.titulo}" comeca em ${alvo} minuto${alvo === 1 ? "" : "s"}.`, {
                        description: evento.titulo,
                        duration: 12000,
                    })
                }
            }
        }
    return{ buscarMatriculasDoUsuario, verificarLembretesLocais }

}