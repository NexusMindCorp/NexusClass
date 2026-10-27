# ADR-002: Padrões Adapter (`GeminiAdapter`) e Factory (`BotFactory`) para os Assistentes IA

- **Data:** 2026-10-27
- **Autor / Responsável:** Gianlucca Paiva (`GianluccaPaiva`)
- **Status:** Implementado
> ADR aprovada nunca é reescrita; cria-se nova e marca-se a anterior como substituída.

## 1. Contexto e Motivação
No código original (`src/hooks/botsHooks/useChatBot.ts`), o hook `useGeminiChat` instanciava diretamente `new GoogleGenerativeAI(__API_GEMINI_KEY__)` no escopo de módulo e concentrava três responsabilidades distintas:
1. Montagem condicional das instruções de sistema (`JsonInstruction`) e contexto de perfil/matérias para dois assistentes diferentes (**Tigreso** e **Falcão Peregrino**).
2. Comunicação direta com o SDK `@google/generative-ai`, incluindo extração e execução recursiva de `functionCalls` (`obterEventosCalendario`, `obterDuvidasEstudante`, `obterAtividadesAbertas`, `obterPostsProfessor`) e *retry* exponencial para erros HTTP `503`.
3. Gerenciamento de estado React (`messages`, `loading`).

Esse acoplamento impedia testar o chatbot sem rede ou chave real de API e violava os princípios de Responsabilidade Única (SRP) e Inversão de Dependência (DIP).

## 2. Decisão Arquitetural
1. **Contrato `IAssistenteIA` e `GeminiAdapter` (`src/patterns/adapter/GeminiAdapter.ts`):**
   - Criar a interface `IAssistenteIA` com o método `enviarMensagem(texto: string): Promise<string>`.
   - Implementar `GeminiAdapter` encapsulando o SDK oficial `@google/generative-ai` (`getGenerativeModel`, `startChat`), o loop de *Function Calling* via mapa de *handlers* injetado (`BotToolHandlers`) e a política de *retry* com *backoff* exponencial para erros `503` / `"high demand"`.
2. **Fábrica `BotFactory` (`src/patterns/factory/BotFactory.ts`):**
   - Centralizar a criação da configuração (`BotFactory.criarConfig`) e da instância do assistente (`BotFactory.criarAssistente`) a partir do discriminador `TipoBot = 'tigreso' | 'falcao'` (ou booleano `isHelpMode`), encapsulando a construção do `JsonInstruction`, do resumo de perfil e das matérias por papel (`aluno`, `professor`, `master`).
3. **Injeção Opcional no Hook (`useGeminiChat`):**
   - Permitir injetar uma instância customizada/fake de `IAssistenteIA` via `UseGeminiChatProps` para testes determinísticos do hook, usando `BotFactory.criarAssistente` por padrão em produção.

## 3. Alternativas Consideradas e Descartadas (Anti-Decisões)
| Alternativa | Motivo do descarte |
|:---|:---|
| Usar `fetch` manual na REST API do Gemini (como sugerido no rascunho `AnaliseDePossiveisDP.md`) | Perderia a tipagem e o suporte nativo a `ChatSession` e `functionDeclarations` do SDK `@google/generative-ai` já instalado no projeto |
| Manter o loop de *Function Calling* dentro do hook React `useChatBot.ts` | Vazaria detalhes do protocolo da Google (`functionCalls()`, `candidates[0].content.parts`, `functionResponse`) para a camada de UI/Hook |
| Criar hierarquia de herança complexa (`AbstractBot extends ...`) | Overengineering desnecessário; `Tigreso` e `Falcão Peregrino` compartilham o mesmo motor (`GeminiAdapter`) e diferem apenas na configuração e ferramentas providas pela `BotFactory` |

## 4. Mapeamento de Arquivos
- `src/patterns/adapter/GeminiAdapter.ts`
- `src/patterns/factory/BotFactory.ts`
- `src/hooks/botsHooks/useChatBot.ts`
- `src/hooks/botsHooks/type.ts`
- `testes/patterns/adapter/geminiAdapter.spec.ts`
- `testes/patterns/factory/botFactory.spec.ts`

## 5. Antes vs. Depois
- **Antes:** `useChatBot.ts` (282 linhas) instanciava `GoogleGenerativeAI` globalmente, construía prompts por ternário gigante e executava `while (functionCalls)` + `callGeminiWithRetry` internamente; `0%` de testes nos bots.
- **Depois:** `useChatBot.ts` enxuto gerencia apenas o estado React e delega a criação para `BotFactory` e a comunicação para `IAssistenteIA` (`GeminiAdapter`); cobertura automatizada de Nível 2 e 3 RBT sem chamadas de rede.

## 6. Análise de Risco e Mitigação
- **Risco:** Divergência sutil nos prompts ou na resposta de erro exibida ao usuário quando o serviço falha.
- **Mitigação:** Preservação literal dos textos de `instructionJson` e das mensagens de erro (`503` vs. `Erro ${code}: ${message}`), validada por testes automatizados.

## 7. Consequências (Trade-offs)
- **Positivas:** Desacoplamento total do SDK da Google; testes de *retry* 503 rodam em milissegundos com `vi.useFakeTimers()`; fácil adição de um terceiro bot na `BotFactory`.
- **Negativas:** Adição de dois novos módulos em `src/patterns/` (custo mínimo e previsto no ADR-001).

## 8. Comandos de Rollback
`git checkout -- src/hooks/botsHooks/useChatBot.ts src/hooks/botsHooks/type.ts && rm -rf src/patterns/adapter/GeminiAdapter.ts src/patterns/factory/BotFactory.ts testes/patterns/`
