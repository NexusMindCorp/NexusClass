import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { Entrega, EntregaRowComPerfil } from "@/hooks/EntregasHooks/type";
import { supabase } from "@/lib/supabaseClient";

export const BUCKET_ENTREGAS = "entregas_atividades";
export const TABELA_ENTREGAS = "entregas_atividades";
export const TEMPO_EXPIRACAO_URL_SEGUNDOS = 3600;

export interface SubmeterEntregaParams {
  atividadeId: string;
  alunoId: string;
  arquivo: File;
}

export interface ResultadoSubmissaoEntrega {
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
    data: { path: string } | null;
    error: { message: string } | null;
  }>;
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
      value: string,
    ): {
      eq(
        column2: string,
        value2: string,
      ): {
        maybeSingle(): Promise<{
          data: Entrega | null;
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
  };
  upsert(
    values: {
      atividade_id: string;
      aluno_id: string;
      url_anexo: string;
      entregue_em: string;
    },
    options: { onConflict: string },
  ): Promise<{ error: { message: string } | null }>;
  update(values: {
    nota: number;
    feedback: string;
    updated_at: string;
  }): {
    eq(
      column: string,
      value: string,
    ): {
      eq(
        column2: string,
        value2: string,
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
    const nomeLimpo =
      EntregaAtividadeFacade.higienizarNomeArquivo(nomeOriginal);
    return `${atividadeId}/${alunoId}/${timestamp}-${nomeLimpo}`;
  }

  static normalizarEntregasComPerfis(
    registros: EntregaRowComPerfil[] | null,
  ): Entrega[] {
    if (!registros) return [];

    return registros.map((registro) => {
      const perfilRelacionado = Array.isArray(registro.perfis)
        ? registro.perfis[0]
        : registro.perfis;

      return {
        ...registro,
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
  ): Promise<ResultadoCarregamentoEntregas> {
    const client = this.obterClienteObrigatorio();

    if (perfil.role === "aluno") {
      const { data, error } = await client
        .from(TABELA_ENTREGAS)
        .select("*")
        .eq("atividade_id", atividadeId)
        .eq("aluno_id", perfil.id)
        .maybeSingle();

      if (error) throw error;

      return {
        entregaPropria: data,
        todasEntregas: [],
      };
    }

    const { data, error } = await client
      .from(TABELA_ENTREGAS)
      .select(
        `
        *,
        perfis:aluno_id (
          nome
        )
      `,
      )
      .eq("atividade_id", atividadeId)
      .order("entregue_em", { ascending: false });

    if (error) throw error;

    return {
      entregaPropria: null,
      todasEntregas: EntregaAtividadeFacade.normalizarEntregasComPerfis(data),
    };
  }

  async submeter({
    atividadeId,
    alunoId,
    arquivo,
  }: SubmeterEntregaParams): Promise<ResultadoSubmissaoEntrega> {
    const client = this.obterClienteObrigatorio();
    const caminhoArquivo = EntregaAtividadeFacade.construirCaminhoArquivo(
      atividadeId,
      alunoId,
      arquivo.name,
    );

    const { data: uploadData, error: uploadError } = await client.storage
      .from(BUCKET_ENTREGAS)
      .upload(caminhoArquivo, arquivo, { upsert: true });

    if (uploadError || !uploadData) {
      throw uploadError ?? new Error("Falha ao enviar arquivo para o Storage.");
    }

    const entregueEm = new Date().toISOString();

    const { error: dbError } = await client.from(TABELA_ENTREGAS).upsert(
      {
        atividade_id: atividadeId,
        aluno_id: alunoId,
        url_anexo: uploadData.path,
        entregue_em: entregueEm,
      },
      { onConflict: "atividade_id,aluno_id" },
    );

    if (dbError) throw dbError;

    return {
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

    const { error } = await client
      .from(TABELA_ENTREGAS)
      .update({
        nota,
        feedback,
        updated_at: new Date().toISOString(),
      })
      .eq("atividade_id", atividadeId)
      .eq("aluno_id", alunoId);

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
