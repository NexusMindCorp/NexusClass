import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { AnexoRef } from "@/lib/db/mappers";
import type { TurmaProps } from "../LeituraDataHooks/type";

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
    data_entrega: string;
    created_at?: string | null;
    anexos: AnexoRef[];
    professor_nome?: string;
};
export type MuralProps = {
  materia: string;
  turma: TurmaProps;
  perfil: PerfilUsuario;
  abrirChat: (contatoId: string) => void;
};
