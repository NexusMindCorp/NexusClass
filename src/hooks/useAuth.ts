import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase, hasSupabaseConfig } from "@/lib/supabaseClient"
import { toast } from "sonner"

export interface PerfilUsuario {
    id: string;
    nome: string;
    email: string;
    foto_url: string | null;
    bio: string | null;
    created_at: string;
    role: "aluno" | "professor" | "master";
}

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)

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
        } catch (error: any) {
            toast.error("Erro ao carregar perfil", {
                description: "Não conseguimos buscar os dados da sua conta. Tente recarregar a página.",
            })
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
                    await fetchPerfil(session.user.id)
                }
            }
            setLoading(false) // Libera o spinner após buscar tudo a primeira vez
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sessionAtualizada) => {
            setSession(sessionAtualizada)
            
            if (sessionAtualizada?.user) {
                if (event === 'SIGNED_IN') {
                    await fetchPerfil(sessionAtualizada.user.id)
                }
            } else {
                setPerfil(null)
                setLoading(false)
            }
        })

        return () => {
            subscription?.unsubscribe()
        }
    }, [])

    return { session, loading, perfil }
}