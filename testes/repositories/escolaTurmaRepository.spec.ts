import { describe, expect, it, vi } from "vitest";
import { EscolaTurmaRepository } from "@/repositories/EscolaTurmaRepository";
import type { ClienteSupabaseTipado } from "@/repositories/base";

describe("EscolaTurmaRepository — Isolamento por Escola e Matrícula RN12 (Nível 3 RBT)", () => {
  it("carregarDadosEscola recusa fallback para outra escola quando usuário não é master e está sem id_escola", async () => {
    const repo = new EscolaTurmaRepository({} as ClienteSupabaseTipado);

    await expect(repo.carregarDadosEscola(null, "aluno")).rejects.toThrow(
      "Usuário sem escola vinculada (RN11).",
    );
    await expect(repo.carregarDadosEscola(null, "professor")).rejects.toThrow(
      "Usuário sem escola vinculada (RN11).",
    );
  });

  it("alternarMatriculaAluno executa upsert ativa na inscrição, delete na saída e traduz erro RN12", async () => {
    const upsertMock = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({
        error: { message: "Aluno e turma pertencem a escolas diferentes (RN12)" },
      });

    const deleteEqTurmaMock = vi.fn().mockResolvedValue({ error: null });
    const deleteEqAlunoMock = vi.fn().mockReturnValue({ eq: deleteEqTurmaMock });

    const client = {
      from: vi.fn().mockReturnValue({
        upsert: upsertMock,
        delete: vi.fn().mockReturnValue({ eq: deleteEqAlunoMock }),
      }),
    } as unknown as ClienteSupabaseTipado;

    const repo = new EscolaTurmaRepository(client);

    await repo.alternarMatriculaAluno("aluno-1", "1", false);
    expect(upsertMock).toHaveBeenCalledWith(
      { id_aluno: "aluno-1", id_turma: 1, situacao: "ativa" },
      { onConflict: "id_aluno,id_turma" },
    );

    await repo.alternarMatriculaAluno("aluno-1", "1", true);
    expect(deleteEqAlunoMock).toHaveBeenCalledWith("id_aluno", "aluno-1");
    expect(deleteEqTurmaMock).toHaveBeenCalledWith("id_turma", 1);

    await expect(
      repo.alternarMatriculaAluno("aluno-1", "4", false),
    ).rejects.toThrow(
      "Você só pode se matricular em turmas da sua escola (RN12).",
    );
  });

  it.each([
    ["master", null, ["1", "4"]],
    ["master", "1", ["1"]],
    ["aluno", "1", ["1"]],
    ["professor", "1", ["1"]],
  ] as const)("carrega o catálogo de %s com escola %s", async (papel, escola, esperado) => {
    const consultaEscola = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id_escola: 1, nome: "Escola de teste", ano_letivo: 2026 },
        error: null,
      }),
    };
    const turmas = [
      { id_turma: 1, id_escola: 1, codigo_acesso: "DCC000", materia: "Banco de Dados" },
      { id_turma: 4, id_escola: 3, codigo_acesso: "MAT101", materia: "Cálculo Numérico" },
    ];
    const consultaTurmas = Object.assign(Promise.resolve({ data: turmas, error: null }), {
      eq: vi.fn().mockResolvedValue({ data: [turmas[0]], error: null }),
    });
    const consultaVinculos = {
      in: vi.fn().mockReturnValue(Object.assign(Promise.resolve({ data: [] }), {
        eq: vi.fn().mockResolvedValue({ data: [] }),
      })),
    };
    const client = {
      from: vi.fn((tabela) => ({
        select: vi.fn().mockReturnValue(
          tabela === "escola" ? consultaEscola : tabela === "turma" ? consultaTurmas : consultaVinculos,
        ),
      })),
    } as unknown as ClienteSupabaseTipado;

    const catalogo = await new EscolaTurmaRepository(client).carregarDadosEscola(escola, papel);

    expect(Object.keys(catalogo.turmas)).toEqual(esperado);
    if (escola) {
      expect(consultaTurmas.eq).toHaveBeenCalledWith("id_escola", 1);
    } else {
      expect(consultaTurmas.eq).not.toHaveBeenCalled();
      expect(catalogo.turmas["4"].id_escola).toBe("3");
    }
  });
});
