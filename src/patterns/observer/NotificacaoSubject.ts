import type { PayloadAlertaCalendario } from "@/hooks/GerenciadorHooks/type";
import type { Mensagem } from "@/hooks/MensagensHooks/type";
import {
  CANAL_MENSAGENS,
  EVENTO_REALTIME_MENSAGENS,
  SCHEMA_REALTIME_MENSAGENS,
  TABELA_MENSAGENS,
} from "@/hooks/MensagensHooks/config";

export type EventoNovoPostMural = {
  tipo: "NOVO_POST_MURAL";
  turmaId: string;
  autorId: string;
};

export type EventoNovaAtividadeTurma = {
  tipo: "NOVA_ATIVIDADE_TURMA";
  turmaId: string;
  professorId: string;
};

export type EventoEntregaAtividadeAtualizada = {
  tipo: "ENTREGA_ATIVIDADE_ATUALIZADA";
  alunoId: string;
  eventType: string;
};

export type EventoAlertaCalendario = {
  tipo: "ALERTA_CALENDARIO";
  alerta: PayloadAlertaCalendario;
};

export type EventoMensagemChat = {
  tipo: "MENSAGEM_CHAT";
  eventType: string;
  mensagem: Mensagem;
};

export type EventoNotificacaoRealtime =
  | EventoNovoPostMural
  | EventoNovaAtividadeTurma
  | EventoEntregaAtividadeAtualizada
  | EventoAlertaCalendario
  | EventoMensagemChat;

export interface NotificacaoObserver<E = EventoNotificacaoRealtime> {
  atualizar(evento: E): void;
}

export class NotificacaoSubject<E = EventoNotificacaoRealtime> {
  private readonly observers = new Set<NotificacaoObserver<E>>();

  public inscrever(observer: NotificacaoObserver<E>): () => void {
    this.observers.add(observer);
    return () => {
      this.desinscrever(observer);
    };
  }

  public desinscrever(observer: NotificacaoObserver<E>): void {
    this.observers.delete(observer);
  }

  public notificar(evento: E): void {
    const snapshot = Array.from(this.observers);
    for (const observer of snapshot) {
      observer.atualizar(evento);
    }
  }

  public limparObservers(): void {
    this.observers.clear();
  }

  public get totalObservers(): number {
    return this.observers.size;
  }
}

export const notificacaoSubject = new NotificacaoSubject();

export interface ToastActionOption {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: ToastActionOption;
}

export interface ToastDispatcher {
  (mensagem: string, opcoes?: ToastOptions): unknown;
  warning: (mensagem: string, opcoes?: ToastOptions) => unknown;
}

export interface ToastNotificacaoObserverConfig {
  usuarioIdAtual: string;
  toastFn: ToastDispatcher;
  aoCarregarPosts?: () => void;
  aoCarregarAtividades?: () => void;
  alertasEnviados?: Set<string>;
}

export function gerarChaveAlertaCalendario(
  alerta: Pick<PayloadAlertaCalendario, "evento_id" | "minutos_antes">,
): string {
  const minuto = alerta.minutos_antes ?? "db";
  return `${alerta.evento_id}-${minuto}`;
}

export class ToastNotificacaoObserver
  implements NotificacaoObserver<EventoNotificacaoRealtime>
{
  private readonly config: ToastNotificacaoObserverConfig;
  private readonly alertasEnviados: Set<string>;

  constructor(config: ToastNotificacaoObserverConfig) {
    this.config = config;
    this.alertasEnviados = config.alertasEnviados ?? new Set<string>();
  }

  public atualizar(evento: EventoNotificacaoRealtime): void {
    if (evento.tipo === "NOVO_POST_MURAL") {
      if (evento.autorId !== this.config.usuarioIdAtual) {
        this.config.toastFn("O mural foi atualizado!", {
          description: "Uma nova publicação foi adicionada.",
          action: {
            label: "Carregar",
            onClick: () => {
              this.config.aoCarregarPosts?.();
            },
          },
        });
      }
      return;
    }

    if (evento.tipo === "NOVA_ATIVIDADE_TURMA") {
      if (evento.professorId !== this.config.usuarioIdAtual) {
        this.config.toastFn("Novas atividades!", {
          description: "Uma nova atividade foi postada na turma.",
          action: {
            label: "Carregar",
            onClick: () => {
              this.config.aoCarregarAtividades?.();
            },
          },
        });
      }
      return;
    }

    if (evento.tipo === "ALERTA_CALENDARIO") {
      const chaveAlerta = gerarChaveAlertaCalendario(evento.alerta);
      if (this.alertasEnviados.has(chaveAlerta)) {
        return;
      }

      this.alertasEnviados.add(chaveAlerta);
      this.config.toastFn.warning(
        evento.alerta.mensagem || "Um evento comeca em 5 minutos.",
        {
          description: evento.alerta.titulo_evento,
          duration: 12000,
        },
      );
    }
  }
}

export function aplicarEventoMensagemNaLista(
  mensagensAtuais: readonly Mensagem[],
  eventType: string,
  novaMensagem: Mensagem,
): Mensagem[] {
  if (eventType === "INSERT") {
    if (mensagensAtuais.some((msg) => msg.id === novaMensagem.id)) {
      return [...mensagensAtuais];
    }
    return [...mensagensAtuais, novaMensagem];
  }

  if (eventType === "UPDATE") {
    return mensagensAtuais.map((msg) =>
      msg.id === novaMensagem.id ? novaMensagem : msg,
    );
  }

  return [...mensagensAtuais];
}

export interface StateRefreshObserverConfig {
  usuarioIdAtual: string;
  aoRecarregarAtividades?: () => void;
  obterIdsMensagensLidas?: (usuarioId: string) => Set<string>;
  aoAtualizarMensagens?: (updater: (prev: Mensagem[]) => Mensagem[]) => void;
}

export class StateRefreshObserver
  implements NotificacaoObserver<EventoNotificacaoRealtime>
{
  private readonly config: StateRefreshObserverConfig;

  constructor(config: StateRefreshObserverConfig) {
    this.config = config;
  }

  public atualizar(evento: EventoNotificacaoRealtime): void {
    if (evento.tipo === "ENTREGA_ATIVIDADE_ATUALIZADA") {
      if (evento.alunoId === this.config.usuarioIdAtual) {
        this.config.aoRecarregarAtividades?.();
      }
      return;
    }

    if (evento.tipo === "MENSAGEM_CHAT") {
      const msg = evento.mensagem;
      const pertenceAoUsuario =
        msg.remetente_id === this.config.usuarioIdAtual ||
        msg.destinatario_id === this.config.usuarioIdAtual;

      if (!pertenceAoUsuario) {
        return;
      }

      const idsLidos =
        this.config.obterIdsMensagensLidas?.(this.config.usuarioIdAtual) ??
        new Set<string>();
      const novaMensagem: Mensagem = {
        ...msg,
        lida: msg.lida || idsLidos.has(msg.id),
      };

      this.config.aoAtualizarMensagens?.((prevMensagens) =>
        aplicarEventoMensagemNaLista(
          prevMensagens,
          evento.eventType,
          novaMensagem,
        ),
      );
    }
  }
}

export function calcularTotalMensagensNaoLidas(
  mensagens: readonly Mensagem[],
  usuarioId?: string | null,
): number {
  if (!usuarioId) {
    return 0;
  }
  return mensagens.filter(
    (msg) => !msg.lida && msg.destinatario_id === usuarioId,
  ).length;
}

export interface BadgeCounterObserverConfig {
  usuarioIdAtual: string;
  aoMudarContagem?: (totalNaoLidos: number) => void;
}

export class BadgeCounterObserver
  implements NotificacaoObserver<EventoNotificacaoRealtime>
{
  private readonly config: BadgeCounterObserverConfig;
  private naoLidos = 0;

  constructor(config: BadgeCounterObserverConfig) {
    this.config = config;
  }

  public atualizar(evento: EventoNotificacaoRealtime): void {
    if (
      evento.tipo === "NOVO_POST_MURAL" &&
      evento.autorId !== this.config.usuarioIdAtual
    ) {
      this.naoLidos += 1;
      this.config.aoMudarContagem?.(this.naoLidos);
      return;
    }

    if (
      evento.tipo === "NOVA_ATIVIDADE_TURMA" &&
      evento.professorId !== this.config.usuarioIdAtual
    ) {
      this.naoLidos += 1;
      this.config.aoMudarContagem?.(this.naoLidos);
      return;
    }

    if (
      evento.tipo === "MENSAGEM_CHAT" &&
      evento.eventType === "INSERT" &&
      evento.mensagem.destinatario_id === this.config.usuarioIdAtual &&
      !evento.mensagem.lida
    ) {
      this.naoLidos += 1;
      this.config.aoMudarContagem?.(this.naoLidos);
    }
  }

  public get totalNaoLidos(): number {
    return this.naoLidos;
  }

  public zerar(): void {
    this.naoLidos = 0;
    this.config.aoMudarContagem?.(this.naoLidos);
  }
}

export interface FiltroPostgresChanges {
  event: "*" | "INSERT" | "UPDATE" | "DELETE";
  schema: string;
  table: string;
  filter?: string;
}

export interface PayloadPostgresChanges<TRecord = Record<string, unknown>> {
  eventType?: string;
  new: TRecord;
}

export interface CanalRealtimeLike {
  on(
    type: "postgres_changes",
    filter: FiltroPostgresChanges,
    callback: (payload: PayloadPostgresChanges<Record<string, unknown>>) => void,
  ): this;
  subscribe(): unknown;
}

export interface ClienteRealtimeLike<
  TCanal extends CanalRealtimeLike = CanalRealtimeLike,
> {
  channel(nome: string): TCanal;
  removeChannel(canal: TCanal): unknown;
}

export interface OpcoesCanaisMuralRealtime {
  turmaId: string;
  alunoId: string;
}

export function conectarCanaisMuralRealtime<
  TCanal extends CanalRealtimeLike = CanalRealtimeLike,
>(
  supabaseClient: ClienteRealtimeLike<TCanal>,
  subject: NotificacaoSubject<EventoNotificacaoRealtime>,
  opcoes: OpcoesCanaisMuralRealtime,
): () => void {
  const { turmaId, alunoId } = opcoes;

  const channelPosts = supabaseClient
    .channel("realtime:mural_posts")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "mural_posts",
        filter: `turma_id=eq.${turmaId}`,
      },
      (payload) => {
        const autorId = String(payload.new.autor_id ?? "");
        subject.notificar({
          tipo: "NOVO_POST_MURAL",
          turmaId,
          autorId,
        });
      },
    );
  channelPosts.subscribe();

  const channelAtividades = supabaseClient
    .channel("realtime:atividades")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "atividades",
        filter: `turma_id=eq.${turmaId}`,
      },
      (payload) => {
        const professorId = String(payload.new.professor_id ?? "");
        subject.notificar({
          tipo: "NOVA_ATIVIDADE_TURMA",
          turmaId,
          professorId,
        });
      },
    );
  channelAtividades.subscribe();

  const channelEntregas = supabaseClient
    .channel("realtime:entregas-mural")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "entregas_atividades",
        filter: `aluno_id=eq.${alunoId}`,
      },
      (payload) => {
        subject.notificar({
          tipo: "ENTREGA_ATIVIDADE_ATUALIZADA",
          alunoId,
          eventType: payload.eventType ?? "*",
        });
      },
    );
  channelEntregas.subscribe();

  return () => {
    void supabaseClient.removeChannel(channelPosts);
    void supabaseClient.removeChannel(channelAtividades);
    void supabaseClient.removeChannel(channelEntregas);
  };
}

export function conectarCanalAlertasCalendarioRealtime<
  TCanal extends CanalRealtimeLike = CanalRealtimeLike,
>(
  supabaseClient: ClienteRealtimeLike<TCanal>,
  subject: NotificacaoSubject<EventoNotificacaoRealtime>,
): () => void {
  const channel = supabaseClient
    .channel("alertas-calendario-5-min")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "alertas_calendario",
      },
      (payload) => {
        const alerta = payload.new as unknown as PayloadAlertaCalendario;
        subject.notificar({
          tipo: "ALERTA_CALENDARIO",
          alerta,
        });
      },
    );
  channel.subscribe();

  return () => {
    void supabaseClient.removeChannel(channel);
  };
}

export function conectarCanalMensagensRealtime<
  TCanal extends CanalRealtimeLike = CanalRealtimeLike,
>(
  supabaseClient: ClienteRealtimeLike<TCanal>,
  subject: NotificacaoSubject<EventoNotificacaoRealtime>,
): () => void {
  const canalMensagens = supabaseClient
    .channel(CANAL_MENSAGENS)
    .on(
      "postgres_changes",
      {
        event: EVENTO_REALTIME_MENSAGENS,
        schema: SCHEMA_REALTIME_MENSAGENS,
        table: TABELA_MENSAGENS,
      },
      (payload) => {
        const mensagem = payload.new as unknown as Mensagem;
        subject.notificar({
          tipo: "MENSAGEM_CHAT",
          eventType: payload.eventType ?? "INSERT",
          mensagem,
        });
      },
    );
  canalMensagens.subscribe();

  return () => {
    void supabaseClient.removeChannel(canalMensagens);
  };
}
