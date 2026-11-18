import type { Duvida, DuvidaRegistroBanco } from "@/hooks/DuvidaHooks/type";
import { mapDuvida, paraInteiroId } from "@/lib/db/mappers";
import {
  AnexoStorageFacade,
  CONFIG_ANEXO_DUVIDA,
} from "@/patterns/facade/AnexoStorageFacade";
import { resolverClienteSupabase, type ClienteSupabaseTipado } from "./base";

export interface NovaDuvidaParams {
  idAluno: string;
  idTurma: string;
  assunto: string;
  descricao: string;
}

export interface ResumoDuvidaBot {
  assunto: string;
  descricao: string;
  resposta: string | null;
  resolvido: boolean;
}

export interface IDuvidaRepository {
  listarTodas(): Promise<Duvida[]>;
  criar(dados: NovaDuvidaParams, arquivos: File[]): Promise<Duvida>;
  responder(idDuvida: string, resposta: string): Promise<void>;
  excluir(duvida: Pick<Duvida, "id" | "anexos">): Promise<void>;
  listarResumoBot(idPerfil: string, role: string): Promise<ResumoDuvidaBot[]>;
}

export class DuvidaRepository implements IDuvidaRepository {
  private readonly client?: ClienteSupabaseTipado | null;
  private readonly anexoFacade?: AnexoStorageFacade;

  constructor(
    client?: ClienteSupabaseTipado | null,
    anexoFacade?: AnexoStorageFacade,
  ) {
    this.client = client;
    this.anexoFacade = anexoFacade;
  }

  private obterAnexoFacade(client: ClienteSupabaseTipado): AnexoStorageFacade {
    return (
      this.anexoFacade ?? new AnexoStorageFacade(CONFIG_ANEXO_DUVIDA, client)
    );
  }

  async listarTodas(): Promise<Duvida[]> {
    const client = resolverClienteSupabase(this.client);
    const { data, error } = await client
      .from("duvida")
      .select(
        `
        id_duvida,
        id_aluno,
        id_professor,
        id_turma,
        assunto,
        descricao,
        created_at,
        resolveu,
        resposta,
        aluno:id_aluno (nome, email, foto_url),
        professor:id_professor (nome),
        turma:id_turma (materia, periodo_escolar)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    const linhas = (data ?? []) as unknown as DuvidaRegistroBanco[];
    if (linhas.length === 0) return [];

    const facade = this.obterAnexoFacade(client);
    const anexosPorDuvida = await facade.listarPorPais(
      linhas.map((d) => d.id_duvida),
    );

    return linhas.map((d) =>
      mapDuvida(d, anexosPorDuvida.get(d.id_duvida) ?? []),
    );
  }

  async criar(dados: NovaDuvidaParams, arquivos: File[]): Promise<Duvida> {
    const client = resolverClienteSupabase(this.client);
    const turmaNum = paraInteiroId(dados.idTurma, "idTurma");

    const { data: profRel, error: profError } = await client
      .from("professor_turma")
      .select("id_professor")
      .eq("id_turma", turmaNum)
      .maybeSingle();

    if (profError || !profRel) {
      throw new Error("Professor desta turma não encontrado.");
    }

    const { data, error } = await client
      .from("duvida")
      .insert({
        id_aluno: dados.idAluno,
        id_professor: profRel.id_professor,
        id_turma: turmaNum,
        assunto: dados.assunto.trim(),
        descricao: dados.descricao.trim(),
        resolveu: false,
      })
      .select(
        `
        id_duvida,
        id_aluno,
        id_professor,
        id_turma,
        assunto,
        descricao,
        created_at,
        resolveu,
        resposta
      `,
      )
      .single();

    if (error || !data) throw error ?? new Error("Falha ao enviar dúvida.");

    const facade = this.obterAnexoFacade(client);
    const anexos = await facade.anexar(
      data.id_duvida,
      arquivos,
      `duvidas/${data.id_duvida}`,
    );

    return mapDuvida(data as DuvidaRegistroBanco, anexos);
  }

  async responder(idDuvida: string, resposta: string): Promise<void> {
    const client = resolverClienteSupabase(this.client);
    const duvidaNum = paraInteiroId(idDuvida, "idDuvida");

    const { error } = await client
      .from("duvida")
      .update({
        resposta,
        resolveu: true,
      })
      .eq("id_duvida", duvidaNum);

    if (error) throw error;
  }

  async excluir(duvida: Pick<Duvida, "id" | "anexos">): Promise<void> {
    const client = resolverClienteSupabase(this.client);
    const duvidaNum = paraInteiroId(duvida.id, "idDuvida");

    if (duvida.anexos.length > 0) {
      const facade = this.obterAnexoFacade(client);
      await facade.remover(duvida.anexos);
    }

    const { error } = await client
      .from("duvida")
      .delete()
      .eq("id_duvida", duvidaNum);

    if (error) throw error;
  }

  async listarResumoBot(
    idPerfil: string,
    role: string,
  ): Promise<ResumoDuvidaBot[]> {
    const client = resolverClienteSupabase(this.client);

    let query = client
      .from("duvida")
      .select("assunto, descricao, resposta, resolveu");

    if (role === "aluno") {
      query = query.eq("id_aluno", idPerfil);
    } else if (role === "professor") {
      query = query.eq("id_professor", idPerfil);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((item) => ({
      assunto: item.assunto,
      descricao: item.descricao,
      resposta: item.resposta,
      resolvido: item.resolveu,
    }));
  }
}

export const duvidaRepository = new DuvidaRepository();
