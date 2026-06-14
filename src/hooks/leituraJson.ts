import turmasJson from "@/dados/turmas.json";

export type UsuarioResumo = {
  id: string;
  nome: string;
  foto_url: string | null;
}

export type TurmaProps = {
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
  escola: string;
  ano_letivo: number;
  turmas: Record<string, TurmaProps>;
};

export const listaEscolar = turmasJson as unknown as EscolaProps;