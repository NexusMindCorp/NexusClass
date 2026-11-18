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
});
