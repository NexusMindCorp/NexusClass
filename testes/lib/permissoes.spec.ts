import { describe, expect, it } from "vitest";
import { pode, type PerfilPermissao, type TurmaPermissao } from "@/lib/permissoes";

describe("Protection Proxy de Permissões — Matriz Papel × Ação alinhada à RLS (Nível 2 RBT)", () => {
  const master: PerfilPermissao = { id: "m-1", role: "master", id_escola: null };
  const profTurma: PerfilPermissao = { id: "p-1", role: "professor", id_escola: "1" };
  const outroProf: PerfilPermissao = { id: "p-2", role: "professor", id_escola: "1" };
  const alunoEscola1: PerfilPermissao = { id: "a-1", role: "aluno", id_escola: "1" };
  const alunoEscola3: PerfilPermissao = { id: "a-2", role: "aluno", id_escola: "3" };

  const turmaEscola1: TurmaPermissao = { professor_id: "p-1", id_escola: "1" };

  it("apenas master cria turma", () => {
    expect(pode.criarTurma(master)).toBe(true);
    expect(pode.criarTurma(profTurma)).toBe(false);
    expect(pode.criarTurma(alunoEscola1)).toBe(false);
    expect(pode.criarTurma(null)).toBe(false);
  });

  it("matrícula e desinscrição são exclusivas de aluno da mesma escola (RN12)", () => {
    expect(pode.inscreverEmTurma(alunoEscola1, turmaEscola1)).toBe(true);
    expect(pode.inscreverEmTurma(alunoEscola1, {})).toBe(true);
    expect(pode.inscreverEmTurma(alunoEscola3, turmaEscola1)).toBe(false);
    expect(pode.inscreverEmTurma(profTurma, turmaEscola1)).toBe(false);
    expect(pode.inscreverEmTurma(master, turmaEscola1)).toBe(false);
    expect(pode.inscreverEmTurma(null, turmaEscola1)).toBe(false);

    expect(pode.sairDaTurma(alunoEscola1)).toBe(true);
    expect(pode.sairDaTurma(profTurma)).toBe(false);
    expect(pode.sairDaTurma(master)).toBe(false);
  });

  it("publicar atividade e avaliar entrega exigem professor da turma ou master", () => {
    expect(pode.publicarAtividade(master, turmaEscola1)).toBe(true);
    expect(pode.publicarAtividade(profTurma, turmaEscola1)).toBe(true);
    expect(pode.publicarAtividade(profTurma, {})).toBe(true);
    expect(pode.publicarAtividade(outroProf, turmaEscola1)).toBe(false);
    expect(pode.publicarAtividade(alunoEscola1, turmaEscola1)).toBe(false);
    expect(pode.publicarAtividade(null, turmaEscola1)).toBe(false);

    expect(pode.avaliarEntrega(master, turmaEscola1)).toBe(true);
    expect(pode.avaliarEntrega(profTurma, turmaEscola1)).toBe(true);
    expect(pode.avaliarEntrega(outroProf, turmaEscola1)).toBe(false);
    expect(pode.avaliarEntrega(alunoEscola1, turmaEscola1)).toBe(false);
  });

  it("excluirPost permite autor, professor da turma ou master", () => {
    const postDoAluno = { autor: { id: "a-1" } as never };
    expect(pode.excluirPost(master, postDoAluno, turmaEscola1)).toBe(true);
    expect(pode.excluirPost(alunoEscola1, postDoAluno, turmaEscola1)).toBe(true);
    expect(pode.excluirPost(alunoEscola3, postDoAluno, turmaEscola1)).toBe(false);
    expect(pode.excluirPost(profTurma, postDoAluno, turmaEscola1)).toBe(true);
    expect(pode.excluirPost(outroProf, postDoAluno, turmaEscola1)).toBe(false);
  });

  it("responderDuvida e excluirDuvida respeitam autoria, docente destinatário e master", () => {
    const duvida = { aluno_id: "a-1", prof_id: "p-1" };
    expect(pode.responderDuvida(master, duvida)).toBe(true);
    expect(pode.responderDuvida(profTurma, duvida)).toBe(true);
    expect(pode.responderDuvida(outroProf, duvida)).toBe(false);
    expect(pode.responderDuvida(alunoEscola1, duvida)).toBe(false);

    expect(pode.excluirDuvida(master, duvida)).toBe(true);
    expect(pode.excluirDuvida(alunoEscola1, duvida)).toBe(true);
    expect(pode.excluirDuvida(profTurma, duvida)).toBe(true);
    expect(pode.excluirDuvida(alunoEscola3, duvida)).toBe(false);
    expect(pode.excluirDuvida(outroProf, duvida)).toBe(false);
  });

  it("criarEventoTurma permite apenas professor ou master", () => {
    expect(pode.criarEventoTurma(master)).toBe(true);
    expect(pode.criarEventoTurma(profTurma)).toBe(true);
    expect(pode.criarEventoTurma(alunoEscola1)).toBe(false);
  });
});
