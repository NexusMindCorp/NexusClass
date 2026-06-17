export type PerfilUsuario = {
    id: string;
    nome: string;
    email: string;
    foto_url: string | null;
    bio: string | null;
    created_at: string;
    role: "aluno" | "professor" | "master";
}

export type TurmaProfessor = {
    id: string;
    chave: string;
    materia: string;
    professor: string;
    sala: string;
    turma: string;
}