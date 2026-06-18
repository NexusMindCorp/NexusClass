import { useState, useEffect, useCallback, useRef } from "react"
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient"
import type { PerfilUsuario } from "@/hooks/AuthHooks/type"
import { toast } from "sonner"
import type { Mensagem, ConversaResumo} from "@/hooks/MensagensHooks/type"
import { obterSetLocalStorage, salvarSetLocalStorage } from "@/lib/utils"
import {
    ASSUNTO_MENSAGEM_PADRAO,
    CANAL_MENSAGENS,
    EVENTO_REALTIME_MENSAGENS,
    SCHEMA_REALTIME_MENSAGENS,
    TABELA_MENSAGENS,
    chaveMensagensLidas,
    chaveMensagensOcultas,
} from "@/hooks/MensagensHooks/config"

export function useMensagens(perfil: PerfilUsuario | null) {
    const [mensagens, setMensagens] = useState<Mensagem[]>([])
    const [loadingChat, setLoadingChat] = useState(false)
    const [conversas, setConversas] = useState<ConversaResumo[]>([])
    const mensagensRef = useRef<Mensagem[]>([])

    useEffect(() => {
        mensagensRef.current = mensagens
    }, [mensagens])

    const carregarHistorico = useCallback(async () => {
        if (!hasSupabaseConfig || !supabase || !perfil?.id) return

        setLoadingChat(true)

        try {
            const { data, error } = await supabase
                .from(TABELA_MENSAGENS)
                .select("*")
                .or(`remetente_id.eq.${perfil.id},destinatario_id.eq.${perfil.id}`)
                .order("created_at", { ascending: true })

            if (error) throw error

            if (data) {
                const idsLidos = obterSetLocalStorage(chaveMensagensLidas(perfil.id))
                const idsOcultos = obterSetLocalStorage(chaveMensagensOcultas(perfil.id))
                const historico = (data as Mensagem[])
                    .filter((mensagem) => !idsOcultos.has(mensagem.id))
                    .map((mensagem) => ({
                        ...mensagem,
                        lida: mensagem.lida || idsLidos.has(mensagem.id),
                    }))
                setMensagens(historico)
            }
        } catch (error: any) {
            console.error("Erro ao carregar mensagens:", error)
            toast.error("Erro no Chat", { description: "Não foi possível carregar seu histórico de conversas." })
        } finally {
            setLoadingChat(false)
        }
    }, [perfil?.id])

    const enviarMensagem = useCallback(async (destinatarioId: string, conteudoTexto: string) => {
        if (!hasSupabaseConfig || !supabase || !perfil?.id || !conteudoTexto.trim()) return

        try {
            const { error } = await supabase
                .from(TABELA_MENSAGENS)
                .insert({
                    remetente_id: perfil.id,
                    destinatario_id: destinatarioId,
                    conteudo: conteudoTexto.trim(),
                    lida: false,
                    assunto: ASSUNTO_MENSAGEM_PADRAO,
                })

            if (error) throw error

        } catch (error: any) {
            console.error("Erro ao enviar mensagem:", error)
            toast.error("Mensagem não enviada", { description: "Verifique sua conexão e tente novamente." })
            throw error
        }
    }, [perfil?.id])

    const marcarComoLidas = useCallback(async (contatoId: string) => {
        if (!hasSupabaseConfig || !supabase || !perfil?.id) return

        const idsLidos = obterSetLocalStorage(chaveMensagensLidas(perfil.id))
        mensagensRef.current.forEach((mensagem) => {
            if (
                mensagem.remetente_id === contatoId &&
                mensagem.destinatario_id === perfil.id
            ) {
                idsLidos.add(mensagem.id)
            }
        })
        salvarSetLocalStorage(chaveMensagensLidas(perfil.id), idsLidos)

        setMensagens((prevMensagens) =>
            prevMensagens.map((msg) =>
                msg.remetente_id === contatoId && msg.destinatario_id === perfil.id
                    ? { ...msg, lida: true }
                    : msg
            )
        )

        try {
            const { data, error } = await supabase
                .from(TABELA_MENSAGENS)
                .update({ lida: true })
                .eq("remetente_id", contatoId)
                .eq("destinatario_id", perfil.id)
                .eq("lida", false)
                .select("id")

            if (error) throw error
            if (!data || data.length === 0) {
                console.warn("Nenhuma mensagem pendente precisou ser atualizada.")
            }
        } catch (error) {
            console.error("Erro ao marcar mensagens como lidas:", error)
        }
    }, [perfil?.id])

    const excluirConversa = useCallback((contatoId: string) => {
        if (!perfil?.id) return

        const idsOcultos = obterSetLocalStorage(chaveMensagensOcultas(perfil.id))
        mensagensRef.current.forEach((mensagem) => {
            const pertenceAConversa =
                (mensagem.remetente_id === perfil.id && mensagem.destinatario_id === contatoId) ||
                (mensagem.remetente_id === contatoId && mensagem.destinatario_id === perfil.id)

            if (pertenceAConversa) {
                idsOcultos.add(mensagem.id)
            }
        })
        salvarSetLocalStorage(chaveMensagensOcultas(perfil.id), idsOcultos)

        setMensagens((mensagensAtuais) =>
            mensagensAtuais.filter((mensagem) => {
                const pertenceAConversa =
                    (mensagem.remetente_id === perfil.id && mensagem.destinatario_id === contatoId) ||
                    (mensagem.remetente_id === contatoId && mensagem.destinatario_id === perfil.id)

                return !pertenceAConversa
            })
        )
    }, [perfil?.id])

    useEffect(() => {
        void carregarHistorico()
    }, [carregarHistorico])

    useEffect(() => {
        if (!supabase || !hasSupabaseConfig || !perfil?.id) return

        const canalMensagens = supabase
            .channel(CANAL_MENSAGENS)
            .on(
                "postgres_changes",
                {
                    event: EVENTO_REALTIME_MENSAGENS,
                    schema: SCHEMA_REALTIME_MENSAGENS,
                    table: TABELA_MENSAGENS,
                },
                (payload) => {
                    const mensagemRecebida = payload.new as Mensagem
                    const idsLidos = obterSetLocalStorage(chaveMensagensLidas(perfil.id))
                    const novaMensagem = {
                        ...mensagemRecebida,
                        lida: mensagemRecebida.lida || idsLidos.has(mensagemRecebida.id),
                    }
                    if (novaMensagem.remetente_id === perfil.id || novaMensagem.destinatario_id === perfil.id) {
                        if (payload.eventType === "INSERT") {
                            setMensagens((prevMensagens) => {
                                if (prevMensagens.some((msg) => msg.id === novaMensagem.id)) return prevMensagens
                                return [...prevMensagens, novaMensagem]
                            })
                        } else if (payload.eventType === "UPDATE") {
                            setMensagens((prevMensagens) =>
                                prevMensagens.map((msg) =>
                                    msg.id === novaMensagem.id ? novaMensagem : msg
                                )
                            )
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(canalMensagens)
        }

    }, [perfil?.id])

    useEffect(() => {
        if (!perfil?.id) return

        const mapaConversas = new Map<string, { ultima: Mensagem; naoLidas: number }>()
        mensagens.forEach((msg) => {
            const contatoId = msg.remetente_id === perfil.id ? msg.destinatario_id : msg.remetente_id
            const dadosAtuais = mapaConversas.get(contatoId)
            const contagemNaoLidas = (!msg.lida && msg.destinatario_id === perfil.id) ? (dadosAtuais?.naoLidas || 0) + 1 : (dadosAtuais?.naoLidas || 0)

            mapaConversas.set(contatoId, {
                ultima: msg,
                naoLidas: contagemNaoLidas,
            })
        })

        const listaResumos: ConversaResumo[] = Array.from(mapaConversas.entries()).map(([contatoId, dados]) => {
            return {
                usuarioId: contatoId,
                nome: "Carregando...",
                foto_url: null,
                ultimaMensagem: dados.ultima.conteudo,
                dataUltimaMensagem: dados.ultima.created_at,
                mensagensNaoLidas: dados.naoLidas,
            }
        })

        listaResumos.sort((a, b) => new Date(b.dataUltimaMensagem).getTime() - new Date(a.dataUltimaMensagem).getTime())
        setConversas(listaResumos)
    }, [mensagens, perfil?.id])

    return {
        mensagens,
        conversas,
        totalMensagensNaoLidas: mensagens.filter(
            (msg) => !msg.lida && msg.destinatario_id === perfil?.id
        ).length,
        loadingChat,
        enviarMensagem,
        marcarComoLidas,
        excluirConversa,
        recarregarChat: carregarHistorico,
    }
}
