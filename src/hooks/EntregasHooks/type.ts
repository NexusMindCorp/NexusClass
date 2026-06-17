import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
export type Entrega = {
    id: string;
    atividade_id: string;
    aluno_id: string;
    url_anexo: string | null;
    nota: number | null;
    feedback: string | null;
    no_prazo: boolean;
    entregue_em: string;
    created_at: string;
    updated_at: string;
    aluno_nome?: string;
};

export type BoxEntregaAtividadeProps = {
    atividadeId: string;
    perfil: PerfilUsuario;
    dataEntregaAtividade: string | null;
};