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

export type CarregamentoDadosProps = {
    setPerfil: React.Dispatch<React.SetStateAction<PerfilUsuario | null>>,
    setMateriasProfessor: React.Dispatch<React.SetStateAction<TurmaProfessor[]>>
    isMountedRef: React.RefObject<boolean>
    lastUserIdRef: React.RefObject<string | null>
    setSession: React.Dispatch<React.SetStateAction<any>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
}