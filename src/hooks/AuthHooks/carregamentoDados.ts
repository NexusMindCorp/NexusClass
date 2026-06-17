import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import type { CarregamentoDadosProps, PerfilUsuario, TurmaProfessor} from "./type"


export function carregamentoDados({setPerfil, setMateriasProfessor, isMountedRef, lastUserIdRef, setSession, setLoading} : CarregamentoDadosProps) {
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

        const loadSessionAndData = async ( isInitialLoad: boolean) => {
            try {
                const { data: { session: initialSession }, error } = await supabase.auth.getSession()
                if (error) {
                    console.error("[useAuth] loadSessionAndData - Erro ao obter sessão:", error)
                    throw error
                }
                if (!isMountedRef.current) {
     
                    return
                }

               
                if (initialSession?.user) {
                    lastUserIdRef.current = initialSession.user.id
                    setSession(initialSession)
                    const perfilCarregado = await fetchPerfil(initialSession.user.id)
                     if (perfilCarregado?.role === "professor" && isMountedRef.current) {
                        await fetchMateriasProfessor(initialSession.user.id)
                    }
                } else {
                    lastUserIdRef.current = null
                    setSession(null)
                    setPerfil(null)
                    setMateriasProfessor([])
                }
            } catch (err) {
                console.error("[useAuth] loadSessionAndData - Erro no fluxo inicial:", err)
            } finally {
                 if (isMountedRef.current) {
                    setLoading(false)
                    return isInitialLoad = false
                }
            }
        }

    return {fetchPerfil, fetchMateriasProfessor, loadSessionAndData}
}