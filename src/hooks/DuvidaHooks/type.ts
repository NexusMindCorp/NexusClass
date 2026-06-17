import type { UsuarioProps } from "@/hooks/GerenciadorHooks/type";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
export type Duvida = {
    id: string;
    aluno_id: string;
    prof_id: string;
    turma_id: string;
    assunto: string;
    descricao: string;
    anexo_url: string | null;
    created_at: string;
    resolvido: boolean;
    resposta: string | null;
    aluno?: {
        nome: string;
        email: string;
        foto_url: string | null;
    };
    professor?: {
        nome: string;
    };
    turma?: {
        materia: string;
        turma: string;
    };
};
export type DuvidasBoxProps = {
    usuario: UsuarioProps | any;
    perfil: PerfilUsuario | null;
};
