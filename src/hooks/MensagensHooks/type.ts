import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { EscolaProps } from "@/hooks/LeituraDataHooks/leituraJson";
export type Mensagem = {
    id: string;
    remetente_id: string;
    destinatario_id: string;
    conteudo: string;
    lida: boolean;
    created_at: string;
    assunto?: string | null;
}

export type ConversaResumo = {
    usuarioId: string;
    nome: string;
    foto_url: string | null;
    ultimaMensagem: string;
    dataUltimaMensagem: string;
    mensagensNaoLidas: number;
}

export type MensagensProps = {
    perfil: PerfilUsuario | null;
    chatAtivoId: string | null;
    listaEscolar: EscolaProps;
};
