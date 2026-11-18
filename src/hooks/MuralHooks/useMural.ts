import { useState, useEffect, useCallback } from "react";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { AnexoRef } from "@/lib/db/mappers";
import { supabase, hasSupabaseConfig } from "@/lib/supabaseClient";
import {
  atividadeRepository,
  duvidaRepository,
  extrairMensagemErroRepo,
  muralRepository,
} from "@/repositories";
import { toast } from "sonner";
import {
  NotificacaoSubject,
  ToastNotificacaoObserver,
  StateRefreshObserver,
  conectarCanaisMuralRealtime,
} from "@/patterns/observer/NotificacaoSubject";
import type { Post, Atividade } from "./type";

export function useMural(turmaId: string, perfil: PerfilUsuario) {
  const [posts, setPosts] = useState<{
    posts: Post[];
    boxAberto: boolean;
    tipoAmostar: "atividade" | "mural" | "contato" | "alunos";
  }>({
    posts: [],
    boxAberto: false,
    tipoAmostar: "mural",
  });
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [atividadesEntregues, setAtividadesEntregues] = useState<Set<string>>(
    new Set(),
  );
  const [loadingAtividades, setLoadingAtividades] = useState(false);
  const [conteudo, setConteudo] = useState("");
  const [assunto, setAssunto] = useState("");
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<
    "mural" | "atividade" | "contato" | "alunos"
  >("mural");
  const [atividadesEntregasAbertas, setAtividadesEntregasAbertas] = useState<
    Record<string, boolean>
  >({});

  const mudarAberturaBox = (boxAberto: boolean) =>
    setPosts((anterior) => ({ ...anterior, boxAberto }));

  const alternarAreaEntrega = (id: string) => {
    setAtividadesEntregasAbertas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const carregarPosts = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase || !turmaId) return;

    try {
      const postsFormatados = await muralRepository.listarPosts(turmaId);
      setPosts((anterior) => ({
        ...anterior,
        posts: postsFormatados,
      }));
    } catch (err: unknown) {
      console.error("Erro ao carregar posts:", err);
      toast.error("Erro ao carregar posts", {
        description: "Não foi possível carregar as publicações do mural.",
      });
    }
  }, [turmaId]);

  const carregarAtividades = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase || !turmaId) return;

    try {
      setLoadingAtividades(true);
      const atividadesFormatadas =
        await atividadeRepository.listarPorTurma(turmaId);
      setAtividades(atividadesFormatadas);

      if (perfil?.role === "aluno" && perfil?.id) {
        const entregues = await atividadeRepository.listarEntregasDoAluno(
          perfil.id,
        );
        setAtividadesEntregues(entregues);
      }
    } catch (err: unknown) {
      console.error("Erro ao carregar atividades:", err);
      toast.error("Erro ao carregar atividades", {
        description: "Não foi possível carregar as atividades da turma.",
      });
    } finally {
      setLoadingAtividades(false);
    }
  }, [turmaId, perfil?.role, perfil?.id]);

  useEffect(() => {
    void carregarPosts();
    void carregarAtividades();
  }, [carregarPosts, carregarAtividades]);

  const abrirMural = () => {
    setPosts((anterior) => ({ ...anterior, tipoAmostar: "mural" }));
    setOpcaoSelecionada("mural");
  };

  const abrirAtividades = () => {
    setPosts((anterior) => ({ ...anterior, tipoAmostar: "atividade" }));
    setOpcaoSelecionada("atividade");
  };

  const abrirContato = () => {
    setPosts((anterior) => ({
      ...anterior,
      tipoAmostar: "contato",
      boxAberto: true,
    }));
    setOpcaoSelecionada("contato");
  };

  const abrirAlunos = () => {
    setPosts((anterior) => ({ ...anterior, tipoAmostar: "alunos" }));
    setOpcaoSelecionada("alunos");
  };

  const handlePublicar = async () => {
    if (!conteudo.trim()) return;

    if (!hasSupabaseConfig || !supabase || !perfil?.id) {
      toast.error("Erro de autenticação", {
        description: "Não foi possível salvar a publicação.",
      });
      return;
    }

    try {
      const novoPost = await muralRepository.criarPost(
        turmaId,
        perfil.id,
        conteudo,
      );
      setPosts((anterior) => ({
        ...anterior,
        posts: [...anterior.posts, novoPost],
      }));
      setConteudo("");
      mudarAberturaBox(false);
      abrirMural();
      toast.success("Publicado com sucesso!");
    } catch (err: unknown) {
      console.error("Erro ao criar post:", err);
      toast.error("Erro ao publicar", {
        description: extrairMensagemErroRepo(err, "Tente novamente."),
      });
    }
  };

  const publicarAtividade = async (
    titulo: string,
    descricao: string,
    dataEntrega: string | null,
    arquivos: File[],
  ) => {
    if (!hasSupabaseConfig || !supabase || !perfil?.id) {
      toast.error("Erro de autenticação", {
        description: "Não foi possível salvar a atividade.",
      });
      return;
    }

    if (!dataEntrega) {
      toast.error("Data de entrega obrigatória", {
        description: "Informe a data e hora limite para entrega da atividade.",
      });
      return;
    }

    try {
      const novaAtividade = await atividadeRepository.criar(
        {
          idTurma: turmaId,
          idProfessor: perfil.id,
          titulo,
          descricao,
          dataEntrega,
        },
        arquivos,
      );

      setAtividades((anterior) => [novaAtividade, ...anterior]);
      toast.success("Atividade criada com sucesso!");
    } catch (err: unknown) {
      console.error("Erro ao criar atividade:", err);
      toast.error("Erro ao criar atividade", {
        description: extrairMensagemErroRepo(err, "Tente novamente."),
      });
      throw err;
    }
  };

  const deletarAtividade = async (atividadeId: string) => {
    if (!hasSupabaseConfig || !supabase) return;

    const atividadeExistente = atividades.find((a) => a.id === atividadeId);
    if (!atividadeExistente) return;

    try {
      await atividadeRepository.excluir(atividadeExistente);
      setAtividades((anterior) => anterior.filter((a) => a.id !== atividadeId));
      toast.success("Atividade excluída com sucesso!");
    } catch (err: unknown) {
      console.error("Erro ao excluir atividade:", err);
      toast.error("Erro ao excluir atividade", {
        description: extrairMensagemErroRepo(err, "Tente novamente."),
      });
    }
  };

  const editarAtividade = async (
    atividadeId: string,
    titulo: string,
    descricao: string,
    dataEntrega: string | null,
    arquivos: File[],
    anexosMantidos: AnexoRef[],
  ) => {
    if (!hasSupabaseConfig || !supabase) return;

    if (!dataEntrega) {
      toast.error("Data de entrega obrigatória", {
        description: "Informe a data e hora limite para entrega da atividade.",
      });
      return;
    }

    const atividadeExistente = atividades.find((a) => a.id === atividadeId);
    const idsMantidos = new Set(anexosMantidos.map((a) => a.idObjeto));
    const anexosRemovidos = (atividadeExistente?.anexos ?? []).filter(
      (a) => !idsMantidos.has(a.idObjeto),
    );

    try {
      const atividadeAtualizada = await atividadeRepository.editar(
        atividadeId,
        { titulo, descricao, dataEntrega },
        arquivos,
        anexosRemovidos,
        anexosMantidos,
      );

      setAtividades((anterior) =>
        anterior.map((a) => (a.id === atividadeId ? atividadeAtualizada : a)),
      );
      toast.success("Atividade atualizada com sucesso!");
    } catch (err: unknown) {
      console.error("Erro ao atualizar atividade:", err);
      toast.error("Erro ao atualizar atividade", {
        description: extrairMensagemErroRepo(err, "Tente novamente."),
      });
      throw err;
    }
  };

  const handleCancelar = () => {
    setConteudo("");
    setAssunto("");
    mudarAberturaBox(false);
    abrirMural();
  };

  const enviarMensagemContato = async (
    assuntoText: string,
    mensagemText: string,
    arquivos: File[],
  ) => {
    if (!hasSupabaseConfig || !supabase || !perfil?.id) {
      toast.error("Erro de autenticação", {
        description: "Não foi possível enviar a mensagem.",
      });
      return;
    }

    try {
      await duvidaRepository.criar(
        {
          idAluno: perfil.id,
          idTurma: turmaId,
          assunto: assuntoText,
          descricao: mensagemText,
        },
        arquivos,
      );

      toast.success("Mensagem enviada com sucesso!");
      setConteudo("");
      setAssunto("");
      setPosts((anterior) => ({ ...anterior, boxAberto: false }));
      abrirMural();
    } catch (err: unknown) {
      console.error("Erro ao enviar mensagem:", err);
      toast.error("Erro ao enviar mensagem", {
        description: extrairMensagemErroRepo(err, "Tente novamente."),
      });
      throw err;
    }
  };

  const deletarPost = async (postId: string) => {
    if (!hasSupabaseConfig || !supabase) return;

    try {
      await muralRepository.excluirPost(postId);
      setPosts((anterior) => ({
        ...anterior,
        posts: anterior.posts.filter((p) => p.id !== postId),
      }));
      toast.success("Publicação excluída com sucesso!");
    } catch (err: unknown) {
      console.error("Erro ao excluir post:", err);
      toast.error("Erro ao excluir", {
        description: extrairMensagemErroRepo(err, "Tente novamente."),
      });
    }
  };

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase || !turmaId || !perfil) return;

    const muralSubject = new NotificacaoSubject();
    const cancelarToastObserver = muralSubject.inscrever(
      new ToastNotificacaoObserver({
        usuarioIdAtual: perfil.id,
        toastFn: toast,
        aoCarregarPosts: () => void carregarPosts(),
        aoCarregarAtividades: () => void carregarAtividades(),
      }),
    );
    const cancelarRefreshObserver = muralSubject.inscrever(
      new StateRefreshObserver({
        usuarioIdAtual: perfil.id,
        aoRecarregarAtividades: () => void carregarAtividades(),
      }),
    );
    const desconectarCanais = conectarCanaisMuralRealtime(
      supabase,
      muralSubject,
      {
        turmaId,
        alunoId: perfil.id,
      },
    );

    return () => {
      cancelarToastObserver();
      cancelarRefreshObserver();
      desconectarCanais();
    };
  }, [turmaId, perfil, carregarPosts, carregarAtividades]);

  return {
    opcaoSelecionada,
    posts,
    atividades,
    atividadesEntregues,
    loadingAtividades,
    conteudo,
    setConteudo,
    assunto,
    setAssunto,
    mudarAberturaBox,
    handlePublicar,
    handleCancelar,
    abrirMural,
    abrirAtividades,
    abrirContato,
    enviarMensagemContato,
    abrirAlunos,
    deletarPost,
    publicarAtividade,
    deletarAtividade,
    carregarAtividades,
    editarAtividade,
    atividadesEntregasAbertas,
    alternarAreaEntrega,
  };
}
