import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase, hasSupabaseConfig } from "@/lib/supabaseClient";
import { toast } from "sonner";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { Duvida, DuvidaRegistroBanco } from "@/hooks/DuvidaHooks/type";
import { mapDuvida } from "@/lib/db/mappers";
import { duvidaRepository, extrairMensagemErroRepo } from "@/repositories";
import {
  filtrarDuvidasPorPerfilEStatus,
  filtroDuvidasPendentesStrategy,
  filtroDuvidasPorPerfilStrategy,
  type StatusFiltroDuvida,
} from "@/patterns/strategy/FiltroStrategy";

export function normalizarDuvida(d: DuvidaRegistroBanco): Duvida {
  return mapDuvida(d);
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
      const formatadas = await duvidaRepository.listarTodas();
      setDuvidas(formatadas);
    } catch (err: unknown) {
      toast.error("Erro ao carregar dúvidas", {
        description: extrairMensagemErroRepo(err, "Tente novamente mais tarde."),
      });
    } finally {
      setLoading(false);
    }
  }, [perfil?.id]);

  const deletarDuvida = async (duvidaId: string) => {
    if (!hasSupabaseConfig || !supabase) return;

    const duvidaExistente = duvidas.find((d) => d.id === duvidaId);
    if (!duvidaExistente) return;

    try {
      await duvidaRepository.excluir(duvidaExistente);
      setDuvidas((prev) => prev.filter((d) => d.id !== duvidaId));
      toast.success("Dúvida excluída com sucesso!");
    } catch (err: unknown) {
      toast.error("Erro ao excluir dúvida", {
        description: extrairMensagemErroRepo(err, "Tente novamente."),
      });
    }
  };

  const responderDuvida = async (duvidaId: string, respostaText: string) => {
    if (!hasSupabaseConfig || !supabase) return;

    try {
      await duvidaRepository.responder(duvidaId, respostaText);
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
        description: extrairMensagemErroRepo(err, "Tente novamente."),
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
