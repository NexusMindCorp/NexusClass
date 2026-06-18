export const CHAVE_MENSAGENS_LIDAS = "nexusclass:mensagens-lidas"
export const CHAVE_MENSAGENS_OCULTAS = "nexusclass:mensagens-ocultas"
export const CANAL_MENSAGENS = "chat-nexusclass"
export const ASSUNTO_MENSAGEM_PADRAO = ""
export const TABELA_MENSAGENS = "mensagens"
export const SCHEMA_REALTIME_MENSAGENS = "public"
export const EVENTO_REALTIME_MENSAGENS = "*"

export const chaveMensagensLidas = (usuarioId: string) =>
    `${CHAVE_MENSAGENS_LIDAS}:${usuarioId}`

export const chaveMensagensOcultas = (usuarioId: string) =>
    `${CHAVE_MENSAGENS_OCULTAS}:${usuarioId}`
