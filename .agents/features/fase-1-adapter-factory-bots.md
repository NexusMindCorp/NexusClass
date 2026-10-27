# Feature: Fase 1 — Padrões Adapter + Factory nos Assistentes IA (Tigreso & Falcão Peregrino)

- **Registro:** 2026-10-27
- **Autor / Responsável:** Gianlucca Paiva (`GianluccaPaiva`)
- **Status:** Concluído
- **Risco (RBT):** Nível 2 (`BotFactory` — lógica pura e determinística) | Nível 3 (`GeminiAdapter` + `useGeminiChat` — fronteira com SDK externo e Function Calling)
- **Validação:** `npx tsc -b --noEmit` + `npx vitest run testes/patterns/ --silent` + `npm run test:coverage`

## 1. Visão Geral
1. **Padrão Factory (`src/patterns/factory/BotFactory.ts`):** Centralizar a criação da configuração de instruções de sistema (`JsonInstruction` / `systemInstruction`), parâmetros do modelo (`ConfigBot`) e da instância de `IAssistenteIA` para os dois assistentes da plataforma: **Tigreso** (`tipo = 'tigreso'`, tutor acadêmico com *Function Calling* e *easter egg*) e **Falcão Peregrino** (`tipo = 'falcao'`, assistente de Acordo de Uso e Termos da Plataforma).
2. **Padrão Adapter (`src/patterns/adapter/GeminiAdapter.ts`):** Definir o contrato de domínio `IAssistenteIA` e encapsular o SDK `@google/generative-ai` (`GoogleGenerativeAI`, `ChatSession`, loop de *Function Calling* das 4 ferramentas de dados escolares e *retry* exponencial em HTTP `503` / `"high demand"`).
3. **Desacoplamento de `useChatBot.ts` (`src/hooks/botsHooks/useChatBot.ts`):** Refatorar o hook `useGeminiChat` para consumir `BotFactory` e `IAssistenteIA` (permitindo injeção opcional de um assistente fake em testes), eliminando o acoplamento direto com `new GoogleGenerativeAI(__API_GEMINI_KEY__)`.
4. **Suíte de Testes Automatizados (`testes/patterns/`):** Criar testes unitários puros para `BotFactory` (`testes/patterns/factory/botFactory.spec.ts` — 13 testes) e testes de fronteira com SDK mockado e `vi.useFakeTimers()` para `GeminiAdapter` e `useGeminiChat` (`testes/patterns/adapter/geminiAdapter.spec.ts` — 9 testes).

## 2. Não-Objetivos (Non-Goals)
- Não alterar a interface visual nem textos de `src/components/ChatBot.tsx` ou `src/hooks/botsHooks/useChatBox.ts`.
- Não alterar nenhum prompt, regra de escopo, resumo de acordo de uso ou *easter egg* existentes de Tigreso e Falcão Peregrino.
- Não alterar as queries ao Supabase em `src/hooks/botsHooks/carregamentoDados.ts`.

## 3. UI/UX (consistência arquitetural)
- O comportamento observável pelo usuário (abertura do chat, troca entre Tigreso e Falcão Peregrino via `abrirComAjuda`, exibição de loading e mensagens de erro 503 ou genéricas) permanece 100% idêntico.
- Atualização dos dados da aba interativa *Informações → Engenharia de Software (DCC061)* em `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`.

## 4. Acessibilidade
- Nenhuma alteração em elementos de interface ou atributos ARIA de `ChatBot.tsx`.

## 5. Desempenho e Segurança
- A chave `__API_GEMINI_KEY__` permanece restrita à criação padrão do cliente no `GeminiAdapter`, nunca exposta em logs ou testes (que usam o stub global de `setupTests.ts` ou mocks injetados).
- O *backoff* exponencial em erros `503` (`DELAY_BASE * 2^attempt` até `MAX_RETRIES`) é preservado e testado deterministicamente com Fake Timers.

## 6. Arquivos Tocados
- `.agents/features/fase-1-adapter-factory-bots.md` (novo)
- `.agents/decisions/adr-002-adapter-factory-assistentes-ia.md` (novo)
- `.agents/INICIALIZACAO.md`
- `src/patterns/adapter/GeminiAdapter.ts` (novo)
- `src/patterns/adapter/README.md`
- `src/patterns/factory/BotFactory.ts` (novo)
- `src/patterns/factory/README.md`
- `src/hooks/botsHooks/type.ts`
- `src/hooks/botsHooks/useChatBot.ts`
- `testes/patterns/factory/botFactory.spec.ts` (novo)
- `testes/patterns/adapter/geminiAdapter.spec.ts` (novo)
- `.docs/DOCUMENTACAO_APRESENTACAO.md`
- `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`
- `relatorios/2026-10/2026-10-27-fase-1-adapter-factory-bots.md` (novo)

## 7. Matriz de Risco
| Componente/Alvo | Nível RBT | Estratégia |
|:---|:---|:---|
| `src/patterns/factory/BotFactory.ts` | Nível 2 (Lógica Pura) | Testes unitários determinísticos validando `instructionJson`, papéis (`aluno`, `professor`, `master`, nulo) e configurações de Tigreso e Falcão |
| `src/patterns/adapter/GeminiAdapter.ts` | Nível 3 (Fronteira Externa) | Testes unitários com mock na borda do SDK `@google/generative-ai`, validando *Function Calling* multi-turno e *retry* 503 com `vi.useFakeTimers()` |
| `src/hooks/botsHooks/useChatBot.ts` | Nível 3 (Integração Hook + Padrões) | Testes com `FakeAssistenteIA` validando fluxo de mensagens, loading, troca de modo (`isHelpMode`) e tratamento de erros 503/genéricos |

## 8. Validação
- [x] Typecheck (`npx tsc -b --noEmit`)
- [x] Testes da feature (`npx vitest run testes/patterns/ --silent`)
- [x] Sem regressão (`npx vitest run` e `npm run test:coverage` — 4 suítes / 51 testes passando, 100% de cobertura em `src/lib` e `src/patterns`)
- [x] `.docs/DOCUMENTACAO_APRESENTACAO.md` e `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts` atualizados

## 9. Procedimento de Rollback
Reverter `src/hooks/botsHooks/useChatBot.ts` e `src/hooks/botsHooks/type.ts`, e remover `src/patterns/adapter/GeminiAdapter.ts`, `src/patterns/factory/BotFactory.ts`, `testes/patterns/adapter/geminiAdapter.spec.ts` e `testes/patterns/factory/botFactory.spec.ts`.
