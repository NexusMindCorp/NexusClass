import type { PerfilUsuario, TurmaProfessor } from "@/hooks/AuthHooks/type";
import type {
  EscolaProps,
  TurmaProps,
  UsuarioResumo,
} from "@/hooks/LeituraDataHooks/type";
import {
  mapTurmaProfessor,
  mapTurmaProps,
  paraInteiroId,
  umOuPrimeiro,
} from "@/lib/db/mappers";
import {
  resolverClienteSupabase,
  traduzirErroMatricula,
  type ClienteSupabaseTipado,
} from "./base";

export type EscolaResumo = {
  id: string;
  nome: string;
  ano_letivo: number;
};

type VinculoPerfilJoin = {
  id_turma: number;
  perfil:
    | { id_perfil: string; nome: string; foto_url: string | null }
    | Array<{ id_perfil: string; nome: string; foto_url: string | null }>
    | null;
};

export interface IEscolaTurmaRepository {
  listarEscolas(): Promise<EscolaResumo[]>;
  carregarDadosEscola(idEscola?: string | null): Promise<EscolaProps>;
  listarTurmasProfessor(
    idProfessor: string,
    nomeProfessor: string,
  ): Promise<TurmaProfessor[]>;
  listarIdsTurmasPorPapel(
    idPerfil: string,
    role: PerfilUsuario["role"],
  ): Promise<string[]>;
  alternarMatriculaAluno(
    idAluno: string,
    idTurma: string,
    jaInscrito: boolean,
  ): Promise<void>;
}

export class EscolaTurmaRepository implements IEscolaTurmaRepository {
  private readonly client?: ClienteSupabaseTipado | null;

  constructor(client?: ClienteSupabaseTipado | null) {
    this.client = client;
  }

  async listarEscolas(): Promise<EscolaResumo[]> {
    const client = resolverClienteSupabase(this.client);
    const { data, error } = await client
      .from("escola")
      .select("id_escola, nome, ano_letivo")
      .order("id_escola", { ascending: true });

    if (error) throw error;
    return (data ?? []).map((e) => ({
      id: String(e.id_escola),
      nome: e.nome,
      ano_letivo: e.ano_letivo,
    }));
  }

  async carregarDadosEscola(idEscola?: string | null): Promise<EscolaProps> {
    const client = resolverClienteSupabase(this.client);

    let escolaQuery = client
      .from("escola")
      .select("id_escola, nome, ano_letivo");

    if (idEscola) {
      escolaQuery = escolaQuery.eq("id_escola", paraInteiroId(idEscola, "idEscola"));
    } else {
      escolaQuery = escolaQuery.order("created_at", { ascending: true });
    }

    const { data: escolaData, error: escolaError } = await escolaQuery
      .limit(1)
      .maybeSingle();

    if (escolaError || !escolaData) {
      throw new Error("Não foi possível carregar escolas no Supabase.");
    }

    const { data: turmasData, error: turmasError } = await client
      .from("turma")
      .select("id_turma, codigo_acesso, materia, banner_url, sala, periodo_escolar, id_escola")
      .eq("id_escola", escolaData.id_escola);

    if (turmasError || !turmasData) {
      throw new Error("Não foi possível carregar turmas no Supabase.");
    }

    const idsTurmas = turmasData.map((t) => t.id_turma);
    const professoresPorTurma = new Map<
      number,
      { id?: string; nome: string; foto_url: string | null }
    >();
    const alunosPorTurma = new Map<number, UsuarioResumo[]>();

    if (idsTurmas.length > 0) {
      const [{ data: profData }, { data: alunoData }] = await Promise.all([
        client
          .from("professor_turma")
          .select("id_turma, perfil:id_professor (id_perfil, nome, foto_url)")
          .in("id_turma", idsTurmas),
        client
          .from("aluno_turma")
          .select("id_turma, perfil:id_aluno (id_perfil, nome, foto_url)")
          .in("id_turma", idsTurmas)
          .eq("situacao", "ativa"),
      ]);

      for (const item of (profData ?? []) as unknown as VinculoPerfilJoin[]) {
        const perfil = umOuPrimeiro(item.perfil);
        if (perfil) {
          professoresPorTurma.set(item.id_turma, {
            id: perfil.id_perfil,
            nome: perfil.nome || "Anônimo",
            foto_url: perfil.foto_url ?? null,
          });
        }
      }

      for (const item of (alunoData ?? []) as unknown as VinculoPerfilJoin[]) {
        const perfil = umOuPrimeiro(item.perfil);
        if (perfil?.nome) {
          const lista = alunosPorTurma.get(item.id_turma) ?? [];
          lista.push({
            id: perfil.id_perfil,
            nome: perfil.nome,
            foto_url: perfil.foto_url ?? null,
          });
          alunosPorTurma.set(item.id_turma, lista);
        }
      }
    }

    const turmasFormatadas: Record<string, TurmaProps> = {};
    for (const turma of turmasData) {
      const prof = professoresPorTurma.get(turma.id_turma) ?? {
        nome: "Anônimo",
        foto_url: null,
      };
      turmasFormatadas[String(turma.id_turma)] = mapTurmaProps(
        turma,
        prof,
        alunosPorTurma.get(turma.id_turma) ?? [],
      );
    }

    return {
      id: String(escolaData.id_escola),
      escola: escolaData.nome,
      ano_letivo: escolaData.ano_letivo,
      turmas: turmasFormatadas,
    };
  }

  async listarTurmasProfessor(
    idProfessor: string,
    nomeProfessor: string,
  ): Promise<TurmaProfessor[]> {
    const client = resolverClienteSupabase(this.client);
    const { data: relacoes, error: relError } = await client
      .from("professor_turma")
      .select("id_turma")
      .eq("id_professor", idProfessor);

    if (relError) throw relError;

    const idsTurmas = (relacoes ?? []).map((r) => r.id_turma);
    if (idsTurmas.length === 0) return [];

    const { data: turmas, error: turmasError } = await client
      .from("turma")
      .select("*")
      .in("id_turma", idsTurmas);

    if (turmasError) throw turmasError;

    return (turmas ?? []).map((turma) =>
      mapTurmaProfessor(turma, nomeProfessor),
    );
  }

  async listarIdsTurmasPorPapel(
    idPerfil: string,
    role: PerfilUsuario["role"],
  ): Promise<string[]> {
    if (role === "master") return [];

    const client = resolverClienteSupabase(this.client);
    if (role === "aluno") {
      const { data, error } = await client
        .from("aluno_turma")
        .select("id_turma")
        .eq("id_aluno", idPerfil)
        .eq("situacao", "ativa");

      if (error) throw error;
      return (data ?? []).map((item) => String(item.id_turma));
    }

    const { data, error } = await client
      .from("professor_turma")
      .select("id_turma")
      .eq("id_professor", idPerfil);

    if (error) throw error;
    return (data ?? []).map((item) => String(item.id_turma));
  }

  async alternarMatriculaAluno(
    idAluno: string,
    idTurma: string,
    jaInscrito: boolean,
  ): Promise<void> {
    const client = resolverClienteSupabase(this.client);
    const turmaNumerica = paraInteiroId(idTurma, "idTurma");

    if (jaInscrito) {
      const { error } = await client
        .from("aluno_turma")
        .delete()
        .eq("id_aluno", idAluno)
        .eq("id_turma", turmaNumerica);

      if (error) throw traduzirErroMatricula(error);
      return;
    }

    const { error } = await client.from("aluno_turma").upsert(
      {
        id_aluno: idAluno,
        id_turma: turmaNumerica,
        situacao: "ativa",
      },
      { onConflict: "id_aluno,id_turma" },
    );

    if (error) throw traduzirErroMatricula(error);
  }
}

export const escolaTurmaRepository = new EscolaTurmaRepository();
