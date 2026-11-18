import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { EventoCalendario } from "@/hooks/CalendarioHooks/type";
import type { Mensagem } from "@/hooks/MensagensHooks/type";
import type { EventoCalendarioChat } from "@/hooks/botsHooks/type";
import {
  mapEventoCalendario,
  mapMensagem,
  paraInteiroId,
} from "@/lib/db/mappers";
import {
  AnexoStorageFacade,
  CONFIG_ANEXO_SUPORTE,
} from "@/patterns/facade/AnexoStorageFacade";
import { resolverClienteSupabase, type ClienteSupabaseTipado } from "./base";

export interface NovoEventoParams {
  titulo: string;
  descricao: string;
  data: string;
  horario: string;
  tipo: "pessoal" | "turma";
  idTurma: string | null;
  idAutor: string;
}

export interface NovaDenunciaParams {
  idAutor: string;
  idDenunciado: string;
  motivo: string;
  descricao: string;
}

export interface NovoTicketSuporteParams {
  idPerfil: string;
  assunto: string;
  mensagem: string;
}

export interface IComunicacaoRepository {
  listarEventos(
    perfil: Pick<PerfilUsuario, "id" | "role">,
    idsTurmas: string[],
    dataMinima: string,
  ): Promise<EventoCalendario[]>;
  criarEvento(dados: NovoEventoParams): Promise<EventoCalendario>;
  excluirEvento(idEvento: string): Promise<void>;
  listarEventosBot(
    idPerfil: string,
    role: string,
    idsTurmas: string[],
    dataMinima: string,
    limite?: number,
  ): Promise<EventoCalendarioChat[]>;
  listarMensagens(idPerfil: string): Promise<Mensagem[]>;
  enviarMensagem(
    idRemetente: string,
    idDestinatario: string,
    conteudo: string,
  ): Promise<void>;
  marcarMensagensComoLidas(
    idRemetente: string,
    idDestinatario: string,
  ): Promise<string[]>;
  criarDenuncia(dados: NovaDenunciaParams): Promise<void>;
  criarTicketSuporte(
    dados: NovoTicketSuporteParams,
    arquivos: File[],
  ): Promise<void>;
}

export class ComunicacaoRepository implements IComunicacaoRepository {
  private readonly client?: ClienteSupabaseTipado | null;
  private readonly suporteAnexoFacade?: AnexoStorageFacade;

  constructor(
    client?: ClienteSupabaseTipado | null,
    suporteAnexoFacade?: AnexoStorageFacade,
  ) {
    this.client = client;
    this.suporteAnexoFacade = suporteAnexoFacade;
  }

  private obterSuporteAnexoFacade(
    client: ClienteSupabaseTipado,
  ): AnexoStorageFacade {
    return (
      this.suporteAnexoFacade ??
      new AnexoStorageFacade(CONFIG_ANEXO_SUPORTE, client)
    );
  }

  private montarQueryEventosVisiveis(
    client: ClienteSupabaseTipado,
    idPerfil: string,
    role: string,
    idsTurmas: string[],
    dataMinima: string,
  ) {
    let query = client
      .from("evento_calendario")
      .select(
        "id_evento, titulo, descricao, data, horario, tipo, id_turma, id_autor",
      )
      .gte("data", dataMinima);

    if (role !== "master") {
      const turmasNumericas = idsTurmas
        .map((id) => Number(id))
        .filter((n) => Number.isInteger(n) && n > 0);

      if (turmasNumericas.length > 0) {
        query = query.or(
          `and(tipo.eq.pessoal,id_autor.eq.${idPerfil}),and(tipo.eq.turma,id_turma.in.(${turmasNumericas.join(",")}))`,
        );
      } else {
        query = query.eq("tipo", "pessoal").eq("id_autor", idPerfil);
      }
    }

    return query
      .order("data", { ascending: true })
      .order("horario", { ascending: true });
  }

  async listarEventos(
    perfil: Pick<PerfilUsuario, "id" | "role">,
    idsTurmas: string[],
    dataMinima: string,
  ): Promise<EventoCalendario[]> {
    const client = resolverClienteSupabase(this.client);
    const { data, error } = await this.montarQueryEventosVisiveis(
      client,
      perfil.id,
      perfil.role,
      idsTurmas,
      dataMinima,
    );

    if (error) throw error;
    return (data ?? []).map(mapEventoCalendario);
  }

  async criarEvento(dados: NovoEventoParams): Promise<EventoCalendario> {
    const client = resolverClienteSupabase(this.client);
    const { data, error } = await client
      .from("evento_calendario")
      .insert({
        titulo: dados.titulo,
        descricao: dados.descricao,
        data: dados.data,
        horario: dados.horario,
        tipo: dados.tipo,
        id_turma: dados.idTurma ? paraInteiroId(dados.idTurma, "idTurma") : null,
        id_autor: dados.idAutor,
      })
      .select(
        "id_evento, titulo, descricao, data, horario, tipo, id_turma, id_autor",
      )
      .single();

    if (error || !data) throw error ?? new Error("Falha ao salvar evento.");
    return mapEventoCalendario(data);
  }

  async excluirEvento(idEvento: string): Promise<void> {
    const client = resolverClienteSupabase(this.client);
    const { error } = await client
      .from("evento_calendario")
      .delete()
      .eq("id_evento", paraInteiroId(idEvento, "idEvento"));

    if (error) throw error;
  }

  async listarEventosBot(
    idPerfil: string,
    role: string,
    idsTurmas: string[],
    dataMinima: string,
    limite = 10,
  ): Promise<EventoCalendarioChat[]> {
    const client = resolverClienteSupabase(this.client);
    const { data, error } = await this.montarQueryEventosVisiveis(
      client,
      idPerfil,
      role,
      idsTurmas,
      dataMinima,
    ).limit(limite);

    if (error) throw error;
    return (data ?? []).map((e) => ({
      titulo: e.titulo,
      descricao: e.descricao,
      data: e.data,
      horario: e.horario.slice(0, 5),
    }));
  }

  async listarMensagens(idPerfil: string): Promise<Mensagem[]> {
    const client = resolverClienteSupabase(this.client);
    const { data, error } = await client
      .from("mensagem")
      .select("*")
      .or(`id_remetente.eq.${idPerfil},id_destinatario.eq.${idPerfil}`)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapMensagem);
  }

  async enviarMensagem(
    idRemetente: string,
    idDestinatario: string,
    conteudo: string,
  ): Promise<void> {
    const client = resolverClienteSupabase(this.client);
    const { error } = await client.from("mensagem").insert({
      id_remetente: idRemetente,
      id_destinatario: idDestinatario,
      conteudo: conteudo.trim(),
      lida: false,
    });

    if (error) throw error;
  }

  async marcarMensagensComoLidas(
    idRemetente: string,
    idDestinatario: string,
  ): Promise<string[]> {
    const client = resolverClienteSupabase(this.client);
    const { data, error } = await client
      .from("mensagem")
      .update({ lida: true })
      .eq("id_remetente", idRemetente)
      .eq("id_destinatario", idDestinatario)
      .eq("lida", false)
      .select("id_mensagem");

    if (error) throw error;
    return (data ?? []).map((row) => String(row.id_mensagem));
  }

  async criarDenuncia(dados: NovaDenunciaParams): Promise<void> {
    const client = resolverClienteSupabase(this.client);
    const { error } = await client.from("denuncia").insert({
      id_autor: dados.idAutor,
      id_denunciado: dados.idDenunciado,
      motivo: dados.motivo,
      descricao: dados.descricao.trim() || "Nenhum detalhe adicional fornecido.",
      status: "pendente",
    });

    if (error) throw error;
  }

  async criarTicketSuporte(
    dados: NovoTicketSuporteParams,
    arquivos: File[],
  ): Promise<void> {
    const client = resolverClienteSupabase(this.client);
    const { data, error } = await client
      .from("ticket_suporte")
      .insert({
        id_perfil: dados.idPerfil,
        assunto: dados.assunto.trim(),
        mensagem: dados.mensagem.trim(),
        status: "pendente",
      })
      .select("id_suporte")
      .single();

    if (error || !data) {
      throw error ?? new Error("Falha ao criar ticket de suporte.");
    }

    const facade = this.obterSuporteAnexoFacade(client);
    await facade.anexar(
      data.id_suporte,
      arquivos,
      `suporte/${dados.idPerfil}/${data.id_suporte}`,
    );
  }
}

export const comunicacaoRepository = new ComunicacaoRepository();
