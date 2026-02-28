import { listaEscolar } from "@/hooks/leituraJson";
import { TurmaCard } from "./TurmaCard";

export const GerenciadorTelas = () => {
    return (
        <>
            {listaEscolar.turmas && Object.entries(listaEscolar.turmas).map(([key, turma]) => (
                <TurmaCard
                    key={key}
                    materia={key}
                    professor={turma.professor}
                    fotoProfessor={turma.foto_professor}
                    sala={turma.sala}
                    turma={turma.turma}
                />
            ))}
        </>
    )
}