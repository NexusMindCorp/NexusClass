import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import { mapPerfil } from "@/lib/db/mappers";
import {
  exigirUrlHttpSeguraOuNula,
  sanitizarTextoMultilinha,
} from "@/patterns/strategy/SanitizacaoStrategy";
import { resolverClienteSupabase, type ClienteSupabaseTipado } from "./base";

export interface AtualizacaoPerfilParams {
  foto_url: string | null;
  bio: string | null;
}

export interface IPerfilRepository {
  buscarPorId(idPerfil: string): Promise<PerfilUsuario | null>;
  buscarPorNome(nome: string): Promise<PerfilUsuario | null>;
  obterCodigoPublicoMinhaEscola(): Promise<string | null>;
  atualizarDados(
    idPerfil: string,
    dados: AtualizacaoPerfilParams,
  ): Promise<PerfilUsuario>;
}

export class PerfilRepository implements IPerfilRepository {
  private readonly client?: ClienteSupabaseTipado | null;

  constructor(client?: ClienteSupabaseTipado | null) {
    this.client = client;
  }

  async buscarPorId(idPerfil: string): Promise<PerfilUsuario | null> {
    const client = resolverClienteSupabase(this.client);
    const { data, error } = await client
      .from("perfil")
      .select("*")
      .eq("id_perfil", idPerfil)
      .maybeSingle();

    if (error) throw error;
    return data ? mapPerfil(data) : null;
  }

  async buscarPorNome(nome: string): Promise<PerfilUsuario | null> {
    const client = resolverClienteSupabase(this.client);
    const { data, error } = await client
      .from("perfil")
      .select("*")
      .eq("nome", nome)
      .maybeSingle();

    if (error) throw error;
    return data ? mapPerfil(data) : null;
  }

  async obterCodigoPublicoMinhaEscola(): Promise<string | null> {
    const client = resolverClienteSupabase(this.client);
    const { data, error } = await client.rpc("obter_codigo_publico_minha_escola");

    if (error) throw error;
    return typeof data === "string" && data.trim().length > 0 ? data : null;
  }

  async atualizarDados(
    idPerfil: string,
    dados: AtualizacaoPerfilParams,
  ): Promise<PerfilUsuario> {
    const client = resolverClienteSupabase(this.client);
    const fotoSegura = exigirUrlHttpSeguraOuNula(
      dados.foto_url,
      "A URL da foto de perfil deve começar com https:// ou http://.",
    );
    const bioSegura =
      dados.bio !== null ? sanitizarTextoMultilinha(dados.bio) : null;

    // Atualiza somente campos mutáveis pelo usuário (nunca envia role ou id_escola)
    const { data, error } = await client
      .from("perfil")
      .update({
        foto_url: fotoSegura,
        bio: bioSegura || null,
      })
      .eq("id_perfil", idPerfil)
      .select("*")
      .single();

    if (error) throw error;
    if (!data) {
      throw new Error("Não autorizado. Verifique sua sessão.");
    }
    return mapPerfil(data);
  }
}

export const perfilRepository = new PerfilRepository();
