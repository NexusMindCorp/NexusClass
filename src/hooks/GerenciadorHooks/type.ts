import type { EscolaProps } from "../LeituraDataHooks/leituraJson";
import type { PerfilUsuario } from "../AuthHooks/type";
import type { ConversaResumo, Mensagem } from "../MensagensHooks/type";

export type OpcoesTela = "mural" | "calendario" | "principal" | "pesquisar" | "mensagens" | "suporte" | "privacidade" | "configuracoesAvancadas"|"info";

export type PayloadAlertaCalendario = {
    id: string
    evento_id: string
    titulo_evento: string
    mensagem: string
    minutos_antes?: number
    lembrete_para: string
    created_at: string
}

export type EventoCalendarioNotificacao = {
    id: string
    titulo: string
    data: string
    horario: string
    tipo: "pessoal" | "turma"
    turma_id: string | null
    autor_id: string
}

export type UsuarioProps = {
    inscricoes: Record<string, boolean>
    acessouOq: OpcoesTela
    chaveMural: string
    listaDosInscritos: Array<string>
    chatAtivoId: string | null
}
export type GerenciadorTelasProps = {
    usuario: any;
    perfil: PerfilUsuario;
    listaEscolar: EscolaProps;
    loadingInscricoes: boolean;
    mudarInscricao: (key: string) => void;
    estaInscrito: (key: string) => boolean;
    marcarMural: (key: string) => void;
    navegarPara: (tela: OpcoesTela) => void;
    abrirChatComAjuda: () => void;
    abrirChat: (contatoId: string) => void;
    mensagens: Mensagem[];
    conversas: ConversaResumo[];
    enviarMensagem: (destinatarioId: string, conteudoTexto: string) => Promise<void>;
    marcarComoLidas: (contatoId: string) => Promise<void>;
    excluirConversa: (contatoId: string) => void;
}
