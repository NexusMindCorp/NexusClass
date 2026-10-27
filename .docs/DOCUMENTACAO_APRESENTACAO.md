# Documentação Vigente para Apresentação — NexusClass (Design Patterns + Testes)

> **Documento vivo e versionado no Git.** Atualizado a cada sessão (junto com os slides interativos em `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`) para sincronização da dupla, só com pontos-chave: o que foi escolhido, por quê, onde foi aplicado e se funcionou. Plano mestre: `PLANEJAMENTO_REFATORACAO.md`.

## 🔄 Ponto de Retomada (Handoff entre Membros / Fases)
> **Regra de Continuidade:** Antes de iniciar qualquer atualização ou nova fase, leia este bloco e o último relatório listado abaixo. Continue exatamente de onde o processo anterior parou, respeitando o planejamento e os contratos/testes já criados.

| Campo | Estado Atual |
|:---|:---|
| **Última modificação por** | **Gianlucca Paiva** (`GianluccaPaiva`) em 2026-10-27 |
| **Última etapa concluída** | **Fase 1 Concluída (Adapter + Factory nos Bots):** Implementados `GeminiAdapter` (`IAssistenteIA`) em `src/patterns/adapter/GeminiAdapter.ts` e `BotFactory` em `src/patterns/factory/BotFactory.ts`; refatorado `src/hooks/botsHooks/useChatBot.ts` sem quebrar a UI; criados 22 novos testes em `testes/patterns/` (total **4 suítes / 51 testes** passando); cobertura total de `src/lib` e `src/patterns` atingiu **100%** nas 4 dimensões. |
| **Último relatório** | `relatorios/2026-10/2026-10-27-fase-1-adapter-factory-bots.md` (Autor: Gianlucca Paiva) |
| **Fase atual / Próximo passo** | **Fase 2 (Planejado — Próximo: Gabriel Lineker / Gianlucca Paiva):** Implementar **Facade** (`EntregaAtividadeFacade`) em `src/patterns/facade/` para o subsistema de entrega de atividades (`src/hooks/AtividadesHooks/useEntregas.ts` / `BoxEntregaAtividade`), criar testes de integração com Supabase mockado na borda em `testes/patterns/facade/` e atualizar este documento + `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`. |
| **Restrições/Contratos ativos** | Globais de build já estão mockadas em `setupTests.ts`; padrões devem residir em `src/patterns/<padrao>/`; rodar `npx vitest run` e `npx tsc -b --noEmit` ao final de cada alteração de código (nunca rodar `tsc` após edições exclusivas em `.md`). |

## Painel de Progresso
| Fase | Item | Status | Responsável (Última Mod.) | Resultado |
|:---|:---|:---|:---|:---|
| 0 | Base de testes (`utils.ts` + `assetPath.ts` + `setupTests.ts`) | **Concluído** | Gabriel Lineker | 29 testes passando (2 suítes); cobertura `src/lib` saltou de **4.27%** para **98.36%** (`utils.ts` 100%) |
| 1 | Adapter + Factory (bots) | **Concluído** | Gianlucca Paiva | 51 testes passando (4 suítes); `GeminiAdapter.ts` e `BotFactory.ts` com **100%** de cobertura; `useChatBot.ts` desacoplado do SDK |
| 2 | Facade (entrega) | Planejado | a definir | — |
| 3 | Strategy (filtros) | Planejado | a definir | — |
| 4 | Observer (Realtime) | Planejado | a definir | — |
| 5 | Singleton / Proxy documentados + diagrama | Planejado | a definir | — |
| 6 | Testes de componente + E2E | Planejado | a definir | — |
| 7 | Aba de Apresentação DCC061 (`InfoAplicacao.tsx`) | **Ativo (Refinamento Visual na Fase 7)** | Gianlucca Paiva | Atualizado com dados reais da Fase 1; **pendente lapidação/correção de estilizações quebradas no fechamento (Fase 7)** |

## Métricas (antes → depois)
| Métrica | Antes (Baseline) | Pós-Fase 0 | Depois (Pós-Fase 1) |
|:---|:---|:---|:---|
| Testes automatizados | 1 arquivo (`button.spec.tsx` — 3 testes) | 2 arquivos (29 testes) | **4 arquivos (`button`, `utils`, `botFactory`, `geminiAdapter` — 51 testes)** |
| Cobertura (`src/lib` + `src/patterns`) — Stmts / Branch / Funcs / Lines | **4.27% / 0% / 4% / 4.42%** | **98.36% / 96.15% / 100% / 98.30%** | **100% / 100% / 100% / 100%** (`utils.ts`, `assetPath.ts`, `supabaseClient.ts`, `GeminiAdapter.ts` e `BotFactory.ts` em **100%**) |
| Acoplamento componente↔Supabase/Gemini | Direto nos hooks | Direto nos hooks | **`useChatBot.ts` desacoplado via `IAssistenteIA` (`GeminiAdapter`) + `BotFactory`** |

## Registro por Padrão / Teste

### Fase 0 — Testes Unitários Determinísticos (`src/lib/utils.ts` & `assetPath.ts`) + Test Harness (`setupTests.ts`)
- **Implementado por:** Gabriel Lineker (`GabrielLineker`)
- **Por que foi escolhido:** Construir a base da Pirâmide de Testes (Nível 2 RBT) antes de refatorar hooks acoplados nas Fases 1 a 4, garantindo determinismo e isolando variáveis globais de build (`__URL_SUPABASE__`, `__KEY_SUPABASE__`, `__API_GEMINI_KEY__`, `__APP_VERSION__`, `__BASE_URL__`).
- **Onde foi aplicado:** `setupTests.ts`, `testes/lib/utils.spec.ts`, `vite.config.ts` (filtro `*.{ts,tsx}` e reporter HTML na cobertura) e `src/components/InfoAplicacao.tsx` + `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`.
- **Antes vs. depois:** Antes, `src/lib/utils.ts` tinha apenas `cn()` exercitado indiretamente (4.27% de statements) e qualquer função temporal dependia do relógio real da máquina. Depois, todas as 25 funções de `utils.ts` + `getAssetPath` possuem testes determinísticos cobrindo caminhos felizes, limites de prazo e blocos `catch`.
- **Como contribui para qualidade/manutenção/testabilidade:**
  - **Fake Timers (`vi.useFakeTimers`):** Congela o tempo para testar `isDataEntregaFutura`, `comparaDataHj`, `formatarDataRelativa` e `formatarDataUltimaMensagem` sem falsos negativos na virada do dia.
  - **Análise de Valor Limite:** Garante precisão na validação de prazos de entrega (ontem, instante exato e amanhã).
  - **Particionamento de Equivalência & Tabela de Decisão:** Valida `extrairUrlsAnexo`, `obterNomeArquivoDoUrl` e todos os códigos PostgreSQL de `formatarErroSupabase` (`PGRST205`, `42P01`, `42501`, genéricos).
  - **Tolerância a Falhas:** Injeção de JSON corrompido no `localStorage` e simulação de ausência de `window` (SSR guard).
- **Funcionou?** **Sim** — 2 suítes / 29 testes passando; cobertura de `utils.ts` e `assetPath.ts` atingiu **100%** em Statements, Branches, Functions e Lines.
- **Lições / trade-offs:** O filtro de cobertura do `@vitest/coverage-v8` em `vite.config.ts` tentava fazer parse AST dos arquivos `README.md` dentro de `src/patterns/**`; restringir o glob para `src/{lib,patterns}/**/*.{ts,tsx}` eliminou os avisos do Rollup.

### Fase 1 — Padrões Adapter (`GeminiAdapter`) + Factory (`BotFactory`) nos Assistentes IA (Tigreso & Falcão Peregrino)
- **Implementado por:** Gianlucca Paiva (`GianluccaPaiva`)
- **Por que foi escolhido:** O hook `src/hooks/botsHooks/useChatBot.ts` instanciava `new GoogleGenerativeAI(__API_GEMINI_KEY__)` diretamente no topo do módulo e concentrava a montagem condicional de prompts (`JsonInstruction`) para dois assistentes distintos (**Tigreso** e **Falcão Peregrino**), o loop de *Function Calling* (4 ferramentas do Supabase) e o *retry* exponencial de erro HTTP `503`. Era impossível testar o hook ou os bots sem acesso à rede e sem gastar cota da API Gemini.
- **Onde foi aplicado:** `src/patterns/adapter/GeminiAdapter.ts`, `src/patterns/factory/BotFactory.ts`, `src/hooks/botsHooks/useChatBot.ts`, `src/hooks/botsHooks/type.ts`, `testes/patterns/factory/botFactory.spec.ts` e `testes/patterns/adapter/geminiAdapter.spec.ts`.
- **Antes vs. depois:**
  - **Antes:** `useChatBot.ts` tinha 282 linhas acopladas ao SDK `@google/generative-ai` e `0%` de testes automatizados.
  - **Depois:** `useChatBot.ts` ficou enxuto (116 linhas), gerenciando apenas o estado React (`messages`, `loading`) e consumindo o contrato `IAssistenteIA` criado pela `BotFactory`.
- **Como contribui para qualidade/manutenção/testabilidade:**
  - **Testes Unitários Puros na Factory (`botFactory.spec.ts` — 13 testes, Nível 2 RBT):** Valida por Tabela de Decisão a geração determinística de `JsonInstruction` para `tigreso` (com *easter egg* e *tools*) e `falcao` (com Acordo de Uso), além da formatação de inscrições por papel (`aluno` com/sem matérias, `professor` com/sem matérias, `master` e perfil nulo).
  - **Testes de Fronteira no Adapter (`geminiAdapter.spec.ts` — 9 testes, Nível 3 RBT):** Valida a resolução multi-turno de *Function Calling* (`obterEventosCalendario`, `obterDuvidasEstudante`, `obterAtividadesAbertas`, `obterPostsProfessor`), o *backoff* exponencial em falhas `503` / `"high demand"` usando `vi.useFakeTimers()` (sem espera real) e a integração de `useGeminiChat` com um `FakeAssistenteIA` em memória.
- **Funcionou?** **Sim** — **4 suítes / 51 testes passando** em ~2.1s; `GeminiAdapter.ts` e `BotFactory.ts` atingiram **100%** de cobertura em Statements, Branches, Functions e Lines.
- **Lições / trade-offs:** Em vez de substituir o SDK por `fetch` manual (como sugerido no rascunho inicial `AnaliseDePossiveisDP.md`, que perderia suporte nativo a `ChatSession` e `functionDeclarations`), encapsular o SDK dentro do `GeminiAdapter` com injeção opcional de `IGeminiSdkClient` preservou 100% das capacidades de *Function Calling* do Tigreso enquanto tornou os testes instantâneos e determinísticos.

## Diário de Sessões
| Data | Autor | Resumo |
|:---|:---|:---|
| 2026-10-19 | Gabriel Lineker (`GabrielLineker`) | Análise inicial dos 3 documentos; temas definidos (Design Patterns + Testes); `.agents/` inicializado; plano criado. Decisões: refatorar na `DesiningTeste`; descartar Template Method; Singleton e Proxy de proteção apenas documentados (já existem no código). |
| 2026-10-19 (2) | Gabriel Lineker (`GabrielLineker`) | Renomeado `.agent` → `.agents`. ADR-001 aprovado: padrões em `src/patterns/` (README por padrão) e cobertura v8 instalada (baseline 4.27% de statements em `src/lib`). Análise de viabilidade do E2E com Supabase local em Docker (espaço em disco) em andamento. |
| 2026-10-24 | Gabriel Lineker (`GabrielLineker`) | Pastas `.agents/`, `.docs/`, `relatorios/` e `AGENTS.md` liberadas no `.gitignore` para controle de versão da dupla (com limpeza via `git rm --cached` prevista no fechamento). Implementado protocolo de Handoff entre fases e identificação obrigatória de autoria. |
| 2026-10-24 (2) | Gabriel Lineker (`GabrielLineker`) | **Fase 0 concluída:** `setupTests.ts` configurado com `vi.stubGlobal`; criados 26 testes em `testes/lib/utils.spec.ts` elevando a cobertura de `src/lib` de **4.27%** para **98.36%** (`utils.ts` 100%). Criada apresentação interativa de **Engenharia de Software (DCC061)** na aba Informações (`InfoAplicacao.tsx`) com seletor de disciplina, catálogo interativo de Design Patterns (Antes vs. Depois) e painel de cobertura. |
| 2026-10-27 | Gianlucca Paiva (`GianluccaPaiva`) | **Fase 1 concluída:** Criados `ADR-002` e spec da Fase 1; implementados `GeminiAdapter` (`IAssistenteIA`) em `src/patterns/adapter/GeminiAdapter.ts` e `BotFactory` em `src/patterns/factory/BotFactory.ts`; refatorado `src/hooks/botsHooks/useChatBot.ts` sem regressão; criados 22 novos testes em `testes/patterns/` (total 4 suítes / 51 testes passando, **100%** de cobertura em `src/lib` e `src/patterns`). Atualizados slides interativos em `configEngenhariaSoftware.ts`. |

## Pontos para a Apresentação (15–20 min)
- Parte 1: documento-texto (2 temas). Parte 2: demo do código (antes/depois + testes rodando + aba *Informações → Engenharia de Software (DCC061)* dentro da própria aplicação).
- Mencionar: o risco do overengineering e por que descartamos padrões (*Template Method*).
