# Observer (`NotificacaoSubject`)

**Por quê:** o sistema possuía 5 canais Supabase Realtime (`mural_posts`, `atividades`, `entregas_atividades`, `mensagens`, `alertas_calendario`) dispersos em 3 hooks (`useMural`, `useGerenciador`, `useMensagens`), cada um acoplando transporte WebSocket, regras de filtragem/deduplicação e efeitos visuais (`toast` Sonner e atualização de estado/badges).

**Como funciona:**
- `NotificacaoSubject<E>` mantém um `Set<NotificacaoObserver<E>>`, expondo `inscrever(observer)` (que retorna uma função `unsubscribe` para o cleanup do `useEffect`), `desinscrever(observer)`, `notificar(evento)` e `limparObservers()`.
- **Observers Concretos:**
  - `ToastNotificacaoObserver`: exibe toasts para novos posts no mural e novas atividades (ignorando o próprio autor/professor) e alertas de 5 minutos do calendário (com deduplicação via `gerarChaveAlertaCalendario`).
  - `StateRefreshObserver`: atualiza listas de entregas (`ENTREGA_ATIVIDADE_ATUALIZADA`) e reconcilia mensagens de chat (`MENSAGEM_CHAT` via `aplicarEventoMensagemNaLista`).
  - `BadgeCounterObserver`: contabiliza eventos não lidos destinados ao usuário (`calcularTotalMensagensNaoLidas` e contador reativo).
- **Conectores Realtime:** `conectarCanaisMuralRealtime`, `conectarCanalAlertasCalendarioRealtime` e `conectarCanalMensagensRealtime`.

**Exemplo:**
```ts
const desinscrever = notificacaoSubject.inscrever(
  new ToastNotificacaoObserver({
    usuarioIdAtual: perfil.id,
    toastFn: toast,
    aoCarregarPosts: () => void carregarPosts(),
  }),
);
```

**Status:** Implementado (Fase 4 — `src/patterns/observer/NotificacaoSubject.ts`)
