import { useCallback, useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase, hasSupabaseConfig } from "@/lib/supabaseClient"
import { toast } from "sonner"

export type PerfilUsuario = {
    id: string;
    nome: string;
    email: string;
    foto_url: string | null;
    bio: string | null;
    created_at: string;
    role: "aluno" | "professor" | "master";
}

export type TurmaProfessor = {
    id: string;
    chave: string;
    materia: string;
    professor: string;
    sala: string;
    turma: string;
}

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
    const [materiasProfessor, setMateriasProfessor] = useState<TurmaProfessor[]>([])
    const materiasProfessorNomes = materiasProfessor.map((item) => item.materia)


    const atualizarPerfilLocal = useCallback((perfilAtualizado: PerfilUsuario) => {

        setPerfil(perfilAtualizado)
    }, [])

    const fetchPerfil = async (userId: string) => {
       
        try {
            const { data, error } = await supabase
                .from("perfis")
                .select("*")
                .eq("id", userId)
                .single()

            if (error) {
                console.error("[useAuth] fetchPerfil - Erro retornado do Supabase:", error)
                throw error
            }

            setPerfil(data)
            return data as PerfilUsuario
        } catch (error: any) {
            console.error("[useAuth] fetchPerfil - Captura de erro no catch:", error)
            toast.error("Erro ao carregar perfil", {
                description: "Não conseguimos buscar os dados da sua conta. Tente recarregar a página.",
            })
            return null
        }
    }

    const fetchMateriasProfessor = async (userId: string) => {
        
        try {
            // 1. Busca os IDs das turmas vinculadas a este professor
            const { data: relacoes, error: relacoesError } = await supabase
                .from("professor_turma")
                .select("turma_id")
                .eq("professor_id", userId)

            if (relacoesError) {
                console.error("[useAuth] fetchMateriasProfessor - Erro ao buscar professor_turma:", relacoesError)
                throw relacoesError
            }

            const turmaIds = (relacoes ?? []).map((item) => item.turma_id)
           

            if (turmaIds.length === 0) {
                setMateriasProfessor([])
                return [] as TurmaProfessor[]
            }

            // 2. Busca os dados completos das turmas usando os IDs encontrados
            const { data: turmas, error: turmasError } = await supabase
                .from("turmas_escolares")
                .select("*")
                .in("id", turmaIds)

            if (turmasError) {
                console.error("[useAuth] fetchMateriasProfessor - Erro ao buscar turmas_escolares:", turmasError)
                throw turmasError
            }

            const turmasEncontradas = (turmas ?? []) as TurmaProfessor[]
            setMateriasProfessor(turmasEncontradas)

            return turmasEncontradas
        } catch (error: any) {
            toast.error("Erro ao carregar matérias do professor", {
                description: "Não conseguimos buscar as matérias relacionadas ao professor.",
            })
            console.error("useAuth.fetchMateriasProfessor erro:", error)
            return [] as TurmaProfessor[]
        }
    }

    useEffect(() => {
        if (!hasSupabaseConfig || !supabase) {
            setLoading(false)
            return
        }

        let isMounted = true
        let isInitialLoad = true

        const loadSessionAndData = async () => {
            console.log("[useAuth] loadSessionAndData - Iniciando carregamento inicial...")
            try {
                const { data: { session: initialSession }, error } = await supabase.auth.getSession()
                if (error) {
                    console.error("[useAuth] loadSessionAndData - Erro ao obter sessão:", error)
                    throw error
                }
                if (!isMounted) {
     
                    return
                }

               
                if (initialSession?.user) {
                    setSession(initialSession)
                    const perfilCarregado = await fetchPerfil(initialSession.user.id)
                    if (perfilCarregado?.role === "professor" && isMounted) {
                        await fetchMateriasProfessor(initialSession.user.id)
                    }
                } else {
                    setSession(null)
                    setPerfil(null)
                    setMateriasProfessor([])
                }
            } catch (err) {
                console.error("[useAuth] loadSessionAndData - Erro no fluxo inicial:", err)
            } finally {
                if (isMounted) {
                    
                    setLoading(false)
                    isInitialLoad = false
                } else {
                    console.log("[useAuth] loadSessionAndData - Finalizado após desmontar. Ignorando finalização de estado.")
                }
            }
        }

        // Executa a carga inicial
        loadSessionAndData()

        // Escuta mudanças de estado de autenticação
      
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sessionAtualizada) => {
            console.log("[useAuth] onAuthStateChange disparado. Evento:", event, "Session:", sessionAtualizada?.user?.id || "Nenhuma", "isInitialLoad:", isInitialLoad)
            
            // Ignora o primeiro disparo se for INITIAL_SESSION ou SIGNED_IN redundante com a carga inicial
            if (isInitialLoad && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
                console.log("[useAuth] onAuthStateChange - Ignorando evento inicial redundante:", event)
                return
            }

            if (!isMounted) {
                console.log("[useAuth] onAuthStateChange - Componente desmontado. Ignorando evento.")
                return
            }

            if (sessionAtualizada?.user) {
                setSession(sessionAtualizada)
                setLoading(true)
                try {
                    const perfilCarregado = await fetchPerfil(sessionAtualizada.user.id)
                    if (perfilCarregado?.role === "professor" && isMounted) {
                        await fetchMateriasProfessor(sessionAtualizada.user.id)
                    }
                } catch (err) {
                    console.error("[useAuth] onAuthStateChange - Erro no fluxo pós-evento:", err)
                } finally {
                    if (isMounted) {
                        console.log("[useAuth] onAuthStateChange - Finalizado pós-evento. Configurando loading para false.")
                        setLoading(false)
                    }
                }
            } else {
               
                setSession(null)
                setPerfil(null)
                setMateriasProfessor([])
                setLoading(false)
            }
        })

        return () => {
        
            isMounted = false
            subscription?.unsubscribe()
        }
    }, [])

    return { session, loading, perfil, materiasProfessor, materiasProfessorNomes, atualizarPerfilLocal }
}
