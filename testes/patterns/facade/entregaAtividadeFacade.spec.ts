import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import {
  BUCKET_ENTREGAS,
  EntregaAtividadeFacade,
  TABELA_ENTREGAS,
  TEMPO_EXPIRACAO_URL_SEGUNDOS,
  entregaAtividadeFacade,
  type IEntregaAtividadeFacade,
  type IEntregaSupabaseClient,
} from "@/patterns/facade/EntregaAtividadeFacade";
import { useEntregas } from "@/hooks/EntregasHooks/useEntregas";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { Entrega, EntregaRowComPerfil } from "@/hooks/EntregasHooks/type";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("EntregaAtividadeFacade & useEntregas (Padrão Facade — Níveis 2 e 3 RBT)", () => {
  const perfilAluno: PerfilUsuario = {
    id: "aluno-123",
    nome: "Lucas Mendes",
    email: "lucas@nexus.edu",
    foto_url: null,
    bio: null,
    created_at: "2026-10-01T00:00:00Z",
    role: "aluno",
  };

  const perfilProfessor: PerfilUsuario = {
    id: "prof-456",
    nome: "Prof. Ricardo",
    email: "ricardo@nexus.edu",
    foto_url: null,
    bio: null,
    created_at: "2026-10-01T00:00:00Z",
    role: "professor",
  };

  const entregaBase: Entrega = {
    id: "ent-1",
    atividade_id: "ativ-99",
    aluno_id: "aluno-123",
    url_anexo: "ativ-99/aluno-123/1700000000000-trabalho_final.pdf",
    nota: null,
    feedback: null,
    no_prazo: true,
    entregue_em: "2026-11-05T12:00:00.000Z",
    created_at: "2026-11-05T12:00:00.000Z",
    updated_at: "2026-11-05T12:00:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Métodos Estáticos Puros (Nível 2 RBT)", () => {
    it("deve higienizar nomes de arquivos substituindo caracteres especiais e espaços por underscore", () => {
      expect(
        EntregaAtividadeFacade.higienizarNomeArquivo(
          "Trabalho Final (Versão 2) - João & Maria!.pdf",
        ),
      ).toBe("Trabalho_Final__Vers_o_2__-_Jo_o___Maria_.pdf");
      expect(
        EntregaAtividadeFacade.higienizarNomeArquivo("relatorio-v1.2_final.docx"),
      ).toBe("relatorio-v1.2_final.docx");
    });

    it("deve construir o caminho completo no formato {atividadeId}/{alunoId}/{timestamp}-{nomeLimpo}", () => {
      const caminho = EntregaAtividadeFacade.construirCaminhoArquivo(
        "ativ-99",
        "aluno-123",
        "Meu Resumo #1.pdf",
        1730800000000,
      );

      expect(caminho).toBe("ativ-99/aluno-123/1730800000000-Meu_Resumo__1.pdf");
    });

    it("deve normalizar lista de entregas com perfis (objeto, array e fallback Aluno Anônimo)", () => {
      expect(EntregaAtividadeFacade.normalizarEntregasComPerfis(null)).toEqual(
        [],
      );

      const registros: EntregaRowComPerfil[] = [
        {
          ...entregaBase,
          id: "ent-1",
          perfis: { nome: "Ana Clara" },
        },
        {
          ...entregaBase,
          id: "ent-2",
          perfis: [{ nome: "Bruno Costa" }],
        },
        {
          ...entregaBase,
          id: "ent-3",
          perfis: null,
        },
      ];

      const normalizadas =
        EntregaAtividadeFacade.normalizarEntregasComPerfis(registros);

      expect(normalizadas).toHaveLength(3);
      expect(normalizadas[0].aluno_nome).toBe("Ana Clara");
      expect(normalizadas[1].aluno_nome).toBe("Bruno Costa");
      expect(normalizadas[2].aluno_nome).toBe("Aluno Anônimo");
    });
  });

  describe("Orquestração Storage + PostgreSQL na EntregaAtividadeFacade (Nível 3 RBT)", () => {
    const criarMockSupabaseClient = () => {
      const uploadMock = vi.fn();
      const createSignedUrlMock = vi.fn();
      const maybeSingleMock = vi.fn();
      const orderMock = vi.fn();
      const upsertMock = vi.fn();
      const updateEqAlunoMock = vi.fn();
      const updateEqAtividadeMock = vi.fn().mockReturnValue({
        eq: updateEqAlunoMock,
      });
      const updateMock = vi.fn().mockReturnValue({
        eq: updateEqAtividadeMock,
      });

      const selectEqAlunoMock = vi.fn().mockReturnValue({
        maybeSingle: maybeSingleMock,
      });
      const selectEqAtividadeMock = vi.fn().mockReturnValue({
        eq: selectEqAlunoMock,
        order: orderMock,
      });
      const selectMock = vi.fn().mockReturnValue({
        eq: selectEqAtividadeMock,
      });

      const storageFromMock = vi.fn().mockReturnValue({
        upload: uploadMock,
        createSignedUrl: createSignedUrlMock,
      });

      const fromMock = vi.fn().mockReturnValue({
        select: selectMock,
        upsert: upsertMock,
        update: updateMock,
      });

      const client: IEntregaSupabaseClient = {
        storage: { from: storageFromMock },
        from: fromMock,
      };

      return {
        client,
        storageFromMock,
        fromMock,
        uploadMock,
        createSignedUrlMock,
        selectMock,
        selectEqAtividadeMock,
        selectEqAlunoMock,
        maybeSingleMock,
        orderMock,
        upsertMock,
        updateMock,
        updateEqAtividadeMock,
        updateEqAlunoMock,
      };
    };

    it("deve reportar disponibilidade corretamente conforme presença do cliente Supabase", () => {
      const { client } = criarMockSupabaseClient();
      const facadeAtiva = new EntregaAtividadeFacade(client);
      const facadeInativa = new EntregaAtividadeFacade(null);

      expect(entregaAtividadeFacade.estaDisponivel()).toBe(true);
      expect(facadeAtiva.estaDisponivel()).toBe(true);
      expect(facadeInativa.estaDisponivel()).toBe(false);
    });

    it("deve lançar erro ou retornar null quando o cliente Supabase for nulo", async () => {
      const facadeInativa = new EntregaAtividadeFacade(null);
      const arquivo = new File(["conteudo"], "teste.pdf", {
        type: "application/pdf",
      });

      await expect(
        facadeInativa.carregarEntregas("ativ-99", perfilAluno),
      ).rejects.toThrow("Cliente Supabase não configurado para entregas.");

      await expect(
        facadeInativa.submeter({
          atividadeId: "ativ-99",
          alunoId: "aluno-123",
          arquivo,
        }),
      ).rejects.toThrow("Cliente Supabase não configurado para entregas.");

      await expect(
        facadeInativa.avaliar({
          atividadeId: "ativ-99",
          alunoId: "aluno-123",
          nota: 9.5,
          feedback: "Ótimo",
        }),
      ).rejects.toThrow("Cliente Supabase não configurado para entregas.");

      await expect(
        facadeInativa.obterUrlDownload("caminho/qualquer.pdf"),
      ).resolves.toBeNull();
    });

    it("deve realizar upload no Storage e upsert na tabela entregas_atividades ao submeter", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-11-05T15:30:00.000Z"));

      const {
        client,
        storageFromMock,
        fromMock,
        uploadMock,
        upsertMock,
      } = criarMockSupabaseClient();

      const caminhoEsperado = `ativ-99/aluno-123/${Date.now()}-Prova_1.pdf`;
      uploadMock.mockResolvedValue({
        data: { path: caminhoEsperado },
        error: null,
      });
      upsertMock.mockResolvedValue({ error: null });

      const facade = new EntregaAtividadeFacade(client);
      const arquivo = new File(["dados"], "Prova 1.pdf", {
        type: "application/pdf",
      });

      const resultado = await facade.submeter({
        atividadeId: "ativ-99",
        alunoId: "aluno-123",
        arquivo,
      });

      expect(storageFromMock).toHaveBeenCalledWith(BUCKET_ENTREGAS);
      expect(uploadMock).toHaveBeenCalledWith(caminhoEsperado, arquivo, {
        upsert: true,
      });
      expect(fromMock).toHaveBeenCalledWith(TABELA_ENTREGAS);
      expect(upsertMock).toHaveBeenCalledWith(
        {
          atividade_id: "ativ-99",
          aluno_id: "aluno-123",
          url_anexo: caminhoEsperado,
          entregue_em: "2026-11-05T15:30:00.000Z",
        },
        { onConflict: "atividade_id,aluno_id" },
      );
      expect(resultado).toEqual({
        caminhoArquivo: caminhoEsperado,
        entregueEm: "2026-11-05T15:30:00.000Z",
      });
    });

    it("deve interromper a submissão e não chamar upsert no banco se o upload no Storage falhar", async () => {
      const { client, uploadMock, upsertMock } = criarMockSupabaseClient();
      uploadMock.mockResolvedValueOnce({
        data: null,
        error: { message: "Bucket quota exceeded" },
      });
      uploadMock.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const facade = new EntregaAtividadeFacade(client);
      const arquivo = new File(["dados"], "arquivo.pdf");

      await expect(
        facade.submeter({
          atividadeId: "ativ-99",
          alunoId: "aluno-123",
          arquivo,
        }),
      ).rejects.toEqual({ message: "Bucket quota exceeded" });

      await expect(
        facade.submeter({
          atividadeId: "ativ-99",
          alunoId: "aluno-123",
          arquivo,
        }),
      ).rejects.toThrow("Falha ao enviar arquivo para o Storage.");

      expect(upsertMock).not.toHaveBeenCalled();
    });

    it("deve propagar erro caso o upsert no PostgreSQL falhe após o upload", async () => {
      const { client, uploadMock, upsertMock } = criarMockSupabaseClient();
      uploadMock.mockResolvedValue({
        data: { path: "ativ-99/aluno-123/123-arq.pdf" },
        error: null,
      });
      upsertMock.mockResolvedValue({
        error: { message: "Violação de política RLS" },
      });

      const facade = new EntregaAtividadeFacade(client);
      const arquivo = new File(["dados"], "arq.pdf");

      await expect(
        facade.submeter({
          atividadeId: "ativ-99",
          alunoId: "aluno-123",
          arquivo,
        }),
      ).rejects.toEqual({ message: "Violação de política RLS" });
    });

    it("deve carregar entrega própria para aluno e propagar erro se consulta falhar", async () => {
      const {
        client,
        selectEqAtividadeMock,
        selectEqAlunoMock,
        maybeSingleMock,
      } = criarMockSupabaseClient();

      maybeSingleMock
        .mockResolvedValueOnce({ data: entregaBase, error: null })
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Erro ao consultar entrega do aluno" },
        });

      const facade = new EntregaAtividadeFacade(client);
      const resultado = await facade.carregarEntregas("ativ-99", perfilAluno);

      expect(selectEqAtividadeMock).toHaveBeenCalledWith(
        "atividade_id",
        "ativ-99",
      );
      expect(selectEqAlunoMock).toHaveBeenCalledWith("aluno_id", "aluno-123");
      expect(resultado).toEqual({
        entregaPropria: entregaBase,
        todasEntregas: [],
      });

      await expect(
        facade.carregarEntregas("ativ-99", perfilAluno),
      ).rejects.toEqual({ message: "Erro ao consultar entrega do aluno" });
    });

    it("deve carregar todas as entregas ordenadas para professor e propagar erro se consulta falhar", async () => {
      const { client, orderMock } = criarMockSupabaseClient();

      orderMock
        .mockResolvedValueOnce({
          data: [
            {
              ...entregaBase,
              perfis: { nome: "Lucas Mendes" },
            },
          ],
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Erro ao listar entregas da turma" },
        });

      const facade = new EntregaAtividadeFacade(client);
      const resultado = await facade.carregarEntregas(
        "ativ-99",
        perfilProfessor,
      );

      expect(orderMock).toHaveBeenCalledWith("entregue_em", {
        ascending: false,
      });
      expect(resultado.entregaPropria).toBeNull();
      expect(resultado.todasEntregas).toHaveLength(1);
      expect(resultado.todasEntregas[0].aluno_nome).toBe("Lucas Mendes");

      await expect(
        facade.carregarEntregas("ativ-99", perfilProfessor),
      ).rejects.toEqual({ message: "Erro ao listar entregas da turma" });
    });

    it("deve atualizar nota e feedback ao avaliar entrega e propagar erro em caso de falha", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-11-05T18:00:00.000Z"));

      const {
        client,
        updateMock,
        updateEqAtividadeMock,
        updateEqAlunoMock,
      } = criarMockSupabaseClient();

      updateEqAlunoMock
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({
          error: { message: "Falha ao atualizar nota" },
        });

      const facade = new EntregaAtividadeFacade(client);

      await facade.avaliar({
        atividadeId: "ativ-99",
        alunoId: "aluno-123",
        nota: 9.8,
        feedback: "Excelente implementação do padrão Facade!",
      });

      expect(updateMock).toHaveBeenCalledWith({
        nota: 9.8,
        feedback: "Excelente implementação do padrão Facade!",
        updated_at: "2026-11-05T18:00:00.000Z",
      });
      expect(updateEqAtividadeMock).toHaveBeenCalledWith(
        "atividade_id",
        "ativ-99",
      );
      expect(updateEqAlunoMock).toHaveBeenCalledWith("aluno_id", "aluno-123");

      await expect(
        facade.avaliar({
          atividadeId: "ativ-99",
          alunoId: "aluno-123",
          nota: 5,
          feedback: "Erro",
        }),
      ).rejects.toEqual({ message: "Falha ao atualizar nota" });
    });

    it("deve gerar URL assinada de download com expiração padrão e tratar erros", async () => {
      const { client, createSignedUrlMock } = criarMockSupabaseClient();
      createSignedUrlMock
        .mockResolvedValueOnce({
          data: { signedUrl: "https://supabase.nexus/signed/123" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Object not found" },
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const facade = new EntregaAtividadeFacade(client);
      const url = await facade.obterUrlDownload("ativ-99/aluno-123/arq.pdf");

      expect(createSignedUrlMock).toHaveBeenCalledWith(
        "ativ-99/aluno-123/arq.pdf",
        TEMPO_EXPIRACAO_URL_SEGUNDOS,
      );
      expect(url).toBe("https://supabase.nexus/signed/123");

      await expect(
        facade.obterUrlDownload("inexistente.pdf"),
      ).rejects.toEqual({ message: "Object not found" });

      await expect(
        facade.obterUrlDownload("vazio.pdf"),
      ).rejects.toThrow("Não foi possível gerar o link do arquivo.");
    });
  });

  describe("Integração com o hook useEntregas via FakeEntregaFacade (Sem Rede)", () => {
    const criarFakeFacade = (
      overrides: Partial<IEntregaAtividadeFacade> = {},
    ): IEntregaAtividadeFacade => ({
      estaDisponivel: vi.fn().mockReturnValue(true),
      carregarEntregas: vi.fn().mockResolvedValue({
        entregaPropria: entregaBase,
        todasEntregas: [{ ...entregaBase, aluno_nome: "Lucas Mendes" }],
      }),
      submeter: vi.fn().mockResolvedValue({
        caminhoArquivo: entregaBase.url_anexo!,
        entregueEm: entregaBase.entregue_em,
      }),
      avaliar: vi.fn().mockResolvedValue(undefined),
      obterUrlDownload: vi
        .fn()
        .mockResolvedValue("https://supabase.nexus/download.pdf"),
      ...overrides,
    });

    it("deve carregar entrega própria para aluno e permitir enviar arquivo com toast de sucesso", async () => {
      const fakeFacade = criarFakeFacade();

      const { result } = renderHook(() =>
        useEntregas("ativ-99", perfilAluno, fakeFacade),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.entregaPropria).toEqual(entregaBase);

      const arquivo = new File(["conteudo"], "entrega.pdf");
      await act(async () => {
        await result.current.enviarEntrega(arquivo);
      });

      expect(fakeFacade.submeter).toHaveBeenCalledWith({
        atividadeId: "ativ-99",
        alunoId: "aluno-123",
        arquivo,
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Atividade entregue com sucesso!",
      );
      expect(result.current.uploading).toBe(false);
    });

    it("deve carregar todas as entregas para professor, avaliar aluno e obter link de arquivo", async () => {
      const fakeFacade = criarFakeFacade();

      const { result } = renderHook(() =>
        useEntregas("ativ-99", perfilProfessor, fakeFacade),
      );

      await waitFor(() => {
        expect(result.current.todasEntregas).toHaveLength(1);
      });

      await act(async () => {
        await result.current.avaliarEntrega("aluno-123", 10, "Perfeito!");
      });

      expect(fakeFacade.avaliar).toHaveBeenCalledWith({
        atividadeId: "ativ-99",
        alunoId: "aluno-123",
        nota: 10,
        feedback: "Perfeito!",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Avaliação salva com sucesso!",
      );

      let url: string | null = null;
      await act(async () => {
        url = await result.current.obterLinkArquivo("caminho/arq.pdf");
      });
      expect(url).toBe("https://supabase.nexus/download.pdf");
    });

    it("deve tratar erros de submissão, avaliação e link de download exibindo toast.error sem quebrar o hook", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const fakeFacade = criarFakeFacade({
        carregarEntregas: vi
          .fn()
          .mockRejectedValueOnce(new Error("Falha ao buscar")),
        submeter: vi
          .fn()
          .mockRejectedValueOnce(new Error("Arquivo excede limite"))
          .mockRejectedValueOnce({}),
        avaliar: vi
          .fn()
          .mockRejectedValueOnce(new Error("Permissão negada")),
        obterUrlDownload: vi
          .fn()
          .mockRejectedValueOnce(new Error("Link expirado")),
      });

      const { result } = renderHook(() =>
        useEntregas("ativ-99", perfilAluno, fakeFacade),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const arquivo = new File(["x"], "x.pdf");
      await act(async () => {
        await result.current.enviarEntrega(arquivo);
      });
      expect(toast.error).toHaveBeenCalledWith("Erro ao entregar atividade", {
        description: "Arquivo excede limite",
      });

      await act(async () => {
        await result.current.enviarEntrega(arquivo);
      });
      expect(toast.error).toHaveBeenCalledWith("Erro ao entregar atividade", {
        description: "Por favor, tente novamente.",
      });

      await act(async () => {
        await result.current.avaliarEntrega("aluno-123", 8, "Bom");
      });
      expect(toast.error).toHaveBeenCalledWith("Erro ao salvar avaliação", {
        description: "Permissão negada",
      });

      const linkErro = await result.current.obterLinkArquivo("arq.pdf");
      expect(linkErro).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });
});
