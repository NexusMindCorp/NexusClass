import type { Atividade } from "@/hooks/MuralHooks/type";
import type { TabelaRow } from "@/lib/database.types";
import { mapAtividade, paraInteiroId, type AnexoRef } from "@/lib/db/mappers";
import {
  AnexoStorageFacade,
  CONFIG_ANEXO_ATIVIDADE,
  resolverCaminhosStorage,
} from "@/patterns/facade/AnexoStorageFacade";
import { BUCKET_ENTREGAS } from "@/patterns/facade/EntregaAtividadeFacade";
import {
  sanitizarTextoLinhaUnica,
  sanitizarTextoMultilinha,
} from "@/patterns/strategy/SanitizacaoStrategy";
import { resolverClienteSupabase, type ClienteSupabaseTipado } from "./base";

type AtividadeComProfessorRow = TabelaRow<"atividade"> & {
  perfil?: { nome?: string | null } | Array<{ nome?: string | null }> | null;
};

export interface NovaAtividadeParams {
  idTurma: string;
  idProfessor: string;
  titulo: string;
  descricao: string;
  dataEntrega: string;
}

export interface EdicaoAtividadeParams {
  titulo: string;
  descricao: string;
  dataEntrega: string;
}

export interface ResumoAtividadeBot {
  id: string;
  titulo: string;
  descricao?: string;
  data_entrega: string;
  turma_id: string;
}

export interface IAtividadeRepository {
  listarPorTurma(idTurma: string): Promise<Atividade[]>;
  listarEntregasDoAluno(idAluno: string): Promise<Set<string>>;
  criar(dados: NovaAtividadeParams, arquivos: File[]): Promise<Atividade>;
  editar(
    idAtividade: string,
    dados: EdicaoAtividadeParams,
    novosArquivos: File[],
    anexosRemovidos: AnexoRef[],
    anexosMantidos: AnexoRef[],
  ): Promise<Atividade>;
  excluir(atividade: Pick<Atividade, "id" | "anexos">): Promise<void>;
  listarResumoBot(
    idPerfil: string,
    role: string,
    idsTurmas: string[],
  ): Promise<ResumoAtividadeBot[]>;
}

export class AtividadeRepository implements IAtividadeRepository {
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
      this.anexoFacade ?? new AnexoStorageFacade(CONFIG_ANEXO_ATIVIDADE, client)
    );
  }

  async listarPorTurma(idTurma: string): Promise<Atividade[]> {
    const client = resolverClienteSupabase(this.client);
    const turmaNum = paraInteiroId(idTurma, "idTurma");

    const { data, error } = await client
      .from("atividade")
      .select(
        `
        id_atividade,
        id_turma,
        id_professor,
        titulo,
        descricao,
        data_entrega,
        perfil:id_professor (
          nome
        )
      `,
      )
      .eq("id_turma", turmaNum)
      .order("id_atividade", { ascending: false });

    if (error) throw error;
    const linhas = (data ?? []) as unknown as AtividadeComProfessorRow[];
    if (linhas.length === 0) return [];

    const facade = this.obterAnexoFacade(client);
    const anexosPorAtividade = await facade.listarPorPais(
      linhas.map((a) => a.id_atividade),
    );

    return linhas.map((a) =>
      mapAtividade(a, a.perfil, anexosPorAtividade.get(a.id_atividade) ?? []),
    );
  }

  async listarEntregasDoAluno(idAluno: string): Promise<Set<string>> {
    const client = resolverClienteSupabase(this.client);
    const { data, error } = await client
      .from("entrega_atividade")
      .select("id_atividade")
      .eq("id_aluno", idAluno);

    if (error || !data) return new Set();
    return new Set(data.map((e) => String(e.id_atividade)));
  }

  async criar(
    dados: NovaAtividadeParams,
    arquivos: File[],
  ): Promise<Atividade> {
    const client = resolverClienteSupabase(this.client);
    const turmaNum = paraInteiroId(dados.idTurma, "idTurma");

    const { data, error } = await client
      .from("atividade")
      .insert({
        id_turma: turmaNum,
        id_professor: dados.idProfessor,
        titulo: sanitizarTextoLinhaUnica(dados.titulo, 150),
        descricao: sanitizarTextoMultilinha(dados.descricao),
        data_entrega: new Date(dados.dataEntrega).toISOString(),
      })
      .select(
        `
        id_atividade,
        id_turma,
        id_professor,
        titulo,
        descricao,
        data_entrega,
        perfil:id_professor (
          nome
        )
      `,
      )
      .single();

    if (error || !data) throw error ?? new Error("Falha ao criar atividade.");

    const facade = this.obterAnexoFacade(client);
    const anexos = await facade.anexar(
      data.id_atividade,
      arquivos,
      `atividades/${data.id_atividade}`,
    );

    const linha = data as unknown as AtividadeComProfessorRow;
    return mapAtividade(linha, linha.perfil, anexos);
  }

  async editar(
    idAtividade: string,
    dados: EdicaoAtividadeParams,
    novosArquivos: File[],
    anexosRemovidos: AnexoRef[],
    anexosMantidos: AnexoRef[],
  ): Promise<Atividade> {
    const client = resolverClienteSupabase(this.client);
    const atividadeNum = paraInteiroId(idAtividade, "idAtividade");
    const facade = this.obterAnexoFacade(client);

    if (anexosRemovidos.length > 0) {
      await facade.remover(anexosRemovidos);
    }

    const novosAnexos = await facade.anexar(
      atividadeNum,
      novosArquivos,
      `atividades/${atividadeNum}`,
    );

    const { data, error } = await client
      .from("atividade")
      .update({
        titulo: sanitizarTextoLinhaUnica(dados.titulo, 150),
        descricao: sanitizarTextoMultilinha(dados.descricao),
        data_entrega: new Date(dados.dataEntrega).toISOString(),
      })
      .eq("id_atividade", atividadeNum)
      .select(
        `
        id_atividade,
        id_turma,
        id_professor,
        titulo,
        descricao,
        data_entrega,
        perfil:id_professor (
          nome
        )
      `,
      )
      .single();

    if (error || !data) throw error ?? new Error("Falha ao atualizar atividade.");

    const linha = data as unknown as AtividadeComProfessorRow;
    return mapAtividade(linha, linha.perfil, [...anexosMantidos, ...novosAnexos]);
  }

  /**
   * Ordem segura ao excluir atividade:
   * 1) resolve e remove arquivos de entrega dos alunos em `entregas_atividades`;
   * 2) remove anexos da atividade em `anexos_atividades`;
   * 3) exclui a linha `atividade` (CASCADE limpa os vínculos relacionais).
   */
  async excluir(atividade: Pick<Atividade, "id" | "anexos">): Promise<void> {
    const client = resolverClienteSupabase(this.client);
    const atividadeNum = paraInteiroId(atividade.id, "idAtividade");

    const { data: entregas } = await client
      .from("entrega_atividade")
      .select("id_objeto_storage")
      .eq("id_atividade", atividadeNum);

    if (entregas && entregas.length > 0) {
      const idsObjetos = entregas.map((e) => e.id_objeto_storage);
      const caminhosMap = await resolverCaminhosStorage(client, idsObjetos);
      const caminhos = Array.from(caminhosMap.values());
      if (caminhos.length > 0) {
        const { error: storageErr } = await client.storage
          .from(BUCKET_ENTREGAS)
          .remove(caminhos);
        if (storageErr) throw storageErr;
      }
    }

    if (atividade.anexos.length > 0) {
      const facade = this.obterAnexoFacade(client);
      await facade.remover(atividade.anexos);
    }

    const { error } = await client
      .from("atividade")
      .delete()
      .eq("id_atividade", atividadeNum);

    if (error) throw error;
  }

  async listarResumoBot(
    idPerfil: string,
    role: string,
    idsTurmas: string[],
  ): Promise<ResumoAtividadeBot[]> {
    const client = resolverClienteSupabase(this.client);

    if (role === "aluno") {
      if (idsTurmas.length === 0) return [];
      const turmasNum = idsTurmas.map((id) => paraInteiroId(id, "idTurma"));

      const { data: atividades, error: errAtiv } = await client
        .from("atividade")
        .select("id_atividade, titulo, descricao, data_entrega, id_turma")
        .in("id_turma", turmasNum);

      if (errAtiv) throw errAtiv;

      const entregues = await this.listarEntregasDoAluno(idPerfil);
      return (atividades ?? [])
        .filter((a) => !entregues.has(String(a.id_atividade)))
        .map((a) => ({
          id: String(a.id_atividade),
          titulo: a.titulo,
          descricao: a.descricao,
          data_entrega: a.data_entrega,
          turma_id: String(a.id_turma),
        }));
    }

    if (role === "professor") {
      const { data: atividades, error: errAtiv } = await client
        .from("atividade")
        .select("id_atividade, titulo, data_entrega, id_turma")
        .eq("id_professor", idPerfil);

      if (errAtiv) throw errAtiv;

      return (atividades ?? []).map((a) => ({
        id: String(a.id_atividade),
        titulo: a.titulo,
        data_entrega: a.data_entrega,
        turma_id: String(a.id_turma),
      }));
    }

    return [];
  }
}

export const atividadeRepository = new AtividadeRepository();
