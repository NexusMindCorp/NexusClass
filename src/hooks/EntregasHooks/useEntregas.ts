import { useState, useEffect, useCallback, useMemo } from "react";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import { toast } from "sonner";
import type { Entrega } from "./type";
import {
  EntregaAtividadeFacade,
  type IEntregaAtividadeFacade,
} from "@/patterns/facade/EntregaAtividadeFacade";

export function useEntregas(
  atividadeId: string,
  perfil: PerfilUsuario,
  facadeInjetada?: IEntregaAtividadeFacade,
) {
  const [entregaPropria, setEntregaPropria] = useState<Entrega | null>(null);
  const [todasEntregas, setTodasEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const facade = useMemo<IEntregaAtividadeFacade>(
    () => facadeInjetada ?? new EntregaAtividadeFacade(),
    [facadeInjetada],
  );

  const carregarDados = useCallback(async () => {
    if (!facade.estaDisponivel() || !atividadeId) return;

    setLoading(true);
    try {
      const resultado = await facade.carregarEntregas(atividadeId, perfil);
      if (perfil.role === "aluno") {
        setEntregaPropria(resultado.entregaPropria);
      } else {
        setTodasEntregas(resultado.todasEntregas);
      }
    } catch (err: unknown) {
      console.error("Erro ao carregar entregas:", err);
    } finally {
      setLoading(false);
    }
  }, [atividadeId, facade, perfil]);

  const enviarEntrega = async (file: File) => {
    if (!facade.estaDisponivel()) return;

    setUploading(true);
    try {
      await facade.submeter({
        atividadeId,
        alunoId: perfil.id,
        arquivo: file,
      });

      toast.success("Atividade entregue com sucesso!");
      await carregarDados();
    } catch (err: unknown) {
      console.error("Erro ao enviar entrega:", err);
      const mensagem =
        err && typeof err === "object" && "message" in err && typeof err.message === "string"
          ? err.message
          : "";
      toast.error("Erro ao entregar atividade", {
        description: mensagem || "Por favor, tente novamente.",
      });
    } finally {
      setUploading(false);
    }
  };

  const avaliarEntrega = async (
    alunoId: string,
    nota: number,
    feedback: string,
  ) => {
    if (!facade.estaDisponivel()) return;

    try {
      await facade.avaliar({
        atividadeId,
        alunoId,
        nota,
        feedback,
      });

      toast.success("Avaliação salva com sucesso!");
      await carregarDados();
    } catch (err: unknown) {
      console.error("Erro ao avaliar entrega:", err);
      const mensagem =
        err && typeof err === "object" && "message" in err && typeof err.message === "string"
          ? err.message
          : undefined;
      toast.error("Erro ao salvar avaliação", {
        description: mensagem,
      });
    }
  };

  const obterLinkArquivo = async (caminho: string): Promise<string | null> => {
    if (!facade.estaDisponivel()) return null;
    try {
      return await facade.obterUrlDownload(caminho);
    } catch (err: unknown) {
      console.error("Erro ao gerar link do arquivo:", err);
      return null;
    }
  };

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  return {
    entregaPropria,
    todasEntregas,
    loading,
    uploading,
    enviarEntrega,
    avaliarEntrega,
    obterLinkArquivo,
    recarregar: carregarDados,
  };
}
