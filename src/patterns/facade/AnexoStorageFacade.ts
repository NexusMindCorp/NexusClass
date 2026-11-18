import type { Database, NomeTabelaPublica } from "@/lib/database.types";
import { extrairNomeArquivoStorage, type AnexoRef } from "@/lib/db/mappers";
import { supabase } from "@/lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

export const TEMPO_EXPIRACAO_ANEXO_SEGUNDOS = 3600;

export type TabelaAnexo1FN =
  | "atividade_anexo"
  | "duvida_anexo"
  | "ticket_suporte_anexo";

export type ColunaPaiAnexo = "id_atividade" | "id_duvida" | "id_suporte";

export interface ConfigAnexoStorage {
  bucket: string;
  tabela: TabelaAnexo1FN;
  colunaPai: ColunaPaiAnexo;
}

export const CONFIG_ANEXO_ATIVIDADE: ConfigAnexoStorage = {
  bucket: "anexos_atividades",
  tabela: "atividade_anexo",
  colunaPai: "id_atividade",
};

export const CONFIG_ANEXO_DUVIDA: ConfigAnexoStorage = {
  bucket: "duvidasalunostoprofessor",
  tabela: "duvida_anexo",
  colunaPai: "id_duvida",
};

export const CONFIG_ANEXO_SUPORTE: ConfigAnexoStorage = {
  bucket: "anexos_suporte",
  tabela: "ticket_suporte_anexo",
  colunaPai: "id_suporte",
};

export interface IAnexoStorageBucket {
  upload(
    path: string,
    file: File,
    options?: { upsert?: boolean },
  ): Promise<{
    data: { id?: string; path: string } | null;
    error: { message: string } | null;
  }>;
  remove(paths: string[]): Promise<{ error: { message: string } | null }>;
  createSignedUrls(
    paths: string[],
    expiresIn: number,
  ): Promise<{
    data: Array<{ path: string | null; signedUrl: string; error?: string | null }> | null;
    error: { message: string } | null;
  }>;
}

export interface IStorageObjetosReader {
  from(table: "v_storage_objetos"): {
    select(columns: string): {
      in(
        column: string,
        values: ReadonlyArray<string | number>,
      ): PromiseLike<{
        data: Array<Record<string, unknown>> | null;
        error: { message: string } | null;
      }>;
    };
  };
}

export interface IAnexoSupabaseClient {
  storage: {
    from(bucket: string): IAnexoStorageBucket;
  };
  from(table: NomeTabelaPublica | "v_storage_objetos"): {
    select(columns: string): {
      in(
        column: string,
        values: ReadonlyArray<string | number>,
      ): PromiseLike<{
        data: Array<Record<string, unknown>> | null;
        error: { message: string } | null;
      }>;
    };
    insert(
      values: Record<string, unknown>,
    ): PromiseLike<{ error: { message: string } | null }>;
  };
}

/**
 * Resolve uma lista de `storage.objects.id` para os respectivos caminhos no bucket
 * através da view segura `public.v_storage_objetos` (respeitando RLS de `storage.objects`).
 */
export async function resolverCaminhosStorage(
  client: IStorageObjetosReader | SupabaseClient<Database>,
  idsObjetos: string[],
): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  const idsUnicos = Array.from(new Set(idsObjetos.filter(Boolean)));
  if (idsUnicos.length === 0) return mapa;

  const reader = client as IStorageObjetosReader;
  const { data, error } = await reader
    .from("v_storage_objetos")
    .select("id, name")
    .in("id", idsUnicos);

  if (error || !data) return mapa;

  for (const row of data) {
    const id = typeof row.id === "string" ? row.id : "";
    const name = typeof row.name === "string" ? row.name : "";
    if (id && name) {
      mapa.set(id, name);
    }
  }

  return mapa;
}

/**
 * Facade genérica para anexos 1FN vinculados a `storage.objects(id)` em buckets privados.
 * Centraliza upload, inserção na tabela filha com compensação em caso de falha,
 * resolução de URLs assinadas e exclusão exclusiva via Storage API.
 */
export class AnexoStorageFacade {
  private readonly cfg: ConfigAnexoStorage;
  private readonly client: IAnexoSupabaseClient | null;

  constructor(
    cfg: ConfigAnexoStorage,
    client?: IAnexoSupabaseClient | SupabaseClient<Database> | null,
  ) {
    this.cfg = cfg;
    this.client =
      client !== undefined
        ? (client as unknown as IAnexoSupabaseClient | null)
        : (supabase as unknown as IAnexoSupabaseClient | null);
  }

  static higienizarNomeArquivo(nomeOriginal: string): string {
    return nomeOriginal.replace(/[^a-zA-Z0-9.-]/g, "_");
  }

  private obterClienteObrigatorio(): IAnexoSupabaseClient {
    if (!this.client) {
      throw new Error("Cliente Supabase não configurado para anexos.");
    }
    return this.client;
  }

  /**
   * Envia arquivos para o bucket privado e cria os vínculos 1FN na tabela configurada.
   * Se a inserção no banco falhar, remove o objeto recém-enviado do Storage (compensação).
   */
  async anexar(
    idPai: number,
    arquivos: File[],
    prefixo: string,
  ): Promise<AnexoRef[]> {
    if (!arquivos || arquivos.length === 0) return [];

    const client = this.obterClienteObrigatorio();
    const anexosCriados: AnexoRef[] = [];

    for (const file of arquivos) {
      const nomeLimpo = AnexoStorageFacade.higienizarNomeArquivo(file.name);
      const sufixoUnico = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const caminho = `${prefixo}/${sufixoUnico}-${nomeLimpo}`;

      const { data: uploadData, error: uploadError } = await client.storage
        .from(this.cfg.bucket)
        .upload(caminho, file);

      if (uploadError || !uploadData?.id) {
        throw uploadError ?? new Error("Falha ao enviar anexo para o Storage.");
      }

      const { error: dbError } = await client.from(this.cfg.tabela).insert({
        [this.cfg.colunaPai]: idPai,
        id_objeto_storage: uploadData.id,
      });

      if (dbError) {
        // Compensação: evita objeto órfão no bucket caso a gravação relacional falhe
        await client.storage.from(this.cfg.bucket).remove([uploadData.path]);
        throw dbError;
      }

      anexosCriados.push({
        idObjeto: uploadData.id,
        caminho: uploadData.path,
        nome: extrairNomeArquivoStorage(uploadData.path),
      });
    }

    return anexosCriados;
  }

  /**
   * Lista e resolve anexos para múltiplos registros pais, já incluindo URLs assinadas.
   */
  async listarPorPais(idsPai: number[]): Promise<Map<number, AnexoRef[]>> {
    const resultado = new Map<number, AnexoRef[]>();
    if (idsPai.length === 0 || !this.client) return resultado;

    const { data, error } = await this.client
      .from(this.cfg.tabela)
      .select(`${this.cfg.colunaPai}, id_objeto_storage`)
      .in(this.cfg.colunaPai, idsPai);

    if (error || !data || data.length === 0) return resultado;

    const idsObjetos = data
      .map((row) => String(row.id_objeto_storage ?? ""))
      .filter(Boolean);
    const caminhosPorObjeto = await resolverCaminhosStorage(this.client, idsObjetos);

    const refsTemporarias: Array<{ idPai: number; ref: AnexoRef }> = [];
    for (const row of data) {
      const idPai = Number(row[this.cfg.colunaPai]);
      const idObjeto = String(row.id_objeto_storage ?? "");
      const caminho = caminhosPorObjeto.get(idObjeto) ?? "";
      if (!idPai || !idObjeto) continue;

      refsTemporarias.push({
        idPai,
        ref: {
          idObjeto,
          caminho,
          nome: extrairNomeArquivoStorage(caminho),
        },
      });
    }

    const urls = await this.urlsAssinadas(refsTemporarias.map((item) => item.ref));

    for (const { idPai, ref } of refsTemporarias) {
      const atual = resultado.get(idPai) ?? [];
      atual.push({
        ...ref,
        urlAssinada: ref.caminho ? urls[ref.caminho] : undefined,
      });
      resultado.set(idPai, atual);
    }

    return resultado;
  }

  /**
   * Remove arquivos exclusivamente pela Storage API; a FK `ON DELETE CASCADE`
   * remove automaticamente as linhas correspondentes na tabela de anexo.
   */
  async remover(refs: AnexoRef[]): Promise<void> {
    if (!refs || refs.length === 0) return;

    const client = this.obterClienteObrigatorio();
    const caminhos = refs.map((r) => r.caminho).filter(Boolean);
    if (caminhos.length === 0) return;

    const { error } = await client.storage.from(this.cfg.bucket).remove(caminhos);
    if (error) throw error;
  }

  /**
   * Gera URLs assinadas temporárias em lote para buckets privados (substitui `getPublicUrl`).
   */
  async urlsAssinadas(
    refs: AnexoRef[],
    ttl = TEMPO_EXPIRACAO_ANEXO_SEGUNDOS,
  ): Promise<Record<string, string>> {
    const mapaUrls: Record<string, string> = {};
    if (!this.client || refs.length === 0) return mapaUrls;

    const caminhos = Array.from(new Set(refs.map((r) => r.caminho).filter(Boolean)));
    if (caminhos.length === 0) return mapaUrls;

    const { data, error } = await this.client.storage
      .from(this.cfg.bucket)
      .createSignedUrls(caminhos, ttl);

    if (error || !data) return mapaUrls;

    for (const item of data) {
      if (item.path && item.signedUrl) {
        mapaUrls[item.path] = item.signedUrl;
      }
    }

    return mapaUrls;
  }
}
