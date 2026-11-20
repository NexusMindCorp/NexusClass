import type { Post } from "@/hooks/MuralHooks/type";
import type { TabelaRow } from "@/lib/database.types";
import { mapPostMural, paraInteiroId, umOuPrimeiro } from "@/lib/db/mappers";
import { resolverClienteSupabase, type ClienteSupabaseTipado } from "./base";

type MuralPostRowComAutor = Pick<
  TabelaRow<"mural_post">,
  "id_post" | "conteudo" | "created_at"
> & {
  perfil?: TabelaRow<"perfil"> | TabelaRow<"perfil">[] | null;
};

type MuralPostBotRow = {
  conteudo: string;
  perfil:
    | { nome?: string | null; role?: string | null }
    | Array<{ nome?: string | null; role?: string | null }>
    | null;
};

export interface ResumoPostProfessorBot {
  conteudo: string;
  autorNome: string;
  autorRole: string;
}

export interface IMuralRepository {
  listarPosts(idTurma: string): Promise<Post[]>;
  criarPost(idTurma: string, idAutor: string, conteudo: string): Promise<Post>;
  excluirPost(idPost: string): Promise<void>;
  listarPostsProfessorBot(idsTurmas: string[]): Promise<ResumoPostProfessorBot[]>;
}

export class MuralRepository implements IMuralRepository {
  private readonly client?: ClienteSupabaseTipado | null;

  constructor(client?: ClienteSupabaseTipado | null) {
    this.client = client;
  }

  async listarPosts(idTurma: string): Promise<Post[]> {
    const client = resolverClienteSupabase(this.client);
    const turmaNum = paraInteiroId(idTurma, "idTurma");

    const { data, error } = await client
      .from("mural_post")
      .select(
        `
        id_post,
        conteudo,
        created_at,
        perfil:id_autor (
          id_perfil,
          nome,
          email,
          bio,
          foto_url,
          role,
          created_at,
          id_escola
        )
      `,
      )
      .eq("id_turma", turmaNum)
      .order("created_at", { ascending: false })
      .order("id_post", { ascending: false });

    if (error) throw error;

    return ((data ?? []) as unknown as MuralPostRowComAutor[]).map((item) =>
      mapPostMural(item, item.perfil),
    );
  }

  async criarPost(
    idTurma: string,
    idAutor: string,
    conteudo: string,
  ): Promise<Post> {
    const client = resolverClienteSupabase(this.client);
    const turmaNum = paraInteiroId(idTurma, "idTurma");

    const { data, error } = await client
      .from("mural_post")
      .insert({
        id_turma: turmaNum,
        id_autor: idAutor,
        conteudo: conteudo.trim(),
      })
      .select(
        `
        id_post,
        conteudo,
        created_at,
        perfil:id_autor (
          id_perfil,
          nome,
          email,
          bio,
          foto_url,
          role,
          created_at,
          id_escola
        )
      `,
      )
      .single();

    if (error || !data) throw error ?? new Error("Falha ao criar publicação.");

    const linha = data as unknown as MuralPostRowComAutor;
    return mapPostMural(linha, linha.perfil);
  }

  async excluirPost(idPost: string): Promise<void> {
    const client = resolverClienteSupabase(this.client);
    const postNum = paraInteiroId(idPost, "idPost");

    const { error } = await client
      .from("mural_post")
      .delete()
      .eq("id_post", postNum);

    if (error) throw error;
  }

  async listarPostsProfessorBot(
    idsTurmas: string[],
  ): Promise<ResumoPostProfessorBot[]> {
    if (idsTurmas.length === 0) return [];

    const client = resolverClienteSupabase(this.client);
    const turmasNum = idsTurmas.map((id) => paraInteiroId(id, "idTurma"));

    const { data, error } = await client
      .from("mural_post")
      .select(
        `
        conteudo,
        created_at,
        perfil:id_autor (
          nome,
          role
        )
      `,
      )
      .in("id_turma", turmasNum)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return ((data ?? []) as unknown as MuralPostBotRow[])
      .map((item) => {
        const autor = umOuPrimeiro(item.perfil);
        return {
          conteudo: item.conteudo,
          autorNome: autor?.nome || "Professor",
          autorRole: autor?.role || "",
        };
      })
      .filter(
        (post) => post.autorRole === "professor" || post.autorRole === "master",
      );
  }
}

export const muralRepository = new MuralRepository();
