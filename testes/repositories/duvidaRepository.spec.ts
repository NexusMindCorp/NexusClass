import { describe, expect, it, vi } from "vitest";
import { DuvidaRepository } from "@/repositories/DuvidaRepository";
import type { AnexoStorageFacade } from "@/patterns/facade/AnexoStorageFacade";
import type { ClienteSupabaseTipado } from "@/repositories/base";

describe("DuvidaRepository — Dúvidas e Anexos 1FN (Nível 3 RBT)", () => {
  it("criar localiza professor da turma, grava resolveu=false e anexa arquivos via AnexoStorageFacade", async () => {
    const insertSingleMock = vi.fn().mockResolvedValue({
      data: {
        id_duvida: 21,
        id_aluno: "aluno-1",
        id_professor: "prof-1",
        id_turma: 2,
        assunto: "Normalização",
        descricao: "Dúvida sobre 3FN",
        created_at: "2026-11-17T10:00:00Z",
        resolveu: false,
        resposta: null,
      },
      error: null,
    });

    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single: insertSingleMock }),
    });

    const client = {
      from: vi.fn((tabela: string) => {
        if (tabela === "professor_turma") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id_professor: "prof-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { insert: insertMock };
      }),
    } as unknown as ClienteSupabaseTipado;

    const anexoFacadeFake = {
      anexar: vi.fn().mockResolvedValue([
        { idObjeto: "obj-d1", caminho: "duvidas/21/print.png", nome: "print.png" },
      ]),
    } as unknown as AnexoStorageFacade;

    const repo = new DuvidaRepository(client, anexoFacadeFake);
    const arquivo = new File(["img"], "print.png");
    const duvida = await repo.criar(
      {
        idAluno: "aluno-1",
        idTurma: "2",
        assunto: " Normalização ",
        descricao: " Dúvida sobre 3FN ",
      },
      [arquivo],
    );

    expect(insertMock).toHaveBeenCalledWith({
      id_aluno: "aluno-1",
      id_professor: "prof-1",
      id_turma: 2,
      assunto: "Normalização",
      descricao: "Dúvida sobre 3FN",
      resolveu: false,
    });
    expect(duvida.resolvido).toBe(false);
    expect(duvida.anexos).toHaveLength(1);
  });

  it("responder atualiza resolveu=true e excluir remove anexos no Storage antes de deletar a linha", async () => {
    const ordem: string[] = [];
    const updateEqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });
    const deleteEqMock = vi.fn().mockImplementation(async () => {
      ordem.push("delete-duvida");
      return { error: null };
    });

    const client = {
      from: vi.fn().mockReturnValue({
        update: updateMock,
        delete: vi.fn().mockReturnValue({ eq: deleteEqMock }),
      }),
    } as unknown as ClienteSupabaseTipado;

    const anexoFacadeFake = {
      remover: vi.fn().mockImplementation(async () => {
        ordem.push("storage-remover");
      }),
    } as unknown as AnexoStorageFacade;

    const repo = new DuvidaRepository(client, anexoFacadeFake);
    await repo.responder("21", "Separe em tabela filha.");
    expect(updateMock).toHaveBeenCalledWith({
      resposta: "Separe em tabela filha.",
      resolveu: true,
    });
    expect(updateEqMock).toHaveBeenCalledWith("id_duvida", 21);

    await repo.excluir({
      id: "21",
      anexos: [{ idObjeto: "obj-1", caminho: "duvidas/21/a.png", nome: "a.png" }],
    });
    expect(ordem).toEqual(["storage-remover", "delete-duvida"]);
  });
});
