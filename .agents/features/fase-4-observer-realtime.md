# Feature: Fase 4 — Padrão Observer para Centralização de Eventos e Notificações Realtime (`NotificacaoSubject`)

- **Registro:** 2026-11-05
- **Autor / Responsável:** Gabriel Lineker (`GabrielLineker`)
- **Status:** Concluído
- **Risco (RBT):** Nível 3 (`NotificacaoSubject`, Observers concretos e conectores de borda Supabase Realtime + integração com `useMural`, `useGerenciador` e `useMensagens`)
- **Validação:** `npx tsc -b --noEmit` + `npx vitest run testes/patterns/observer/ --silent` + `npm run test:coverage`

## 1. Visão Geral
1. **Padrão Observer (`src/patterns/observer/NotificacaoSubject.ts`):**
   - Definir o contrato `NotificacaoObserver<E>` com o método `atualizar(evento: E): void` e a união discriminada `EventoNotificacaoRealtime` representando os 5 eventos de banco em tempo real do sistema:
     - `NOVO_POST_MURAL` (`INSERT` na tabela `mural_posts`)
     - `NOVA_ATIVIDADE_TURMA` (`INSERT` na tabela `atividades`)
     - `ENTREGA_ATIVIDADE_ATUALIZADA` (`*` na tabela `entregas_atividades`)
     - `ALERTA_CALENDARIO` (`INSERT` na tabela `alertas_calendario`)
     - `MENSAGEM_CHAT` (`INSERT` / `UPDATE` na tabela `mensagens`)
   - Implementar a classe `NotificacaoSubject<E>` com gerenciamento de inscrições (`inscrever` com retorno de função `unsubscribe` para cleanup do `useEffect`, `desinscrever`, `notificar`, `limparObservers`, `totalObservers`) e instância compartilhada `notificacaoSubject`.
   - Implementar 3 Observers concretos desacoplados:
     - `ToastNotificacaoObserver`: reage a `NOVO_POST_MURAL`, `NOVA_ATIVIDADE_TURMA` (ignorando eventos emitidos pelo próprio autor/professor) e `ALERTA_CALENDARIO` (com deduplicação via `Set<string>` por `${evento_id}-${minutos_antes ?? "db"}`), disparando notificações via Sonner (`toast` / `toast.warning`).
     - `StateRefreshObserver`: reage a `ENTREGA_ATIVIDADE_ATUALIZADA` (acionando recarregamento de atividades da turma para o aluno) e `MENSAGEM_CHAT` (normalizando status de leitura via `Set` de IDs lidos e atualizando a lista de mensagens em `INSERT` e `UPDATE` sem duplicatas).
     - `BadgeCounterObserver`: observa eventos destinados ao usuário e contabiliza pendências/mensagens não lidas (`calcularTotalMensagensNaoLidas`).
   - Implementar conectores de borda para o Supabase Realtime (`conectarCanaisMuralRealtime`, `conectarCanalAlertasCalendarioRealtime`, `conectarCanalMensagensRealtime`) que traduzem `postgres_changes` em chamadas `subject.notificar(evento)`.
2. **Refatoração dos Hooks Consumidores (`useMural.ts`, `useGerenciador.ts`, `useMensagens.ts`):**
   - Substituir a lógica acoplada de canais/toasts/mutações inline nos 3 hooks pelo `NotificacaoSubject` e seus Observers, preservando 100% do comportamento de UI.
3. **Suíte de Testes Automatizados (`testes/patterns/observer/notificacaoObserver.spec.ts`):**
   - Criar testes unitários e de fronteira (Nível 3 RBT) validando ciclo de vida de inscrições, disparo para múltiplos observadores, deduplicação de alertas, filtragem de autoria em toasts, atualização imutável de mensagens, contagem de badges e integração com canais Realtime mockados.

## 2. Não-Objetivos (Non-Goals)
- Não alterar textos dos toasts existentes (`"O mural foi atualizado!"`, `"Novas atividades!"`, `"Um evento comeca em 5 minutos."`) nem a duração ou botões de ação (`"Carregar"`).
- Não alterar o schema das tabelas do Supabase/PostgreSQL (`mural_posts`, `atividades`, `entregas_atividades`, `alertas_calendario`, `mensagens`).

## 3. UI/UX (consistência arquitetural)
- Comportamento visual idêntico nos avisos Sonner do Mural, nos alertas de 5 minutos do Calendário e na atualização em tempo real do Chat de Mensagens.
- Atualização dos slides interativos de Engenharia de Software em `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`.

## 4. Acessibilidade
- Nenhuma alteração nos componentes visuais ou regiões ARIA de notificações (`Toaster` do Sonner).

## 5. Desempenho e Segurança
- `NotificacaoSubject.notificar` itera sobre um snapshot (`Array.from(this.observers)`), garantindo segurança caso um observer se desinscreva durante a notificação.
- Funções de cleanup removem tanto o observer inscrito quanto o canal WebSocket do Supabase no desmontar do `useEffect`, prevenindo *memory leaks* e notificações duplicadas.

## 6. Arquivos Tocados
- `.agents/features/fase-4-observer-realtime.md` (novo)
- `.agents/decisions/adr-006-observer-notificacoes-realtime.md` (novo)
- `.agents/INICIALIZACAO.md`
- `src/patterns/observer/NotificacaoSubject.ts` (novo)
- `src/patterns/observer/README.md`
- `src/hooks/MuralHooks/useMural.ts`
- `src/hooks/GerenciadorHooks/useGerenciador.ts`
- `src/hooks/MensagensHooks/useMensagens.ts`
- `testes/patterns/observer/notificacaoObserver.spec.ts` (novo)
- `.docs/DOCUMENTACAO_APRESENTACAO.md`
- `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`
- `relatorios/2026-11/2026-11-05-fase-4-observer-realtime.md` (novo)

## 7. Matriz de Risco
| Componente/Alvo | Nível RBT | Estratégia |
|:---|:---|:---|
| `NotificacaoSubject` (`inscrever`, `desinscrever`, `notificar`, `limparObservers`) | Nível 2 / Nível 3 | Testes unitários validando broadcast 1-para-N, retorno de `unsubscribe` e remoção segura |
| `ToastNotificacaoObserver`, `StateRefreshObserver`, `BadgeCounterObserver` | Nível 3 (Mocks/Spies de borda) | Testes por Tabela de Decisão cobrindo filtro de próprio autor (`autorId === usuarioId`), deduplicação de alertas (`evento_id-minuto`), `INSERT`/`UPDATE` de mensagens e cálculo de não lidas |
| Conectores Realtime (`conectarCanaisMuralRealtime`, `conectarCanalAlertasCalendarioRealtime`, `conectarCanalMensagensRealtime`) | Nível 3 (Fronteira Supabase Realtime) | Testes com fake/mock de `channel().on().subscribe()` e `removeChannel()`, simulando eventos `postgres_changes` |

## 8. Validação
- [x] Typecheck (`npx tsc -b --noEmit`)
- [x] Testes da feature (`npx vitest run testes/patterns/observer/ --silent`)
- [x] Sem regressão (`npx vitest run` e `npm run test:coverage` — 7 suítes / 89 testes passando, 100% de cobertura em `src/lib` e `src/patterns`)
- [x] `.docs/DOCUMENTACAO_APRESENTACAO.md` e `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts` atualizados

## 9. Procedimento de Rollback
Reverter `src/hooks/MuralHooks/useMural.ts`, `src/hooks/GerenciadorHooks/useGerenciador.ts` e `src/hooks/MensagensHooks/useMensagens.ts`, e remover `src/patterns/observer/NotificacaoSubject.ts` e `testes/patterns/observer/notificacaoObserver.spec.ts`.
