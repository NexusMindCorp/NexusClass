# ADR-006: Padrão Observer (`NotificacaoSubject`) para Centralização de Canais e Notificações Realtime

- **Data:** 2026-11-05
- **Autor / Responsável:** Gabriel Lineker (`GabrielLineker`)
- **Status:** Implementado
> ADR aprovada nunca é reescrita; cria-se nova e marca-se a anterior como substituída.

## 1. Contexto e Motivação
Na inspeção cirúrgica dos hooks do NexusClass antes da Fase 4 (`git grep -n "\.channel(" src/`), constatamos a existência de **5 canais Supabase Realtime (`postgres_changes`) dispersos em 3 hooks**:
1. `src/hooks/MuralHooks/useMural.ts` (3 canais: `realtime:mural_posts`, `realtime:atividades`, `realtime:entregas-mural`) — acoplava a subscrição WebSocket diretamente às chamadas `toast(...)` do Sonner e ao recarregamento de posts/atividades (`carregarPosts`, `carregarAtividades`).
2. `src/hooks/GerenciadorHooks/useGerenciador.ts` (1 canal: `alertas-calendario-5-min`) — acoplava a escuta de `INSERT` em `alertas_calendario` à lógica de deduplicação por `Set<string>` e ao disparo direto de `toast.warning(...)`.
3. `src/hooks/MensagensHooks/useMensagens.ts` (1 canal: `CANAL_MENSAGENS`) — acoplava a escuta de `mensagens` à reconciliação com `localStorage` e à mutação de estado de mensagens (`INSERT` e `UPDATE`).

Esse acoplamento violava o Princípio da Responsabilidade Única (SRP) e o Princípio Aberto/Fechado (OCP), tornando impossível testar unitariamente as reações a eventos em tempo real (toasts, deduplicação de alertas, refresh de listas e contadores de badges) sem instanciar ou mockar toda a cadeia fluente do cliente Supabase dentro dos componentes/hooks React.

## 2. Decisão Arquitetural
1. **Sujeito e Contrato (`src/patterns/observer/NotificacaoSubject.ts`):**
   - Definir a interface `NotificacaoObserver<E>` com o método `atualizar(evento: E): void` e o tipo discriminado `EventoNotificacaoRealtime`.
   - Implementar `NotificacaoSubject<E>` gerenciando um `Set<NotificacaoObserver<E>>`, expondo `inscrever(observer)` (que retorna uma função `() => void` para desinscrição direta no retorno do `useEffect`), `desinscrever(observer)`, `notificar(evento)` e `limparObservers()`.
2. **Observers Concretos Especializados:**
   - `ToastNotificacaoObserver`: encapsula as regras de exibição de toasts (filtragem de autoria própria no mural/atividades e deduplicação de alertas de calendário por chave `${evento_id}-${minutos_antes ?? "db"}`).
   - `StateRefreshObserver`: encapsula a reação de atualização de estado para entregas de atividades (`ENTREGA_ATIVIDADE_ATUALIZADA`) e mensagens de chat (`MENSAGEM_CHAT` com `aplicarEventoMensagemNaLista`).
   - `BadgeCounterObserver`: encapsula a contagem reativa de notificações/mensagens não lidas (`calcularTotalMensagensNaoLidas` e contador incremental de eventos destinados ao usuário).
3. **Conectores de Borda para Supabase Realtime:**
   - Extrair funções conectoras (`conectarCanaisMuralRealtime`, `conectarCanalAlertasCalendarioRealtime`, `conectarCanalMensagensRealtime`) que recebem uma interface mínima de cliente Realtime e publicam os payloads no `NotificacaoSubject`.

## 3. Alternativas Consideradas e Descartadas (Anti-Decisões)
| Alternativa | Motivo do descarte |
|:---|:---|
| Manter os 5 `supabase.channel(...)` com callbacks inline dentro dos hooks | Mantém acoplamento entre transporte WebSocket, regras de filtragem/deduplicação e UI (`sonner`), dificultando testes unitários determinísticos |
| Introduzir biblioteca externa de Event Bus / RxJS | Proibido pelas diretrizes do projeto (`AGENTS.md`): uma implementação enxuta do padrão GoF Observer em TypeScript resolve o problema sem dependências extras |
| Unificar tudo em um único canal global sempre ativo mesmo sem turma aberta | Desnecessário e prejudicial: os canais de mural/atividades/entregas dependem do filtro `turma_id=eq.${turmaId}` e só devem existir enquanto a turma estiver ativa |

## 4. Mapeamento de Arquivos
- `src/patterns/observer/NotificacaoSubject.ts`
- `src/patterns/observer/README.md`
- `src/hooks/MuralHooks/useMural.ts`
- `src/hooks/GerenciadorHooks/useGerenciador.ts`
- `src/hooks/MensagensHooks/useMensagens.ts`
- `testes/patterns/observer/notificacaoObserver.spec.ts`

## 5. Antes vs. Depois
- **Antes:** 5 canais Realtime espalhados em 3 hooks com regras de deduplicação, verificação de autoria e chamadas `toast()` embutidas nos callbacks do WebSocket.
- **Depois:** Eventos em tempo real são publicados em `NotificacaoSubject` e processados por `ToastNotificacaoObserver`, `StateRefreshObserver` e `BadgeCounterObserver` com 100% de cobertura de testes unitários em `testes/patterns/observer/notificacaoObserver.spec.ts`.

## 6. Análise de Risco e Mitigação
- **Risco:** Vazamento de observadores ou canais WebSocket ao trocar de turma ou de perfil.
- **Mitigação:** `subject.inscrever(observer)` e os conectores `conectarCanais*` retornam funções de *cleanup* invocadas no desmontar dos `useEffect` de `useMural`, `useGerenciador` e `useMensagens`.

## 7. Consequências (Trade-offs)
- **Positivas:** Testabilidade completa das regras de notificação em tempo real sem depender de WebSocket real; facilidade para acoplar novos observadores (ex.: som, log ou contador) sem alterar a origem do evento.
- **Negativas:** Adição de uma camada leve de indireção (`NotificacaoSubject`), amplamente compensada pelo desacoplamento e pela cobertura de testes.

## 8. Comandos de Rollback
`git checkout -- src/hooks/MuralHooks/useMural.ts src/hooks/GerenciadorHooks/useGerenciador.ts src/hooks/MensagensHooks/useMensagens.ts && rm -rf src/patterns/observer/NotificacaoSubject.ts testes/patterns/observer/`
