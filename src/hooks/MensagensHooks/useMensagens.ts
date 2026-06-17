import { useState, useEffect, useCallback, useRef } from "react"
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient"
import type { PerfilUsuario } from "@/hooks/AuthHooks/type"
import { toast } from "sonner"
import type { Mensagem, ConversaResumo} from "@/hooks/MensagensHooks/type"

const CHAVE_MENSAGENS_LIDAS = "nexusclass:mensagens-lidas"

function obterIdsLidos(usuarioId: string) {
    try {
        const valorSalvo = localStorage.getItem(`${CHAVE_MENSAGENS_LIDAS}:${usuarioId}`)
        return new Set<string>(valorSalvo ? JSON.parse(valorSalvo) : [])
    } catch {
        return new Set<string>()
    }
}

function salvarIdsLidos(usuarioId: string, ids: Set<string>) {
    localStorage.setItem(
        `${CHAVE_MENSAGENS_LIDAS}:${usuarioId}`,
        JSON.stringify(Array.from(ids))
    )
}

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
                .from("mensagens")
                .select("*")
                .or(`remetente_id.eq.${perfil.id},destinatario_id.eq.${perfil.id}`)
                .order("created_at", { ascending: true })

            if (error) throw error

            if (data) {
                const idsLidos = obterIdsLidos(perfil.id)
                const historico = (data as Mensagem[]).map((mensagem) => ({
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
                .from("mensagens")
                .insert({
                    remetente_id: perfil.id,
                    destinatario_id: destinatarioId,
                    conteudo: conteudoTexto.trim(),
                    lida: false,
                    assunto: "",
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

        const idsLidos = obterIdsLidos(perfil.id)
        mensagensRef.current.forEach((mensagem) => {
            if (
                mensagem.remetente_id === contatoId &&
                mensagem.destinatario_id === perfil.id
            ) {
                idsLidos.add(mensagem.id)
            }
        })
        salvarIdsLidos(perfil.id, idsLidos)

        setMensagens((prevMensagens) =>
            prevMensagens.map((msg) =>
                msg.remetente_id === contatoId && msg.destinatario_id === perfil.id
                    ? { ...msg, lida: true }
                    : msg
            )
        )

        try {
            const { data, error } = await supabase
                .from("mensagens")
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

    useEffect(() => {
        void carregarHistorico()
    }, [carregarHistorico])

    useEffect(() => {
        if (!supabase || !hasSupabaseConfig || !perfil?.id) return

        const canalMensagens = supabase
            .channel("chat-nexusclass")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "mensagens" },
                (payload) => {
                    const mensagemRecebida = payload.new as Mensagem
                    const idsLidos = obterIdsLidos(perfil.id)
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
        recarregarChat: carregarHistorico,
    }
}
