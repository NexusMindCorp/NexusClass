import type { EscolaProps } from "@/hooks/leituraJson";
import { TurmaCard } from "./TurmaCard";
import { BoasVindas } from "./BoasVindas"
import { Mural } from "./Mural";
import { Calendario } from "./Calendario";
import { Pesquisar } from "./Pesquisar";
import { Mensagens } from "./Mensagens";
import type { OpcoesTela } from "@/hooks/useGerenciador";
import { AcordoPrivacidade } from "./AcordoPrivacidade";
import { Suporte } from "./Suporte";
import type { PerfilUsuario } from "@/hooks/useAuth";
import { ConfiguracoesAvancadas } from "./ConfiguracoesAvancadas";


type GerenciadorTelasProps = {
    usuario: any;
    perfil: PerfilUsuario;
    listaEscolar: EscolaProps;
    loadingInscricoes: boolean;
    mudarInscricao: (key: string) => void;
    estaInscrito: (key: string) => boolean;
    marcarMural: (key: string) => void;
    navegarPara: (tela: OpcoesTela) => void;
    abrirChatComAjuda: () => void;
}

export function GerenciadorTelas(props: GerenciadorTelasProps) {
    const turmaSelecionada = props.listaEscolar.turmas[props.usuario.chaveMural];
    const isNovoUsuario = !props.loadingInscricoes && props.usuario.listaDosInscritos.length === 0;
    const isMaster = props.perfil?.role === "master";

    return (
        <>
            {(props.usuario.acessouOq === "principal" || props.usuario.acessouOq === "pesquisar") && isNovoUsuario && !isMaster && (
                <BoasVindas perfil={props.perfil} acionarExplorar={() => props.navegarPara("pesquisar")} />
            )}
            {(props.usuario.acessouOq === "principal" || props.usuario.acessouOq === "pesquisar") && (
                <div className="display grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {props.listaEscolar.turmas && Object.entries(props.listaEscolar.turmas)
                        .filter(([key]) => props.estaInscrito(key) || props.perfil.role === "master")
                        .sort((a, b) => a[1].materia.localeCompare(b[1].materia))
                        .map(([key, turma]) => (
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
                                perfil={props.perfil}
                            />
                        ))}
                </div>
            )}
            {props.usuario.acessouOq === "mural" && (
                <div>
                    {turmaSelecionada && <Mural materia={props.usuario.chaveMural} turma={turmaSelecionada} perfil={props.perfil} />}
                </div>
            )}
            {props.usuario.acessouOq === "calendario" &&
                <div className="w-full flex items-center justify-center p-4">
                    <Calendario
                        perfil={props.perfil}
                        inscricoes={props.usuario.inscricoes}
                        turmasGlobais={props.listaEscolar.turmas}
                    />
                </div>}

            {props.usuario.acessouOq === "pesquisar" &&
                <div className="w-full flex items-center justify-center p-4">
                    <Pesquisar
                        mudarInscricao={props.mudarInscricao}
                        estaInscrito={props.estaInscrito}
                        marcarMural={props.marcarMural}
                        voltarPrincipal={() => props.navegarPara("principal")}
                        turmas={props.listaEscolar.turmas}
                        perfil={props.perfil}
                    />
                </div>}
            {props.usuario.acessouOq === "mensagens" &&
                <div className="w-full flex items-center justify-center p-4">
                    <Mensagens />
                </div>}
            {props.usuario.acessouOq === "suporte" &&
                <div className="w-full flex items-center justify-center p-4">
                    <div>
                        <Suporte />
                    </div>
                </div>}
            {props.usuario.acessouOq === "privacidade" &&
                <div className="w-full flex items-center justify-center p-4">
                    <AcordoPrivacidade acionarAjuda={props.abrirChatComAjuda} />
                </div>}

            {props.usuario.acessouOq === "configuracoesAvancadas" && (
                <div className="w-full flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl">
                        <ConfiguracoesAvancadas estaInscrito={props.estaInscrito} usuario={props.usuario} listaEscolar={props.listaEscolar} cancelarInscricao={props.mudarInscricao} />
                    </div>
                </div>
            )}
        </>
    )
}