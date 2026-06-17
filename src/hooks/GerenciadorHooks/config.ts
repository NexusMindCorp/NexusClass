import type{ OpcoesTela, UsuarioProps } from "./type"

export const ESTADO_INICIAL_USUARIO: UsuarioProps = {
    inscricoes: {} as Record<string, boolean>,
    acessouOq: "principal" as OpcoesTela,
    chaveMural: "",
    listaDosInscritos: [],
    chatAtivoId: null,
}