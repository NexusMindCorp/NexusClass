import { useEffect, useState } from "react"
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

    const fetchPerfil = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("perfis")
                .select("*")
                .eq("id", userId)
                .single()

            if (error) {
                throw error
            }

            setPerfil(data)
            return data as PerfilUsuario
        } catch (error: any) {
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


        supabase.auth.getSession().then(async ({ data: { session }, error }) => {
            if (error) {
                toast.error("Erro ao obter sessão", {
                    description: "Não conseguimos obter informações da sua sessão. Tente recarregar a página.",
                })
            } else {
                setSession(session)
                if (session?.user) {
                    const perfilCarregado = await fetchPerfil(session.user.id)
                    if (perfilCarregado?.role === "professor") {
                        await fetchMateriasProfessor(session.user.id)
                    }
                }
            }
            setLoading(false) // Libera o spinner após buscar tudo a primeira vez
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sessionAtualizada) => {
            setSession(sessionAtualizada)

            if (sessionAtualizada?.user) {
                if (event === 'SIGNED_IN') {
                    const perfilCarregado = await fetchPerfil(sessionAtualizada.user.id)
                    if (perfilCarregado?.role === "professor") {
                        console.log("useAuth -> SIGNED_IN professor, iniciando busca de matérias")
                        await fetchMateriasProfessor(sessionAtualizada.user.id)
                    }
                }
            } else {
                setPerfil(null)
                setMateriasProfessor([])
                setLoading(false)
            }
        })

        return () => {
            subscription?.unsubscribe()
        }
    }, [])

    return { session, loading, perfil, materiasProfessor, materiasProfessorNomes }
}