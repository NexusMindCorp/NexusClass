import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient"

export type OpcoesTela = "mural" | "calendario" | "principal" | "pesquisar" | "mensagens" | "suporte"| "privacidade";

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
}

function formatarDataLocal(data: Date) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, "0")
    const dia = String(data.getDate()).padStart(2, "0")
    return `${ano}-${mes}-${dia}`
}

function montarDataEvento(data: string, horario: string) {
    const dataEvento = new Date(`${data}T${horario}`)
    return Number.isNaN(dataEvento.getTime()) ? null : dataEvento
}


export function useGerenciador() {

    const alertasEnviadosRef = useRef<Set<string>>(new Set())
    const [pedirAjuda, setPedirAjuda] = useState(false);
    const acionarAjuda = () => setPedirAjuda(true);

    const [usuario, setUsuario] = useState<UsuarioProps>({
        inscricoes: {} as Record<string, boolean>,
        acessouOq: "principal" as OpcoesTela,
        chaveMural: "",
        listaDosInscritos: [],
    });

    const mudarInscricao = (materia: string) => {
        setUsuario((anterior) => {
            const proximasInscricoes = {
                ...anterior.inscricoes,
                [materia]: !anterior.inscricoes[materia],
            }

            return {
                ...anterior,
                inscricoes: proximasInscricoes,
                listaDosInscritos: Object.keys(proximasInscricoes).filter((nomeMateria) => proximasInscricoes[nomeMateria]),
            }
        });
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
    };

    const marcarPesquisa = () => {
        setUsuario((anterior) => ({ ...anterior, acessouOq: "pesquisar" }));
    }

    const marcarPrivacidade = () => {
        setUsuario((anterior) => ({ ...anterior, acessouOq: "privacidade" }));
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

    return { usuario, pedirAjuda, acionarAjuda, mudarInscricao, estaInscrito, marcarMural, marcarCalendario, navegarPara, marcarPesquisa, marcarPrivacidade };
}