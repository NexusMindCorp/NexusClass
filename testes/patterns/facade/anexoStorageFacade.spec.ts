import { describe, expect, it, vi } from "vitest";
import {
  AnexoStorageFacade,
  CONFIG_ANEXO_ATIVIDADE,
  type IAnexoSupabaseClient,
} from "@/patterns/facade/AnexoStorageFacade";

describe("AnexoStorageFacade — Anexos 1FN e Buckets Privados (Nível 3 RBT)", () => {
  const criarClienteAnexoFake = () => {
    const uploadMock = vi.fn();
    const removeMock = vi.fn().mockResolvedValue({ error: null });
    const createSignedUrlsMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const inMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const selectMock = vi.fn().mockReturnValue({ in: inMock });

    const client: IAnexoSupabaseClient = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: uploadMock,
          remove: removeMock,
          createSignedUrls: createSignedUrlsMock,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: selectMock,
        insert: insertMock,
      }),
    };

    return {
      client,
      uploadMock,
      removeMock,
      createSignedUrlsMock,
      insertMock,
      inMock,
    };
  };

  it("anexar envia ao Storage, grava uploadData.id na tabela 1FN e compensa removendo do Storage se INSERT falhar", async () => {
    const { client, uploadMock, insertMock, removeMock } = criarClienteAnexoFake();
    uploadMock.mockResolvedValueOnce({
      data: { id: "obj-uuid-1", path: "atividades/10/1700-guia.pdf" },
      error: null,
    });

    const facade = new AnexoStorageFacade(CONFIG_ANEXO_ATIVIDADE, client);
    const arquivo = new File(["pdf"], "guia.pdf", { type: "application/pdf" });

    const anexos = await facade.anexar(10, [arquivo], "atividades/10");
    expect(insertMock).toHaveBeenCalledWith({
      id_atividade: 10,
      id_objeto_storage: "obj-uuid-1",
    });
    expect(anexos).toEqual([
      {
        idObjeto: "obj-uuid-1",
        caminho: "atividades/10/1700-guia.pdf",
        nome: "guia.pdf",
      },
    ]);
    expect(removeMock).not.toHaveBeenCalled();

    // Falha no INSERT -> deve acionar compensação removendo o objeto recém-enviado
    uploadMock.mockResolvedValueOnce({
      data: { id: "obj-uuid-falha", path: "atividades/10/1700-falha.pdf" },
      error: null,
    });
    insertMock.mockResolvedValueOnce({
      error: { message: "RLS bloqueou inserção" },
    });

    await expect(facade.anexar(10, [arquivo], "atividades/10")).rejects.toEqual({
      message: "RLS bloqueou inserção",
    });
    expect(removeMock).toHaveBeenCalledWith(["atividades/10/1700-falha.pdf"]);
  });

  it("listarPorPais resolve caminhos via v_storage_objetos e gera URLs assinadas (sem getPublicUrl)", async () => {
    const { client, inMock, createSignedUrlsMock } = criarClienteAnexoFake();

    inMock
      .mockResolvedValueOnce({
        data: [{ id_atividade: 10, id_objeto_storage: "obj-1" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ id: "obj-1", name: "atividades/10/1700-roteiro.pdf" }],
        error: null,
      });

    createSignedUrlsMock.mockResolvedValueOnce({
      data: [
        {
          path: "atividades/10/1700-roteiro.pdf",
          signedUrl: "https://signed.nexus/roteiro.pdf",
        },
      ],
      error: null,
    });

    const facade = new AnexoStorageFacade(CONFIG_ANEXO_ATIVIDADE, client);
    const mapa = await facade.listarPorPais([10]);
    const lista = mapa.get(10) ?? [];

    expect(lista).toHaveLength(1);
    expect(lista[0]).toEqual({
      idObjeto: "obj-1",
      caminho: "atividades/10/1700-roteiro.pdf",
      nome: "roteiro.pdf",
      urlAssinada: "https://signed.nexus/roteiro.pdf",
    });
  });

  it("remover aciona apenas a Storage API (ON DELETE CASCADE limpa a tabela filha)", async () => {
    const { client, removeMock } = criarClienteAnexoFake();
    const facade = new AnexoStorageFacade(CONFIG_ANEXO_ATIVIDADE, client);

    await facade.remover([
      { idObjeto: "obj-1", caminho: "atividades/10/a.pdf", nome: "a.pdf" },
      { idObjeto: "obj-2", caminho: "atividades/10/b.pdf", nome: "b.pdf" },
    ]);

    expect(removeMock).toHaveBeenCalledWith([
      "atividades/10/a.pdf",
      "atividades/10/b.pdf",
    ]);
  });

  it("trata cliente nulo, listas vazias e falha de upload", async () => {
    const facadeSemCliente = new AnexoStorageFacade(CONFIG_ANEXO_ATIVIDADE, null);
    const arquivo = new File(["pdf"], "guia.pdf");

    await expect(facadeSemCliente.anexar(10, [], "p")).resolves.toEqual([]);
    await expect(facadeSemCliente.anexar(10, [arquivo], "p")).rejects.toThrow(
      "Cliente Supabase não configurado para anexos.",
    );
    await expect(facadeSemCliente.listarPorPais([])).resolves.toEqual(new Map());
    await expect(facadeSemCliente.remover([])).resolves.toBeUndefined();
    await expect(facadeSemCliente.urlsAssinadas([])).resolves.toEqual({});

    const { client, uploadMock } = criarClienteAnexoFake();
    uploadMock.mockResolvedValueOnce({
      data: null,
      error: { message: "Erro no bucket" },
    });
    const facade = new AnexoStorageFacade(CONFIG_ANEXO_ATIVIDADE, client);
    await expect(facade.anexar(10, [arquivo], "p")).rejects.toEqual({
      message: "Erro no bucket",
    });
  });
});
