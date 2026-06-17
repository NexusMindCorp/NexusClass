import type {TurmaProps } from "@/hooks/LeituraDataHooks/leituraJson"
import type { PerfilUsuario } from "@/hooks/AuthHooks/type"
export type PesquisarProps = {
    mudarInscricao: (materia: string) => void
    estaInscrito: (materia: string) => boolean
    marcarMural: (key: string) => void
    voltarPrincipal: () => void
    turmas: Record<string, TurmaProps>
    perfil: PerfilUsuario
}

export type UsePesquisaProps = {
    aoFecharPesquisa: () => void
    turmas: Record<string, TurmaProps>
}
