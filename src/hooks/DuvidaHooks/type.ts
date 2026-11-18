import type { UsuarioProps } from "@/hooks/GerenciadorHooks/type";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { TabelaRow } from "@/lib/database.types";
import type { AnexoRef } from "@/lib/db/mappers";

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

export type DuvidaTurmaBanco = {
  materia: string;
  periodo_escolar: string;
};

export type Duvida = {
  id: string;
  aluno_id: string;
  prof_id: string | null;
  turma_id: string;
  assunto: string;
  descricao: string;
  anexos: AnexoRef[];
  created_at: string;
  resolvido: boolean;
  resposta: string | null;
  aluno?: DuvidaAlunoInfo;
  professor?: DuvidaProfessorInfo;
  turma?: DuvidaTurmaInfo;
};

export type DuvidaRegistroBanco = TabelaRow<"duvida"> & {
  aluno?: DuvidaAlunoInfo | DuvidaAlunoInfo[] | null;
  professor?: DuvidaProfessorInfo | DuvidaProfessorInfo[] | null;
  turma?: DuvidaTurmaBanco | DuvidaTurmaBanco[] | null;
};

export type DuvidasBoxProps = {
  usuario?: UsuarioProps;
  perfil: PerfilUsuario | null;
};
