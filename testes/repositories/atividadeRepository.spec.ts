import { describe, expect, it, vi } from "vitest";
import { AtividadeRepository } from "@/repositories/AtividadeRepository";
import type { AnexoStorageFacade } from "@/patterns/facade/AnexoStorageFacade";
import type { ClienteSupabaseTipado } from "@/repositories/base";

describe("AtividadeRepository — Orquestração de Anexos 1FN e Exclusão Segura (Nível 3 RBT)", () => {
  it("criar insere atividade e delega anexos à AnexoStorageFacade", async () => {
    const singleMock = vi.fn().mockResolvedValue({
      data: {
        id_atividade: 15,
        id_turma: 1,
        id_professor: "prof-1",
        titulo: "E3 - Álgebra",
        descricao: "Consultas",
        data_entrega: "2026-11-25T23:59:00.000Z",
        perfil: { nome: "Pietro" },
      },
      error: null,
    });
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single: singleMock }),
    });

    const client = {
      from: vi.fn().mockReturnValue({ insert: insertMock }),
    } as unknown as ClienteSupabaseTipado;

    const anexoFacadeFake = {
      anexar: vi.fn().mockResolvedValue([
        {
          idObjeto: "obj-1",
          caminho: "atividades/15/1700-enunciado.pdf",
          nome: "enunciado.pdf",
        },
      ]),
    } as unknown as AnexoStorageFacade;

    const repo = new AtividadeRepository(client, anexoFacadeFake);
    const arquivo = new File(["pdf"], "enunciado.pdf");

    const criada = await repo.criar(
      {
        idTurma: "1",
        idProfessor: "prof-1",
        titulo: "  E3 - Álgebra  ",
        descricao: "  Consultas  ",
        dataEntrega: "2026-11-25T23:59:00.000Z",
      },
      [arquivo],
    );

    expect(anexoFacadeFake.anexar).toHaveBeenCalledWith(
      15,
      [arquivo],
      "atividades/15",
    );
    expect(criada.id).toBe("15");
    expect(criada.professor_nome).toBe("Pietro");
    expect(criada.anexos).toHaveLength(1);
  });

  it("excluir remove arquivos de entrega -> anexos da atividade -> linha em atividade", async () => {
    const ordem: string[] = [];

    const storageRemoveMock = vi.fn().mockImplementation(async (caminhos: string[]) => {
      ordem.push(`storage-entregas:${caminhos.join(",")}`);
      return { error: null };
    });

    const deleteEqMock = vi.fn().mockImplementation(async () => {
      ordem.push("delete-atividade");
      return { error: null };
    });

    const fromMock = vi.fn((tabela: string) => {
      if (tabela === "entrega_atividade") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ id_objeto_storage: "obj-entrega-1" }],
              error: null,
            }),
          }),
        };
      }
      if (tabela === "v_storage_objetos") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: "obj-entrega-1", name: "15/a-1/entrega.pdf" }],
              error: null,
            }),
          }),
        };
      }
      return {
        delete: vi.fn().mockReturnValue({ eq: deleteEqMock }),
      };
    });

    const client = {
      from: fromMock,
      storage: { from: vi.fn().mockReturnValue({ remove: storageRemoveMock }) },
    } as unknown as ClienteSupabaseTipado;

    const anexoFacadeFake = {
      remover: vi.fn().mockImplementation(async () => {
        ordem.push("storage-anexos");
      }),
    } as unknown as AnexoStorageFacade;

    const repo = new AtividadeRepository(client, anexoFacadeFake);
    await repo.excluir({
      id: "15",
      anexos: [
        { idObjeto: "obj-atv-1", caminho: "atividades/15/guia.pdf", nome: "guia.pdf" },
      ],
    });

    expect(ordem).toEqual([
      "storage-entregas:15/a-1/entrega.pdf",
      "storage-anexos",
      "delete-atividade",
    ]);
  });
});
