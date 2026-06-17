import type { PerfilUsuario } from "@/hooks/AuthHooks/type"
export type BoxPerfilUsuarioProps = {
    nomeUsuario: string
    onClose: () => void
    currentUserProfile: PerfilUsuario | null
}

export type usePerfilUsuarioProps= {
    nomeUsuario: string, 
    currentUserProfile: PerfilUsuario | null
}
