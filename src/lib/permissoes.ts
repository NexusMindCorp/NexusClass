import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { Duvida } from "@/hooks/DuvidaHooks/type";
import type { TurmaProps } from "@/hooks/LeituraDataHooks/type";
import type { Post } from "@/hooks/MuralHooks/type";

export type PerfilPermissao = Pick<PerfilUsuario, "id" | "role" | "id_escola"> | null | undefined;
export type TurmaPermissao = Pick<TurmaProps, "professor_id" | "id_escola"> | null | undefined;

function ehProfessorDaTurma(
  perfil: PerfilPermissao,
  turma?: TurmaPermissao,
): boolean {
  if (!perfil || perfil.role !== "professor") return false;
  if (!turma?.professor_id) return true;
  return turma.professor_id === perfil.id;
}

/**
 * Regras puras de autorização (Protection Proxy) espelhadas diretamente nas
 * políticas RLS de `docker/constructionsSQL/04_supabase_auth_rls.sql`.
 */
export const pode = {
  criarTurma: (perfil: PerfilPermissao): boolean => perfil?.role === "master",

  inscreverEmTurma: (
    perfil: PerfilPermissao,
    turma?: TurmaPermissao,
  ): boolean => {
    if (!perfil || perfil.role !== "aluno") return false;
    if (turma?.id_escola && perfil.id_escola) {
      return turma.id_escola === perfil.id_escola;
    }
    return true;
  },

  sairDaTurma: (perfil: PerfilPermissao): boolean => perfil?.role === "aluno",

  publicarAtividade: (
    perfil: PerfilPermissao,
    turma?: TurmaPermissao,
  ): boolean => {
    if (!perfil) return false;
    if (perfil.role === "master") return true;
    return ehProfessorDaTurma(perfil, turma);
  },

  excluirPost: (
    perfil: PerfilPermissao,
    post: Pick<Post, "autor">,
    turma?: TurmaPermissao,
  ): boolean => {
    if (!perfil) return false;
    if (perfil.role === "master") return true;
    if (post.autor?.id === perfil.id) return true;
    return ehProfessorDaTurma(perfil, turma);
  },

  avaliarEntrega: (
    perfil: PerfilPermissao,
    turma?: TurmaPermissao,
  ): boolean => {
    if (!perfil) return false;
    if (perfil.role === "master") return true;
    return ehProfessorDaTurma(perfil, turma);
  },

  responderDuvida: (
    perfil: PerfilPermissao,
    duvida: Pick<Duvida, "prof_id">,
  ): boolean => {
    if (!perfil) return false;
    if (perfil.role === "master") return true;
    return perfil.role === "professor" && duvida.prof_id === perfil.id;
  },

  excluirDuvida: (
    perfil: PerfilPermissao,
    duvida: Pick<Duvida, "aluno_id" | "prof_id">,
  ): boolean => {
    if (!perfil) return false;
    if (perfil.role === "master") return true;
    if (duvida.aluno_id === perfil.id) return true;
    return perfil.role === "professor" && duvida.prof_id === perfil.id;
  },

  criarEventoTurma: (perfil: PerfilPermissao): boolean =>
    perfil?.role === "master" || perfil?.role === "professor",
};
