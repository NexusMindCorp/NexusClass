import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  NotificacaoSubject,
  notificacaoSubject,
  ToastNotificacaoObserver,
  StateRefreshObserver,
  BadgeCounterObserver,
  gerarChaveAlertaCalendario,
  aplicarEventoMensagemNaLista,
  calcularTotalMensagensNaoLidas,
  conectarCanaisMuralRealtime,
  conectarCanalAlertasCalendarioRealtime,
  conectarCanalMensagensRealtime,
  type CanalRealtimeLike,
  type ClienteRealtimeLike,
  type EventoNotificacaoRealtime,
  type FiltroPostgresChanges,
  type NotificacaoObserver,
  type PayloadPostgresChanges,
  type ToastDispatcher,
  type ToastOptions,
} from "@/patterns/observer/NotificacaoSubject";
import type { PayloadAlertaCalendario } from "@/hooks/GerenciadorHooks/type";
import type { Mensagem } from "@/hooks/MensagensHooks/type";

const criarMensagemFake = (parcial: Partial<Mensagem> = {}): Mensagem => ({
  id: "msg-1",
  remetente_id: "user-remetente",
  destinatario_id: "user-destinatario",
  conteudo: "Olá, professor!",
  lida: false,
  created_at: "2026-11-05T12:00:00Z",
  assunto: "",
  ...parcial,
});

const criarAlertaFake = (
  parcial: Partial<PayloadAlertaCalendario> = {},
): PayloadAlertaCalendario => ({
  id: "alerta-1",
  evento_id: "ev-100",
  titulo_evento: "Prova de Engenharia de Software",
  mensagem: "A avaliação começa em 5 minutos.",
  minutos_antes: 5,
  lembrete_para: "user-1",
  created_at: "2026-11-05T12:00:00Z",
  ...parcial,
});

const criarToastMock = () => {
  const fnBase = vi.fn<(mensagem: string, opcoes?: ToastOptions) => unknown>();
  const warningFn =
    vi.fn<(mensagem: string, opcoes?: ToastOptions) => unknown>();
  const dispatcher = Object.assign(fnBase, {
    warning: warningFn,
  }) as ToastDispatcher & {
    warning: ReturnType<typeof vi.fn>;
  };
  return { dispatcher, fnBase, warningFn };
};

interface CanalFake extends CanalRealtimeLike {
  nome: string;
  filtro: FiltroPostgresChanges | null;
  callback:
    | ((payload: PayloadPostgresChanges<Record<string, unknown>>) => void)
    | null;
  subscrito: boolean;
}

const criarClienteRealtimeFake = () => {
  const canais = new Map<string, CanalFake>();
  const canaisRemovidos: string[] = [];

  const cliente: ClienteRealtimeLike<CanalFake> = {
    channel(nome: string): CanalFake {
      const canal: CanalFake = {
        nome,
        filtro: null,
        callback: null,
        subscrito: false,
        on(_type, filter, cb) {
          this.filtro = filter;
          this.callback = cb;
          return this;
        },
        subscribe() {
          this.subscrito = true;
          return this;
        },
      };
      canais.set(nome, canal);
      return canal;
    },
    removeChannel(canal: CanalFake) {
      canaisRemovidos.push(canal.nome);
      return Promise.resolve("ok");
    },
  };

  return { cliente, canais, canaisRemovidos };
};

describe("Fase 4 — Padrão Observer (NotificacaoSubject e Observers Realtime)", () => {
  beforeEach(() => {
    notificacaoSubject.limparObservers();
  });

  describe("NotificacaoSubject (Ciclo de Vida 1-para-N)", () => {
    it("deve inscrever múltiplos observers, notificá-los em broadcast e permitir desinscrição via cleanup", () => {
      const subject = new NotificacaoSubject<EventoNotificacaoRealtime>();
      const eventosObs1: EventoNotificacaoRealtime[] = [];
      const eventosObs2: EventoNotificacaoRealtime[] = [];

      const obs1: NotificacaoObserver = {
        atualizar: (e) => eventosObs1.push(e),
      };
      const obs2: NotificacaoObserver = {
        atualizar: (e) => eventosObs2.push(e),
      };

      const cancelarObs1 = subject.inscrever(obs1);
      subject.inscrever(obs2);

      expect(subject.totalObservers).toBe(2);

      const eventoPost: EventoNotificacaoRealtime = {
        tipo: "NOVO_POST_MURAL",
        turmaId: "turma-dcc061",
        autorId: "prof-1",
      };
      subject.notificar(eventoPost);

      expect(eventosObs1).toEqual([eventoPost]);
      expect(eventosObs2).toEqual([eventoPost]);

      cancelarObs1();
      expect(subject.totalObservers).toBe(1);

      subject.notificar(eventoPost);
      expect(eventosObs1).toHaveLength(1);
      expect(eventosObs2).toHaveLength(2);

      subject.limparObservers();
      expect(subject.totalObservers).toBe(0);
    });

    it("deve manter a instância compartilhada notificacaoSubject operacional e isolada após limparObservers", () => {
      const spy = vi.fn();
      const desinscrever = notificacaoSubject.inscrever({ atualizar: spy });

      expect(notificacaoSubject.totalObservers).toBe(1);
      notificacaoSubject.notificar({
        tipo: "ENTREGA_ATIVIDADE_ATUALIZADA",
        alunoId: "aluno-1",
        eventType: "INSERT",
      });
      expect(spy).toHaveBeenCalledTimes(1);

      desinscrever();
      expect(notificacaoSubject.totalObservers).toBe(0);
    });
  });

  describe("ToastNotificacaoObserver (Toasts de Mural, Atividades e Alertas de Calendário)", () => {
    it("deve disparar toast de novo post no mural apenas quando o autor for diferente do usuário logado e acionar callback Carregar", () => {
      const { dispatcher, fnBase } = criarToastMock();
      const aoCarregarPosts = vi.fn();
      const observer = new ToastNotificacaoObserver({
        usuarioIdAtual: "aluno-1",
        toastFn: dispatcher,
        aoCarregarPosts,
      });

      // Mesmo autor -> deve ignorar
      observer.atualizar({
        tipo: "NOVO_POST_MURAL",
        turmaId: "t1",
        autorId: "aluno-1",
      });
      expect(fnBase).not.toHaveBeenCalled();

      // Outro autor -> deve exibir toast e permitir clicar em "Carregar"
      observer.atualizar({
        tipo: "NOVO_POST_MURAL",
        turmaId: "t1",
        autorId: "prof-1",
      });
      expect(fnBase).toHaveBeenCalledTimes(1);
      expect(fnBase).toHaveBeenCalledWith(
        "O mural foi atualizado!",
        expect.objectContaining({
          description: "Uma nova publicação foi adicionada.",
        }),
      );

      const opcoesChamada = fnBase.mock.calls[0]?.[1];
      opcoesChamada?.action?.onClick();
      expect(aoCarregarPosts).toHaveBeenCalledTimes(1);
    });

    it("deve disparar toast de nova atividade apenas quando o professor for diferente do usuário logado e acionar callback Carregar", () => {
      const { dispatcher, fnBase } = criarToastMock();
      const aoCarregarAtividades = vi.fn();
      const observer = new ToastNotificacaoObserver({
        usuarioIdAtual: "prof-1",
        toastFn: dispatcher,
        aoCarregarAtividades,
      });

      // Próprio professor -> ignora
      observer.atualizar({
        tipo: "NOVA_ATIVIDADE_TURMA",
        turmaId: "t1",
        professorId: "prof-1",
      });
      expect(fnBase).not.toHaveBeenCalled();

      // Outro usuário vendo atividade do professor -> dispara toast
      const observerAluno = new ToastNotificacaoObserver({
        usuarioIdAtual: "aluno-1",
        toastFn: dispatcher,
        aoCarregarAtividades,
      });
      observerAluno.atualizar({
        tipo: "NOVA_ATIVIDADE_TURMA",
        turmaId: "t1",
        professorId: "prof-1",
      });

      expect(fnBase).toHaveBeenCalledTimes(1);
      expect(fnBase).toHaveBeenCalledWith(
        "Novas atividades!",
        expect.objectContaining({
          description: "Uma nova atividade foi postada na turma.",
        }),
      );

      const opcoesChamada = fnBase.mock.calls[0]?.[1];
      opcoesChamada?.action?.onClick();
      expect(aoCarregarAtividades).toHaveBeenCalledTimes(1);
    });

    it("deve deduplicar alertas de calendário repetidos e usar mensagem padrão quando vazia", () => {
      const { dispatcher, warningFn } = criarToastMock();
      const alertasEnviados = new Set<string>();
      const observer = new ToastNotificacaoObserver({
        usuarioIdAtual: "aluno-1",
        toastFn: dispatcher,
        alertasEnviados,
      });

      const alerta1 = criarAlertaFake({
        evento_id: "ev-1",
        minutos_antes: 5,
        mensagem: "Aula em 5 min!",
      });
      expect(gerarChaveAlertaCalendario(alerta1)).toBe("ev-1-5");

      observer.atualizar({ tipo: "ALERTA_CALENDARIO", alerta: alerta1 });
      observer.atualizar({ tipo: "ALERTA_CALENDARIO", alerta: alerta1 }); // duplicado

      expect(warningFn).toHaveBeenCalledTimes(1);
      expect(warningFn).toHaveBeenCalledWith("Aula em 5 min!", {
        description: "Prova de Engenharia de Software",
        duration: 12000,
      });

      // Alerta sem minutos_antes e sem mensagem personalizada -> usa fallback "db" e texto padrão
      const alertaFallback = criarAlertaFake({
        evento_id: "ev-2",
        minutos_antes: undefined,
        mensagem: "",
      });
      expect(gerarChaveAlertaCalendario(alertaFallback)).toBe("ev-2-db");

      observer.atualizar({
        tipo: "ALERTA_CALENDARIO",
        alerta: alertaFallback,
      });
      expect(warningFn).toHaveBeenCalledTimes(2);
      expect(warningFn).toHaveBeenLastCalledWith(
        "Um evento comeca em 5 minutos.",
        {
          description: "Prova de Engenharia de Software",
          duration: 12000,
        },
      );

      // Eventos de entrega/chat são ignorados pelo ToastNotificacaoObserver
      observer.atualizar({
        tipo: "ENTREGA_ATIVIDADE_ATUALIZADA",
        alunoId: "aluno-1",
        eventType: "INSERT",
      });
      expect(warningFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("StateRefreshObserver e Reconciliação de Mensagens/Entregas", () => {
    it("deve recarregar atividades apenas quando a entrega pertencer ao aluno logado", () => {
      const aoRecarregarAtividades = vi.fn();
      const observer = new StateRefreshObserver({
        usuarioIdAtual: "aluno-1",
        aoRecarregarAtividades,
      });

      observer.atualizar({
        tipo: "ENTREGA_ATIVIDADE_ATUALIZADA",
        alunoId: "outro-aluno",
        eventType: "INSERT",
      });
      expect(aoRecarregarAtividades).not.toHaveBeenCalled();

      observer.atualizar({
        tipo: "ENTREGA_ATIVIDADE_ATUALIZADA",
        alunoId: "aluno-1",
        eventType: "UPDATE",
      });
      expect(aoRecarregarAtividades).toHaveBeenCalledTimes(1);
    });

    it("deve reconciliar INSERT, UPDATE e duplicatas em aplicarEventoMensagemNaLista e no StateRefreshObserver", () => {
      let estadoMensagens: Mensagem[] = [
        criarMensagemFake({
          id: "msg-1",
          remetente_id: "prof-1",
          destinatario_id: "aluno-1",
          conteudo: "Texto original",
          lida: false,
        }),
      ];

      const observer = new StateRefreshObserver({
        usuarioIdAtual: "aluno-1",
        obterIdsMensagensLidas: () => new Set(["msg-2"]),
        aoAtualizarMensagens: (updater) => {
          estadoMensagens = updater(estadoMensagens);
        },
      });

      // Mensagem de terceiros -> ignorada
      observer.atualizar({
        tipo: "MENSAGEM_CHAT",
        eventType: "INSERT",
        mensagem: criarMensagemFake({
          id: "msg-terceiros",
          remetente_id: "outro-1",
          destinatario_id: "outro-2",
        }),
      });
      expect(estadoMensagens).toHaveLength(1);

      // INSERT de nova mensagem cujo ID já consta no localStorage como lida
      observer.atualizar({
        tipo: "MENSAGEM_CHAT",
        eventType: "INSERT",
        mensagem: criarMensagemFake({
          id: "msg-2",
          remetente_id: "prof-1",
          destinatario_id: "aluno-1",
          conteudo: "Segunda mensagem",
          lida: false,
        }),
      });
      expect(estadoMensagens).toHaveLength(2);
      expect(estadoMensagens[1]?.lida).toBe(true);

      // INSERT duplicado de msg-2 -> não duplica
      observer.atualizar({
        tipo: "MENSAGEM_CHAT",
        eventType: "INSERT",
        mensagem: criarMensagemFake({
          id: "msg-2",
          remetente_id: "prof-1",
          destinatario_id: "aluno-1",
        }),
      });
      expect(estadoMensagens).toHaveLength(2);

      // UPDATE de msg-1 -> atualiza conteúdo e preserva msg-2
      observer.atualizar({
        tipo: "MENSAGEM_CHAT",
        eventType: "UPDATE",
        mensagem: criarMensagemFake({
          id: "msg-1",
          remetente_id: "prof-1",
          destinatario_id: "aluno-1",
          conteudo: "Texto editado",
          lida: true,
        }),
      });
      expect(estadoMensagens[0]?.conteudo).toBe("Texto editado");
      expect(estadoMensagens[0]?.lida).toBe(true);

      // Evento desconhecido (ex.: DELETE) -> mantém cópia imutável
      const aposDelete = aplicarEventoMensagemNaLista(
        estadoMensagens,
        "DELETE",
        estadoMensagens[0]!,
      );
      expect(aposDelete).toEqual(estadoMensagens);

      // Funciona mesmo sem callbacks opcionais configurados
      const observerMinimo = new StateRefreshObserver({
        usuarioIdAtual: "aluno-1",
      });
      observerMinimo.atualizar({
        tipo: "MENSAGEM_CHAT",
        eventType: "INSERT",
        mensagem: criarMensagemFake({
          id: "msg-3",
          remetente_id: "aluno-1",
          destinatario_id: "prof-1",
        }),
      });
      observerMinimo.atualizar({
        tipo: "NOVO_POST_MURAL",
        turmaId: "t1",
        autorId: "prof-1",
      });
    });
  });

  describe("BadgeCounterObserver e calcularTotalMensagensNaoLidas", () => {
    it("deve calcular corretamente o total de mensagens não lidas do destinatário", () => {
      const lista: Mensagem[] = [
        criarMensagemFake({
          id: "1",
          destinatario_id: "aluno-1",
          lida: false,
        }),
        criarMensagemFake({
          id: "2",
          destinatario_id: "aluno-1",
          lida: true,
        }),
        criarMensagemFake({
          id: "3",
          destinatario_id: "outro-user",
          lida: false,
        }),
      ];

      expect(calcularTotalMensagensNaoLidas(lista, null)).toBe(0);
      expect(calcularTotalMensagensNaoLidas(lista, "aluno-1")).toBe(1);
    });

    it("deve incrementar o contador de badge para eventos relevantes de outros usuários e permitir zerar", () => {
      const historicoContagem: number[] = [];
      const badgeObserver = new BadgeCounterObserver({
        usuarioIdAtual: "aluno-1",
        aoMudarContagem: (total) => historicoContagem.push(total),
      });

      badgeObserver.atualizar({
        tipo: "NOVO_POST_MURAL",
        turmaId: "t1",
        autorId: "prof-1",
      });
      badgeObserver.atualizar({
        tipo: "NOVA_ATIVIDADE_TURMA",
        turmaId: "t1",
        professorId: "prof-1",
      });
      badgeObserver.atualizar({
        tipo: "MENSAGEM_CHAT",
        eventType: "INSERT",
        mensagem: criarMensagemFake({
          id: "m1",
          remetente_id: "prof-1",
          destinatario_id: "aluno-1",
          lida: false,
        }),
      });

      // Eventos próprios não incrementam
      badgeObserver.atualizar({
        tipo: "NOVO_POST_MURAL",
        turmaId: "t1",
        autorId: "aluno-1",
      });

      expect(badgeObserver.totalNaoLidos).toBe(3);
      expect(historicoContagem).toEqual([1, 2, 3]);

      badgeObserver.zerar();
      expect(badgeObserver.totalNaoLidos).toBe(0);
      expect(historicoContagem).toEqual([1, 2, 3, 0]);
    });
  });

  describe("Conectores de Borda Supabase Realtime (5 canais)", () => {
    it("deve conectar e desconectar os 3 canais do Mural (mural_posts, atividades, entregas-mural) repassando payloads ao Subject", () => {
      const { cliente, canais, canaisRemovidos } = criarClienteRealtimeFake();
      const subject = new NotificacaoSubject();
      const eventosRecebidos: EventoNotificacaoRealtime[] = [];
      subject.inscrever({ atualizar: (e) => eventosRecebidos.push(e) });

      const desconectar = conectarCanaisMuralRealtime(cliente, subject, {
        turmaId: "turma-eng",
        alunoId: "aluno-1",
      });

      expect(canais.size).toBe(3);
      expect(canais.get("realtime:mural_posts")?.subscrito).toBe(true);
      expect(canais.get("realtime:atividades")?.subscrito).toBe(true);
      expect(canais.get("realtime:entregas-mural")?.subscrito).toBe(true);

      // Dispara eventos simulando o WebSocket do Supabase (com e sem campos definidos)
      canais.get("realtime:mural_posts")?.callback?.({
        new: { autor_id: "prof-1" },
      });
      canais.get("realtime:mural_posts")?.callback?.({
        new: {},
      });
      canais.get("realtime:atividades")?.callback?.({
        new: { professor_id: "prof-2" },
      });
      canais.get("realtime:atividades")?.callback?.({
        new: {},
      });
      canais.get("realtime:entregas-mural")?.callback?.({
        eventType: "UPSERT",
        new: {},
      });
      canais.get("realtime:entregas-mural")?.callback?.({
        new: {},
      });

      expect(eventosRecebidos).toEqual([
        { tipo: "NOVO_POST_MURAL", turmaId: "turma-eng", autorId: "prof-1" },
        { tipo: "NOVO_POST_MURAL", turmaId: "turma-eng", autorId: "" },
        {
          tipo: "NOVA_ATIVIDADE_TURMA",
          turmaId: "turma-eng",
          professorId: "prof-2",
        },
        {
          tipo: "NOVA_ATIVIDADE_TURMA",
          turmaId: "turma-eng",
          professorId: "",
        },
        {
          tipo: "ENTREGA_ATIVIDADE_ATUALIZADA",
          alunoId: "aluno-1",
          eventType: "UPSERT",
        },
        {
          tipo: "ENTREGA_ATIVIDADE_ATUALIZADA",
          alunoId: "aluno-1",
          eventType: "*",
        },
      ]);

      desconectar();
      expect(canaisRemovidos).toEqual([
        "realtime:mural_posts",
        "realtime:atividades",
        "realtime:entregas-mural",
      ]);
    });

    it("deve conectar e desconectar os canais de Alertas de Calendário e Mensagens de Chat", () => {
      const { cliente, canais, canaisRemovidos } = criarClienteRealtimeFake();
      const subject = new NotificacaoSubject();
      const eventosRecebidos: EventoNotificacaoRealtime[] = [];
      subject.inscrever({ atualizar: (e) => eventosRecebidos.push(e) });

      const desconectarAlertas = conectarCanalAlertasCalendarioRealtime(
        cliente,
        subject,
      );
      const desconectarMensagens = conectarCanalMensagensRealtime(
        cliente,
        subject,
      );

      const alerta = criarAlertaFake({ id: "alerta-99" });
      canais.get("alertas-calendario-5-min")?.callback?.({
        eventType: "INSERT",
        new: alerta as unknown as Record<string, unknown>,
      });

      const msg = criarMensagemFake({ id: "msg-99" });
      canais.get("chat-nexusclass")?.callback?.({
        eventType: "UPDATE",
        new: msg as unknown as Record<string, unknown>,
      });
      canais.get("chat-nexusclass")?.callback?.({
        new: msg as unknown as Record<string, unknown>,
      });

      expect(eventosRecebidos).toEqual([
        { tipo: "ALERTA_CALENDARIO", alerta },
        { tipo: "MENSAGEM_CHAT", eventType: "UPDATE", mensagem: msg },
        { tipo: "MENSAGEM_CHAT", eventType: "INSERT", mensagem: msg },
      ]);

      desconectarAlertas();
      desconectarMensagens();
      expect(canaisRemovidos).toEqual([
        "alertas-calendario-5-min",
        "chat-nexusclass",
      ]);
    });
  });
});
