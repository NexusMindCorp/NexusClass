import type{ PerfilUsuario } from "@/hooks/AuthHooks/type"
import type { TurmaProps } from "../LeituraDataHooks/leituraJson";
export type Post = {
    id: string;
    Nome: string;
    conteudo: string;
    data: string;
    autor: PerfilUsuario | null;
};

export type Atividade = {
    id: string;
    turma_id: string;
    professor_id: string;
    titulo: string;
    descricao: string;
    data_entrega: string | null;
    created_at: string;
    anexo_url: string | null;
    professor_nome?: string;
};
export type MuralProps = {
  materia: string;
  turma: TurmaProps;
  perfil: PerfilUsuario;
  abrirChat: (contatoId: string) => void;
};
