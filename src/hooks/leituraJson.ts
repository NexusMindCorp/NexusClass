import turmasJson from "@/dados/turmas.json";

export type EscolaProps = {
  escola: string;
  ano_letivo: number;
  turmas: Record<string, TurmaProps>;
};

export type TurmaProps = {
  materia: string;
  professor: string;
  banners: string;
  alunos: string[];
  foto_professor: string;
  sala: string;
  turma: string;
};

export const listaEscolar = turmasJson as EscolaProps;