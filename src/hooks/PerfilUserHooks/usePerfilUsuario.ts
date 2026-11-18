import { useState, useEffect } from "react"
import { hasSupabaseConfig } from "@/lib/supabaseClient"
import { perfilRepository } from "@/repositories"
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
                if (!hasSupabaseConfig) {
                    setError("Supabase não configurado.")
                    setLoading(false)
                    return
                }
    
                try {
                    setLoading(true)
                    setError(null)
                    const data = await perfilRepository.buscarPorNome(nomeUsuario)
    
                    if (!data) {
                        setError("Perfil não encontrado.")
                    } else if (isMounted) {
                        setPerfilAlvo(data)
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
    

        const ehProprioUsuario = perfilAlvo && currentUserProfile && perfilAlvo.id === currentUserProfile.id
    

        const corAvatar = getCorNomeUsuario(nomeUsuario || "U")
    
        return { perfilAlvo, loading, error, ehProprioUsuario, corAvatar }
    
}