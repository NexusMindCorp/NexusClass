import { listaEscolar } from "@/hooks/leituraJson";
import { TurmaCard } from "./TurmaCard";
import { Mural } from "./Mural";
import { Calendario } from "./Calendario";
import { Pesquisar } from "./Pesquisar";

type GerenciadorTelasProps = {
    usuario: any;
    mudarInscricao: (key: string) => void;
    estaInscrito: (key: string) => boolean;
    marcarMural: (key: string) => void;
    navegarPara: (tela: "mural" | "calendario" | "principal" | "pesquisar") => void;
}

export const GerenciadorTelas = (props: GerenciadorTelasProps) => {
    const turmaSelecionada = listaEscolar.turmas[props.usuario.chaveMural];

    return (
        <>
            {(props.usuario.acessouOq === "principal" || props.usuario.acessouOq === "pesquisar") && (
                <div className="display grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listaEscolar.turmas && Object.entries(listaEscolar.turmas).map(([key, turma]) => (
                        <TurmaCard
                            key={key}
                            materia={turma.materia}
                            banners={turma.banners}
                            professor={turma.professor}
                            fotoProfessor={turma.foto_professor}
                            sala={turma.sala}
                            turma={turma.turma}
                            inscrito={props.estaInscrito(key)}
                            clickInscrito={() => props.mudarInscricao(key)}
                            clickMural={() => props.marcarMural(key)}
                        />
                    ))}
                </div>
            )}
            {props.usuario.acessouOq === "mural" && (
                <div>
                    {turmaSelecionada && <Mural materia={props.usuario.chaveMural} turma={turmaSelecionada} />}
                </div>
            )}
            {props.usuario.acessouOq === "calendario" &&
                <div className="w-full flex items-center justify-center p-4">
                    <Calendario />
                </div>}

            {props.usuario.acessouOq === "pesquisar" &&
                <div className="w-full flex items-center justify-center p-4">
                    <Pesquisar mudarInscricao={props.mudarInscricao} estaInscrito={props.estaInscrito} marcarMural={props.marcarMural} voltarPrincipal={() => props.navegarPara("principal")} />
                </div>}
        </>
    )
}