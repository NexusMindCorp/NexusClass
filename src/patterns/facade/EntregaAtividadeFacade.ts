import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { Entrega, EntregaRowComPerfil } from "@/hooks/EntregasHooks/type";
import type { TabelaRow } from "@/lib/database.types";
import { mapEntrega, paraInteiroId, umOuPrimeiro } from "@/lib/db/mappers";
import { supabase } from "@/lib/supabaseClient";
import { resolverCaminhosStorage } from "./AnexoStorageFacade";

export const BUCKET_ENTREGAS = "entregas_atividades";
export const TABELA_ENTREGAS = "entrega_atividade";
export const TEMPO_EXPIRACAO_URL_SEGUNDOS = 3600;

export interface SubmeterEntregaParams {
  atividadeId: string;
  alunoId: string;
  arquivo: File;
}

export interface ResultadoSubmissaoEntrega {
  idObjetoStorage: string;
  caminhoArquivo: string;
  entregueEm: string;
}

export interface AvaliarEntregaParams {
  atividadeId: string;
  alunoId: string;
  nota: number;
  feedback: string;
}

export interface ResultadoCarregamentoEntregas {
  entregaPropria: Entrega | null;
  todasEntregas: Entrega[];
}

export interface IEntregaStorageBucket {
  upload(
    path: string,
    file: File,
    options?: { upsert?: boolean },
  ): Promise<{
    data: { id?: string; path: string } | null;
    error: { message: string } | null;
  }>;
  remove(paths: string[]): Promise<{ error: { message: string } | null }>;
  createSignedUrl(
    path: string,
    expiresIn: number,
  ): Promise<{
    data: { signedUrl: string } | null;
    error: { message: string } | null;
  }>;
}

export interface IEntregaTableQuery {
  select(columns: string): {
    eq(
      column: string,
      value: string | number,
    ): {
      eq(
        column2: string,
        value2: string | number,
      ): {
        maybeSingle(): Promise<{
          data: TabelaRow<"entrega_atividade"> | null;
          error: { message: string } | null;
        }>;
      };
      order(
        orderCol: string,
        options: { ascending: boolean },
      ): Promise<{
        data: EntregaRowComPerfil[] | null;
        error: { message: string } | null;
      }>;
    };
    in(
      column: string,
      values: ReadonlyArray<string | number>,
    ): Promise<{
      data: Array<Record<string, unknown>> | null;
      error: { message: string } | null;
    }>;
  };
  upsert(
    values: {
      id_atividade: number;
      id_aluno: string;
      id_objeto_storage: string;
      entregue_em: string;
    },
    options: { onConflict: string },
  ): Promise<{ error: { message: string } | null }>;
  update(values: { nota: number; feedback: string }): {
    eq(
      column: string,
      value: string | number,
    ): {
      eq(
        column2: string,
        value2: string | number,
      ): Promise<{ error: { message: string } | null }>;
    };
  };
}

export interface IEntregaSupabaseClient {
  storage: {
    from(bucket: string): IEntregaStorageBucket;
  };
  from(table: string): IEntregaTableQuery;
}

export interface IEntregaAtividadeFacade {
  estaDisponivel(): boolean;
  carregarEntregas(
    atividadeId: string,
    perfil: Pick<PerfilUsuario, "id" | "role">,
    dataEntregaAtividade?: string | null,
  ): Promise<ResultadoCarregamentoEntregas>;
  submeter(params: SubmeterEntregaParams): Promise<ResultadoSubmissaoEntrega>;
  avaliar(params: AvaliarEntregaParams): Promise<void>;
  obterUrlDownload(
    caminho: string,
    expiraEmSegundos?: number,
  ): Promise<string | null>;
}

export class EntregaAtividadeFacade implements IEntregaAtividadeFacade {
  private readonly client: IEntregaSupabaseClient | null;

  constructor(client?: IEntregaSupabaseClient | null) {
    this.client =
      client !== undefined
        ? client
        : (supabase as unknown as IEntregaSupabaseClient | null);
  }

  static higienizarNomeArquivo(nomeOriginal: string): string {
    return nomeOriginal.replace(/[^a-zA-Z0-9.-]/g, "_");
  }

  static construirCaminhoArquivo(
    atividadeId: string,
    alunoId: string,
    nomeOriginal: string,
    timestamp = Date.now(),
  ): string {
    const nomeLimpo = EntregaAtividadeFacade.higienizarNomeArquivo(nomeOriginal);
    return `${atividadeId}/${alunoId}/${timestamp}-${nomeLimpo}`;
  }

  static normalizarEntregasComPerfis(
    registros: EntregaRowComPerfil[] | null,
    caminhosPorObjeto: Map<string, string> = new Map(),
    dataEntregaAtividade?: string | null,
  ): Entrega[] {
    if (!registros) return [];

    return registros.map((registro) => {
      const perfilRelacionado = umOuPrimeiro(registro.perfil);
      return {
        ...mapEntrega(registro, {
          dataEntregaAtividade,
          caminhoArquivo: caminhosPorObjeto.get(registro.id_objeto_storage) ?? null,
        }),
        aluno_nome: perfilRelacionado?.nome || "Aluno Anônimo",
      };
    });
  }

  estaDisponivel(): boolean {
    return Boolean(this.client);
  }

  private obterClienteObrigatorio(): IEntregaSupabaseClient {
    if (!this.client) {
      throw new Error("Cliente Supabase não configurado para entregas.");
    }
    return this.client;
  }

  async carregarEntregas(
    atividadeId: string,
    perfil: Pick<PerfilUsuario, "id" | "role">,
    dataEntregaAtividade?: string | null,
  ): Promise<ResultadoCarregamentoEntregas> {
    const client = this.obterClienteObrigatorio();
    const idAtividade = paraInteiroId(atividadeId, "atividadeId");

    if (perfil.role === "aluno") {
      const { data, error } = await client
        .from(TABELA_ENTREGAS)
        .select("*")
        .eq("id_atividade", idAtividade)
        .eq("id_aluno", perfil.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return { entregaPropria: null, todasEntregas: [] };
      }

      const caminhos = await resolverCaminhosStorage(client, [data.id_objeto_storage]);
      return {
        entregaPropria: mapEntrega(data, {
          dataEntregaAtividade,
          caminhoArquivo: caminhos.get(data.id_objeto_storage) ?? null,
        }),
        todasEntregas: [],
      };
    }

    const { data, error } = await client
      .from(TABELA_ENTREGAS)
      .select(
        `
        *,
        perfil:id_aluno (
          nome
        )
      `,
      )
      .eq("id_atividade", idAtividade)
      .order("entregue_em", { ascending: false });

    if (error) throw error;

    const idsObjetos = (data ?? []).map((item) => item.id_objeto_storage);
    const caminhos = await resolverCaminhosStorage(client, idsObjetos);

    return {
      entregaPropria: null,
      todasEntregas: EntregaAtividadeFacade.normalizarEntregasComPerfis(
        data,
        caminhos,
        dataEntregaAtividade,
      ),
    };
  }

  /**
   * Ordem obrigatória (ADR-009 §2.8):
   * 1) consulta objeto anterior;
   * 2) upload do novo arquivo;
   * 3) UPSERT apontando para o novo `id_objeto_storage` (com compensação se falhar);
   * 4) só então remove o objeto anterior do Storage (evita que o ON DELETE CASCADE apague a entrega).
   */
  async submeter({
    atividadeId,
    alunoId,
    arquivo,
  }: SubmeterEntregaParams): Promise<ResultadoSubmissaoEntrega> {
    const client = this.obterClienteObrigatorio();
    const idAtividade = paraInteiroId(atividadeId, "atividadeId");

    const { data: entregaAnterior } = await client
      .from(TABELA_ENTREGAS)
      .select("id_objeto_storage")
      .eq("id_atividade", idAtividade)
      .eq("id_aluno", alunoId)
      .maybeSingle();

    let caminhoAnterior: string | null = null;
    if (entregaAnterior?.id_objeto_storage) {
      const caminhos = await resolverCaminhosStorage(client, [
        entregaAnterior.id_objeto_storage,
      ]);
      caminhoAnterior = caminhos.get(entregaAnterior.id_objeto_storage) ?? null;
    }

    const caminhoArquivo = EntregaAtividadeFacade.construirCaminhoArquivo(
      atividadeId,
      alunoId,
      arquivo.name,
    );

    const { data: uploadData, error: uploadError } = await client.storage
      .from(BUCKET_ENTREGAS)
      .upload(caminhoArquivo, arquivo, { upsert: true });

    if (uploadError || !uploadData?.id) {
      throw uploadError ?? new Error("Falha ao enviar arquivo para o Storage.");
    }

    const entregueEm = new Date().toISOString();

    const { error: dbError } = await client.from(TABELA_ENTREGAS).upsert(
      {
        id_atividade: idAtividade,
        id_aluno: alunoId,
        id_objeto_storage: uploadData.id,
        entregue_em: entregueEm,
      },
      { onConflict: "id_atividade,id_aluno" },
    );

    if (dbError) {
      await client.storage.from(BUCKET_ENTREGAS).remove([uploadData.path]);
      throw dbError;
    }

    if (
      caminhoAnterior &&
      caminhoAnterior !== uploadData.path &&
      entregaAnterior?.id_objeto_storage !== uploadData.id
    ) {
      await client.storage.from(BUCKET_ENTREGAS).remove([caminhoAnterior]);
    }

    return {
      idObjetoStorage: uploadData.id,
      caminhoArquivo: uploadData.path,
      entregueEm,
    };
  }

  async avaliar({
    atividadeId,
    alunoId,
    nota,
    feedback,
  }: AvaliarEntregaParams): Promise<void> {
    const client = this.obterClienteObrigatorio();
    const idAtividade = paraInteiroId(atividadeId, "atividadeId");

    const { error } = await client
      .from(TABELA_ENTREGAS)
      .update({
        nota,
        feedback,
      })
      .eq("id_atividade", idAtividade)
      .eq("id_aluno", alunoId);

    if (error) throw error;
  }

  async obterUrlDownload(
    caminho: string,
    expiraEmSegundos = TEMPO_EXPIRACAO_URL_SEGUNDOS,
  ): Promise<string | null> {
    if (!this.client) return null;

    const { data, error } = await this.client.storage
      .from(BUCKET_ENTREGAS)
      .createSignedUrl(caminho, expiraEmSegundos);

    if (error || !data) {
      throw error ?? new Error("Não foi possível gerar o link do arquivo.");
    }

    return data.signedUrl;
  }
}

export const entregaAtividadeFacade = new EntregaAtividadeFacade();
