import { useEffect, useRef, useState, useCallback } from "react"
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import type { PerfilUsuario } from "@/hooks/useAuth"
import { formatarDataLocal, montarDataEvento } from "@/lib/utils"

export type OpcoesTela = "mural" | "calendario" | "principal" | "pesquisar" | "mensagens" | "suporte" | "privacidade" | "configuracoesAvancadas";

type PayloadAlertaCalendario = {
    id: string
    evento_id: string
    titulo_evento: string
    mensagem: string
    minutos_antes?: number
    lembrete_para: string
    created_at: string
}

type EventoCalendarioNotificacao = {
    id: string
    titulo: string
    data: string
    horario: string
}

export type UsuarioProps = {
    inscricoes: Record<string, boolean>
    acessouOq: OpcoesTela
    chaveMural: string
    listaDosInscritos: Array<string>
    chatAtivoId: string | null
}

const ESTADO_INICIAL_USUARIO: UsuarioProps = {
    inscricoes: {} as Record<string, boolean>,
    acessouOq: "principal" as OpcoesTela,
    chaveMural: "",
    listaDosInscritos: [],
    chatAtivoId: null,
}

export function useGerenciador(perfil: PerfilUsuario | null) {
    const alertasEnviadosRef = useRef<Set<string>>(new Set())
    const [pedirAjuda, setPedirAjuda] = useState(false);
    const [usuario, setUsuario] = useState<UsuarioProps>(ESTADO_INICIAL_USUARIO);
    const [loadingInscricoes, setLoadingInscricoes] = useState(true);


    const limparEstado = () => {
        setUsuario(ESTADO_INICIAL_USUARIO);
        setPedirAjuda(false);
        alertasEnviadosRef.current.clear();
        setLoadingInscricoes(true);
    }

    const acionarAjuda = () => setPedirAjuda(true);

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

            setUsuario((anterior) => ({
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

    useEffect(() => {
        void buscarMatriculasDoUsuario()
    }, [buscarMatriculasDoUsuario]);

    const mudarInscricao = async (turmaId: string) => {
        if (!hasSupabaseConfig || !supabase || !perfil?.id) {
            toast.error("Erro de autenticação", { description: "Sessão inválida ou não configurada." })
            return
        }
        const tabelaAssociativa = perfil.role === "aluno" ? "aluno_turma" : "professor_turma";
        const colunaFiltro = perfil.role === "aluno" ? "aluno_id" : "professor_id";
        const jaIncrito = usuario.inscricoes[turmaId];

        try {
            if (jaIncrito) {
                const { error } = await supabase
                    .from(tabelaAssociativa)
                    .delete()
                    .eq(colunaFiltro, perfil.id)
                    .eq("turma_id", turmaId)

                if (error) throw error
                toast.success("Desinscrição realizada", { description: "Você foi desinscrito desta turma." })
            } else {
                const { error } = await supabase
                    .from(tabelaAssociativa)
                    .insert({
                        [colunaFiltro]: perfil.id,
                        turma_id: turmaId,
                    })

                if (error) throw error
                toast.success("Inscrição realizada", { description: "Você foi inscrito nesta turma." })
            }

            setUsuario((anterior) => {
                const proximasInscricoes = {
                    ...anterior.inscricoes,
                    [turmaId]: !anterior.inscricoes[turmaId],
                };

                return {
                    ...anterior,
                    inscricoes: proximasInscricoes,
                    listaDosInscritos: Object.keys(proximasInscricoes).filter((id) => proximasInscricoes[id]),
                };
            });

        } catch (error: any) {
            toast.error("Erro ao atualizar inscrição", {
                description: error.message || "Por favor, verifique sua conexão.",
            });
        }
    };

    const estaInscrito = (materia: string) => Boolean(usuario.inscricoes[materia]);

    const marcarMural = (key: string) => {
        setUsuario((anterior) => ({ ...anterior, acessouOq: "mural", chaveMural: key }));
    };

    const marcarCalendario = () => {
        setUsuario((anterior) => ({ ...anterior, acessouOq: "calendario" }));
    };

    const navegarPara = (tela: OpcoesTela) => {
        setUsuario((anterior) => ({ ...anterior, acessouOq: tela }));
        if (tela === "principal") {
            void buscarMatriculasDoUsuario();
        }
    };

    const marcarPesquisa = () => {
        setUsuario((anterior) => ({ ...anterior, acessouOq: "pesquisar" }));
    }

    const marcarPrivacidade = () => {
        setUsuario((anterior) => ({ ...anterior, acessouOq: "privacidade" }));
    }

    const abrirChat = (contatoId: string) => {
        setUsuario((anterior) => ({ ...anterior, chatAtivoId: contatoId, acessouOq: "mensagens" }));
    }

    useEffect(() => {
        if (!hasSupabaseConfig || !supabase) {
            return
        }
        const supabaseClient = supabase
        const channel = supabaseClient
            .channel("alertas-calendario-5-min")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "alertas_calendario",
                },
                (payload) => {
                    const alerta = payload.new as PayloadAlertaCalendario
                    const minuto = alerta.minutos_antes ?? "db"
                    const chaveAlerta = `${alerta.evento_id}-${minuto}`

                    if (alertasEnviadosRef.current.has(chaveAlerta)) {
                        return
                    }

                    alertasEnviadosRef.current.add(chaveAlerta)
                    toast.warning(alerta.mensagem || "Um evento comeca em 5 minutos.", {
                        description: alerta.titulo_evento,
                        duration: 12000,
                    })
                }
            )
            .subscribe()

        return () => {
            void supabaseClient.removeChannel(channel)
        }
    }, [])



    useEffect(() => {
        if (!hasSupabaseConfig || !supabase) {
            return
        }

        const supabaseClient = supabase

        const verificarLembretesLocais = async () => {
            const agora = new Date()
            const hoje = formatarDataLocal(agora)
            const amanha = formatarDataLocal(new Date(agora.getTime() + 24 * 60 * 60 * 1000))

            const { data, error } = await supabaseClient
                .from("eventos_calendario")
                .select("id,titulo,data,horario")
                .not("horario", "is", null)
                .gte("data", hoje)
                .lte("data", amanha)

            if (error || !data) {
                return
            }

            for (const evento of data as EventoCalendarioNotificacao[]) {
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

        void verificarLembretesLocais()
        const intervalo = window.setInterval(() => {
            void verificarLembretesLocais()
        }, 30000)

        return () => {
            window.clearInterval(intervalo)
        }
    }, [])

    return {
        usuario,
        pedirAjuda,
        setUsuario,
        limparEstado,
        acionarAjuda,
        mudarInscricao,
        estaInscrito,
        marcarMural,
        marcarCalendario,
        navegarPara,
        marcarPesquisa,
        marcarPrivacidade,
        loadingInscricoes,
        abrirChat
    };
}