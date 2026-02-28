import { listaEscolar } from "@/hooks/leituraJson";
import { TurmaCard } from "./TurmaCard";
import { useGerenciador } from "@/hooks/useGerenciador";
import { Mural } from "./Mural";

export const GerenciadorTelas = () => {
    const {usuario, mudarInscricao, estaInscrito, marcarMural} = useGerenciador();
    const turmaSelecionada = listaEscolar.turmas[usuario.chaveMural];

    return (
        <>
            {!usuario.acessouMural ? (
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
                            inscrito={estaInscrito(key)}
                            clickInscrito={() => mudarInscricao(key)}
                            clickMural={marcarMural}
                        />
                    ))}
                </div>
            ) : (
                <div>
                    {turmaSelecionada && <Mural materia={usuario.chaveMural} turma={turmaSelecionada} />}
                </div>
            )}
        </>
    )
}