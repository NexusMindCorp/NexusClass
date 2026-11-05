import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase, hasSupabaseConfig } from "@/lib/supabaseClient";
import { toast } from "sonner";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { Duvida, DuvidaRegistroBanco } from "@/hooks/DuvidaHooks/type";
import { extrairUrlsAnexo, obterNomeArquivoDoUrl } from "@/lib/utils";
import {
  filtrarDuvidasPorPerfilEStatus,
  filtroDuvidasPendentesStrategy,
  filtroDuvidasPorPerfilStrategy,
  type StatusFiltroDuvida,
} from "@/patterns/strategy/FiltroStrategy";

function extrairMensagemErro(err: unknown, padrao: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.length > 0) {
      return msg;
    }
  }
  return padrao;
}

export function normalizarDuvida(d: DuvidaRegistroBanco): Duvida {
  const alunoData = Array.isArray(d.aluno) ? d.aluno[0] : d.aluno;
  const profData = Array.isArray(d.professor) ? d.professor[0] : d.professor;
  const turmaData = Array.isArray(d.turma) ? d.turma[0] : d.turma;

  return {
    ...d,
    aluno: alunoData || undefined,
    professor: profData || undefined,
    turma: turmaData || undefined,
  };
}

export function useDuvidas(
  perfil: PerfilUsuario | null,
  duvidasIniciais: Duvida[] = [],
) {
  const [duvidas, setDuvidas] = useState<Duvida[]>(duvidasIniciais);
  const [loading, setLoading] = useState(false);
  const [estadoFiltro, setEstadoFiltro] = useState<{
    perfilRef: PerfilUsuario | null;
    status: StatusFiltroDuvida;
  }>({
    perfilRef: perfil,
    status: "todas",
  });

  const filtro: StatusFiltroDuvida =
    estadoFiltro.perfilRef === perfil ? estadoFiltro.status : "todas";

  const setFiltro = useCallback(
    (novoFiltro: StatusFiltroDuvida | string) => {
      setEstadoFiltro({
        perfilRef: perfil,
        status: novoFiltro as StatusFiltroDuvida,
      });
    },
    [perfil],
  );

  const carregarDuvidas = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase || !perfil?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("duvidasalunostoprofessor")
        .select(`
          id,
          aluno_id,
          prof_id,
          turma_id,
          assunto,
          descricao,
          anexo_url,
          created_at,
          resolvido,
          resposta,
          aluno:aluno_id (nome, email, foto_url),
          professor:prof_id (nome),
          turma:turma_id (materia, turma)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const formatadas: Duvida[] = (data as unknown as DuvidaRegistroBanco[]).map(
          normalizarDuvida,
        );
        setDuvidas(formatadas);
      }
    } catch (err: unknown) {
      toast.error("Erro ao carregar dúvidas", {
        description: extrairMensagemErro(err, "Tente novamente mais tarde."),
      });
    } finally {
      setLoading(false);
    }
  }, [perfil?.id]);

  const deletarDuvida = async (duvidaId: string) => {
    if (!hasSupabaseConfig || !supabase) return;

    try {
      const duvidaExistente = duvidas.find((d) => d.id === duvidaId);
      if (duvidaExistente?.anexo_url) {
        const urls = extrairUrlsAnexo(duvidaExistente.anexo_url);
        if (urls.length > 0) {
          const caminhosParaDeletar = urls
            .map(obterNomeArquivoDoUrl)
            .filter(Boolean);
          if (caminhosParaDeletar.length > 0) {
            await supabase.storage
              .from("duvidasalunostoprofessor")
              .remove(caminhosParaDeletar);
          }
        }
      }

      const { error } = await supabase
        .from("duvidasalunostoprofessor")
        .delete()
        .eq("id", duvidaId);

      if (error) throw error;

      setDuvidas((prev) => prev.filter((d) => d.id !== duvidaId));
      toast.success("Dúvida excluída com sucesso!");
    } catch (err: unknown) {
      toast.error("Erro ao excluir dúvida", {
        description: extrairMensagemErro(err, "Tente novamente."),
      });
    }
  };

  const responderDuvida = async (duvidaId: string, respostaText: string) => {
    if (!hasSupabaseConfig || !supabase) return;

    try {
      const { error } = await supabase
        .from("duvidasalunostoprofessor")
        .update({
          resposta: respostaText,
          resolvido: true,
        })
        .eq("id", duvidaId);

      if (error) throw error;

      setDuvidas((prev) =>
        prev.map((d) =>
          d.id === duvidaId
            ? { ...d, resposta: respostaText, resolvido: true }
            : d,
        ),
      );
      toast.success("Dúvida respondida com sucesso!");
    } catch (err: unknown) {
      toast.error("Erro ao responder dúvida", {
        description: extrairMensagemErro(err, "Tente novamente."),
      });
      throw err;
    }
  };

  useEffect(() => {
    void carregarDuvidas();
  }, [carregarDuvidas]);

  const duvidasFiltradas = useMemo(() => {
    return filtroDuvidasPorPerfilStrategy.filtrar(duvidas, perfil);
  }, [duvidas, perfil]);

  const duvidasFiltradasPorStatus = useMemo(() => {
    return filtrarDuvidasPorPerfilEStatus(duvidas, perfil, filtro);
  }, [duvidas, perfil, filtro]);

  const duvidasPendentes = useMemo(() => {
    return filtroDuvidasPendentesStrategy.filtrar(duvidasFiltradas);
  }, [duvidasFiltradas]);

  return {
    duvidas,
    loading,
    filtro,
    setFiltro,
    duvidasFiltradas,
    duvidasFiltradasPorStatus,
    duvidasPendentes,
    totalDuvidasPendentes: duvidasPendentes.length,
    carregarDuvidas,
    deletarDuvida,
    responderDuvida,
  };
}
