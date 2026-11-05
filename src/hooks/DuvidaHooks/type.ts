import type { UsuarioProps } from "@/hooks/GerenciadorHooks/type";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";

export type DuvidaAlunoInfo = {
  nome: string;
  email: string;
  foto_url: string | null;
};

export type DuvidaProfessorInfo = {
  nome: string;
};

export type DuvidaTurmaInfo = {
  materia: string;
  turma: string;
};

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
  aluno?: DuvidaAlunoInfo;
  professor?: DuvidaProfessorInfo;
  turma?: DuvidaTurmaInfo;
};

export type DuvidaRegistroBanco = Omit<Duvida, "aluno" | "professor" | "turma"> & {
  aluno?: DuvidaAlunoInfo | DuvidaAlunoInfo[] | null;
  professor?: DuvidaProfessorInfo | DuvidaProfessorInfo[] | null;
  turma?: DuvidaTurmaInfo | DuvidaTurmaInfo[] | null;
};

export type DuvidasBoxProps = {
  usuario?: UsuarioProps;
  perfil: PerfilUsuario | null;
};
