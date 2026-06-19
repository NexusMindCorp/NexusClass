import { useCallback, useEffect, useState, useRef } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase, hasSupabaseConfig } from "@/lib/supabaseClient"
import type { PerfilUsuario, TurmaProfessor } from "./type"
import { carregamentoDados } from "./carregamentoDados"

export function useAuth() {
    // Control user id to avoid redundant fetches and loadings
    const lastUserIdRef = useRef<string | null>(null)
    const isMountedRef = useRef(true)

    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
    const [materiasProfessor, setMateriasProfessor] = useState<TurmaProfessor[]>([])
    const materiasProfessorNomes = materiasProfessor.map((item) => item.materia)
    const {fetchPerfil, fetchMateriasProfessor, loadSessionAndData} = carregamentoDados({setPerfil, setMateriasProfessor, isMountedRef, lastUserIdRef, setSession, setLoading})

    const atualizarPerfilLocal = useCallback((perfilAtualizado: PerfilUsuario) => {

        setPerfil(perfilAtualizado)
    }, [])


    useEffect(() => {
        if (!hasSupabaseConfig || !supabase) {
            setLoading(false)
            return
        }

        isMountedRef.current = true
        let isInitialLoad = true
        
        loadSessionAndData().then(() => {
            isInitialLoad = false
        })

        // Escuta mudanças de estado de autenticação
      
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sessionAtualizada) => {
            // Ignora o primeiro disparo se for INITIAL_SESSION ou SIGNED_IN redundante com a carga inicial
            if (isInitialLoad && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
                return
            }

            if (!isMountedRef.current) {
                console.log("[useAuth] onAuthStateChange - Componente desmontado. Ignorando evento.")
                return
            }

            const novoUserId = sessionAtualizada?.user?.id || null
            const userIdAntigo = lastUserIdRef.current

            if (novoUserId) {
                if (novoUserId !== userIdAntigo) {
                    console.log(`[useAuth] Usuário mudou de ${userIdAntigo} para ${novoUserId}. Carregando dados...`)
                    lastUserIdRef.current = novoUserId
                    setSession(sessionAtualizada)
                    setLoading(true)
                    try {
                        const perfilCarregado = await fetchPerfil(novoUserId)
                        if (perfilCarregado?.role === "professor" && isMountedRef.current) {
                            await fetchMateriasProfessor(novoUserId)
                        }
                    } catch (err) {
                        console.error("[useAuth] onAuthStateChange - Erro no fluxo pós-evento:", err)
                    } finally {
                        if (isMountedRef.current) {
                            console.log("[useAuth] onAuthStateChange - Finalizado pós-evento. Configurando loading para false.")
                            setLoading(false)
                        }
                    }
                } else {
                    setSession(sessionAtualizada)
                }
            } else {
                if (userIdAntigo !== null) {
                    console.log("[useAuth] Usuário deslogou.")
                    lastUserIdRef.current = null
                    setSession(null)
                    setPerfil(null)
                    setMateriasProfessor([])
                    setLoading(false)
                }
            }
        })

        return () => {
        
            isMountedRef.current = false
            subscription?.unsubscribe()
        }
    }, [])

    return { session, loading, perfil, materiasProfessor, materiasProfessorNomes, atualizarPerfilLocal }
}
