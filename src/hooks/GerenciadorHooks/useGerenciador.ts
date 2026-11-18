import { useEffect, useRef, useState, useCallback } from "react"
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient"
import { escolaTurmaRepository, extrairMensagemErroRepo } from "@/repositories"
import { toast } from "sonner"
import type { PerfilUsuario } from "@/hooks/AuthHooks/type"
import { montarDataEvento } from "@/lib/utils"
import {
    NotificacaoSubject,
    ToastNotificacaoObserver,
    conectarCanalAlertasCalendarioRealtime,
} from "@/patterns/observer/NotificacaoSubject"
import type { OpcoesTela, UsuarioProps } from "./type"
import { ESTADO_INICIAL_USUARIO } from "./config"
import { useCarregarData } from "./carregarData"

export function useGerenciador(perfil: PerfilUsuario | null) {
    const alertasEnviadosRef = useRef<Set<string>>(new Set())
    const [pedirAjuda, setPedirAjuda] = useState(false);
    const [usuario, setUsuario] = useState<UsuarioProps>(ESTADO_INICIAL_USUARIO);
    const [loadingInscricoes, setLoadingInscricoes] = useState(true);
    const{ buscarMatriculasDoUsuario, verificarLembretesLocais } = useCarregarData({ hasSupabaseConfig, supabase, perfil, setLoadingInscricoes, setUsuario, toast })

    const perfilRef = useRef(perfil);
    const usuarioRef = useRef(usuario);

    useEffect(() => {
        perfilRef.current = perfil;
    }, [perfil]);

    useEffect(() => {
        usuarioRef.current = usuario;
    }, [usuario]);

    const deveAlertarEvento = useCallback((evento: { tipo: "pessoal" | "turma"; autor_id: string; turma_id: string | null }) => {
        const perfilAtual = perfilRef.current;
        const usuarioAtual = usuarioRef.current;

        if (!perfilAtual) return false;

        if (evento.tipo === "pessoal") {
            return evento.autor_id === perfilAtual.id;
        }

        if (evento.tipo === "turma") {
            if (perfilAtual.role === "master") return true;
            if (evento.autor_id === perfilAtual.id) return true;
            if (evento.turma_id && usuarioAtual.inscricoes[evento.turma_id]) {
                return true;
            }
        }

        return false;
    }, []);


    const limparEstado = () => {
        setUsuario(ESTADO_INICIAL_USUARIO);
        setPedirAjuda(false);
        alertasEnviadosRef.current.clear();
        setLoadingInscricoes(true);
    }

    const acionarAjuda = () => setPedirAjuda(true);


    useEffect(() => {
        void buscarMatriculasDoUsuario()
    }, [buscarMatriculasDoUsuario]);

    const mudarInscricao = async (turmaId: string) => {
        if (!hasSupabaseConfig || !supabase || !perfil?.id) {
            toast.error("Erro de autenticação", { description: "Sessão inválida ou não configurada." })
            return
        }
        if (perfil.role !== "aluno") {
            toast.error("Ação não permitida", {
                description: "Apenas alunos podem alterar inscrições em turmas (vínculos de professores são geridos pela coordenação).",
            })
            return
        }
        const jaInscrito = usuario.inscricoes[turmaId];

        try {
            await escolaTurmaRepository.alternarMatriculaAluno(perfil.id, turmaId, jaInscrito);
            toast.success(
                jaInscrito ? "Desinscrição realizada" : "Inscrição realizada",
                {
                    description: jaInscrito
                        ? "Você foi desinscrito desta turma."
                        : "Você foi inscrito nesta turma.",
                },
            );

            setUsuario((anterior) => {
                const proximasInscricoes = {
                    ...anterior.inscricoes,
                    [turmaId]: !anterior.inscricoes[turmaId],
                };

                return {
                    ...anterior,
                    inscricoes: proximasInscricoes,
                    listaDosInscritos: Object.keys(proximasInscricoes).filter((id) => proximasInscricoes[id]),
                };
            });

        } catch (error: unknown) {
            toast.error("Erro ao atualizar inscrição", {
                description: extrairMensagemErroRepo(error, "Por favor, verifique sua conexão."),
            });
        }
    };

    const estaInscrito = (materia: string) => Boolean(usuario.inscricoes[materia]);

    const marcarMural = (key: string) => {
        setUsuario((anterior) => ({ ...anterior, acessouOq: "mural", chaveMural: key }));
    };

    const marcarCalendario = () => {
        setUsuario((anterior) => ({ ...anterior, acessouOq: "calendario" }));
    };

    const navegarPara = (tela: OpcoesTela) => {
        setUsuario((anterior) => ({ ...anterior, acessouOq: tela }));
        if (tela === "principal") {
            void buscarMatriculasDoUsuario();
        }
    };

    const marcarPesquisa = () => {
        setUsuario((anterior) => ({ ...anterior, acessouOq: "pesquisar" }));
    }

    const marcarPrivacidade = () => {
        setUsuario((anterior) => ({ ...anterior, acessouOq: "privacidade" }));
    }

    const abrirChat = (contatoId: string) => {
        setUsuario((anterior) => ({ ...anterior, chatAtivoId: contatoId, acessouOq: "mensagens" }));
    }

    useEffect(() => {
        if (!hasSupabaseConfig || !supabase) {
            return
        }
        const supabaseClient = supabase
        const alertasSubject = new NotificacaoSubject()
        const cancelarToastObserver = alertasSubject.inscrever(
            new ToastNotificacaoObserver({
                usuarioIdAtual: perfil?.id ?? "",
                toastFn: toast,
                alertasEnviados: alertasEnviadosRef.current,
            })
        )
        const desconectarCanal = conectarCanalAlertasCalendarioRealtime(
            supabaseClient,
            alertasSubject
        )

        return () => {
            cancelarToastObserver()
            desconectarCanal()
        }
    }, [perfil?.id])

    useEffect(() => {
        if (!hasSupabaseConfig || !supabase) {
            return
        }

        const supabaseClient = supabase

        void verificarLembretesLocais(supabaseClient, deveAlertarEvento, montarDataEvento, alertasEnviadosRef)
        const intervalo = window.setInterval(() => {
            void verificarLembretesLocais(supabaseClient, deveAlertarEvento, montarDataEvento, alertasEnviadosRef)
        }, 30000)

        return () => {
            window.clearInterval(intervalo)
        }
    }, [deveAlertarEvento])

    return {
        usuario,
        pedirAjuda,
        setUsuario,
        limparEstado,
        acionarAjuda,
        mudarInscricao,
        estaInscrito,
        marcarMural,
        marcarCalendario,
        navegarPara,
        marcarPesquisa,
        marcarPrivacidade,
        loadingInscricoes,
        abrirChat
    };
}
