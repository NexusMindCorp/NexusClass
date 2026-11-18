export type UsuarioResumo = {
  id: string;
  nome: string;
  foto_url: string | null;
}

export type TurmaProps = {
  id?: string;
  id_escola?: string;
  materia: string;
  professor: string;
  professor_id?: string;
  banners: string;
  alunos: UsuarioResumo[];
  foto_professor: string;
  sala: string;
  turma: string;
};

export type EscolaProps = {
  id?: string;
  escola: string;
  ano_letivo: number;
  turmas: Record<string, TurmaProps>;
};

export type TurmaBanco = {
  id_turma: number;
  codigo_acesso: string;
  materia: string;
  banner_url: string | null;
  sala: string;
  periodo_escolar: string;
  id_escola: number;
};