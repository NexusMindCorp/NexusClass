import { useState, useEffect } from "react"
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient"
import type { PerfilUsuario } from "@/hooks/AuthHooks/type"
import { getCorNomeUsuario } from "@/lib/utils"
import type { usePerfilUsuarioProps } from "./type"
export function usePerfilUsuario({ nomeUsuario, currentUserProfile }: usePerfilUsuarioProps) {
    const [perfilAlvo, setPerfilAlvo] = useState<PerfilUsuario | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
        useEffect(() => {
            let isMounted = true
    
            const carregarPerfil = async () => {
                if (!hasSupabaseConfig || !supabase) {
                    setError("Supabase não configurado.")
                    setLoading(false)
                    return
                }
    
                try {
                    setLoading(true)
                    setError(null)
                    
                    // Buscar apenas as colunas necessárias para o perfil
                    const { data, error: fetchError } = await supabase
                        .from("perfis")
                        .select("id, nome, email, bio, foto_url, role, created_at")
                        .eq("nome", nomeUsuario)
                        .maybeSingle()
    
                    if (fetchError) {
                        throw fetchError
                    }
    
                    if (!data) {
                        setError("Perfil não encontrado.")
                    } else if (isMounted) {
                        setPerfilAlvo(data as PerfilUsuario)
                    }
                } catch (err: any) {
                    console.error("Erro ao buscar perfil:", err)
                    setError("Ocorreu um erro ao carregar as informações do perfil.")
                } finally {
                    if (isMounted) {
                        setLoading(false)
                    }
                }
            }
    
            void carregarPerfil()
    
            return () => {
                isMounted = false
            }
        }, [nomeUsuario])
    
        // Determina se o perfil pesquisado pertence ao usuário logado
        const ehProprioUsuario = perfilAlvo && currentUserProfile && perfilAlvo.id === currentUserProfile.id
    
        // Cor baseada nas iniciais do usuário
        const corAvatar = getCorNomeUsuario(nomeUsuario || "U")
    
        return { perfilAlvo, loading, error, ehProprioUsuario, corAvatar }
    
}