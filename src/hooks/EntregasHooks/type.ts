import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { TabelaRow } from "@/lib/database.types";

export type Entrega = {
    id: string;
    atividade_id: string;
    aluno_id: string;
    id_objeto_storage: string;
    caminho_arquivo: string | null;
    nome_arquivo: string;
    nota: number | null;
    feedback: string | null;
    no_prazo: boolean;
    entregue_em: string;
    aluno_nome?: string;
};

export type EntregaRowComPerfil = TabelaRow<"entrega_atividade"> & {
    perfil?: { nome?: string | null } | Array<{ nome?: string | null }> | null;
};

export type BoxEntregaAtividadeProps = {
    atividadeId: string;
    perfil: PerfilUsuario;
    dataEntregaAtividade: string | null;
};
