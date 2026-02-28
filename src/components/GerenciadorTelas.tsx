import { listaEscolar } from "@/hooks/leituraJson";
import { TurmaCard } from "./TurmaCard";

export const GerenciadorTelas = () => {
    return (
        <>
            <div>
                {listaEscolar.turmas && Object.entries(listaEscolar.turmas).map(([key, turma]) => (
                    <TurmaCard
                        key={key}
                        materia={key}
                        banners={turma.banners}
                        professor={turma.professor}
                        fotoProfessor={turma.foto_professor}
                        sala={turma.sala}
                        turma={turma.turma}
                    />
                ))}
            </div>
        </>
    )
}