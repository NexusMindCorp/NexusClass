# Documentação Vigente para Apresentação — NexusClass (Design Patterns + Testes)

> **Documento vivo e versionado no Git.** Atualizado a cada sessão (junto com os slides interativos em `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`) para sincronização da dupla, só com pontos-chave: o que foi escolhido, por quê, onde foi aplicado e se funcionou. Plano mestre: `PLANEJAMENTO_REFATORACAO.md`.

## 🔄 Ponto de Retomada (Handoff entre Membros / Fases)
> **Regra de Continuidade:** Antes de iniciar qualquer atualização ou nova fase, leia este bloco e o último relatório listado abaixo. Continue exatamente de onde o processo anterior parou, respeitando o planejamento e os contratos/testes já criados.

| Campo | Estado Atual |
|:---|:---|
| **Última modificação por** | **Gabriel Lineker** (`GabrielLineker`) em 2026-11-05 |
| **Última etapa concluída** | **Fase 4 Concluída (Padrão Observer — `NotificacaoSubject`):** Implementado `NotificacaoSubject`, `ToastNotificacaoObserver`, `StateRefreshObserver`, `BadgeCounterObserver` e conectores Realtime em `src/patterns/observer/NotificacaoSubject.ts`, centralizando e desacoplando os 5 canais Supabase Realtime em `useMural.ts` (`mural_posts`, `atividades`, `entregas_atividades`), `useGerenciador.ts` (`alertas_calendario`) e `useMensagens.ts` (`mensagens`). Criados 11 novos testes em `testes/patterns/observer/notificacaoObserver.spec.ts` (**7 suítes / 89 testes** passando e **100%** de cobertura em `src/lib` e `src/patterns`). |
| **Último relatório** | `relatorios/2026-11/2026-11-05-fase-4-observer-realtime.md` (Autor: Gabriel Lineker) |
| **Fase atual / Próximo passo** | **Trilha DCC061 — Fase 5 (Planejado — Próximo: Gabriel Lineker / Gianlucca Paiva):** Documentar formalmente o **Singleton** (`src/lib/supabaseClient.ts`) e o **Protection Proxy** (`ProtectedRoute` / `BoxRestrito`) em `src/patterns/singleton/` e `src/patterns/proxy/`, atualizar o diagrama de classes `out/diagramas/diagrama_classes_detalhado.puml` com estereótipos dos padrões e atualizar este documento + `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`. |
| **Restrições/Contratos ativos** | Subir banco Docker com `docker compose --env-file .env -f docker/structure/docker-compose.yml up -d`; globais de build já estão mockadas em `setupTests.ts`; padrões devem residir em `src/patterns/<padrao>/`; rodar `npx vitest run` e `npx tsc -b --noEmit` ao final de cada alteração de código (nunca rodar `tsc` após edições exclusivas em `.md`). |

## Painel de Progresso
| Fase | Item | Status | Responsável (Última Mod.) | Resultado |
|:---|:---|:---|:---|:---|
| 0 | Base de testes (`utils.ts` + `assetPath.ts` + `setupTests.ts`) | **Concluído** | Gabriel Lineker | 29 testes passando (2 suítes); cobertura `src/lib` saltou de **4.27%** para **98.36%** (`utils.ts` 100%) |
| 1 | Adapter + Factory (bots) | **Concluído** | Gianlucca Paiva | 51 testes passando (4 suítes); `GeminiAdapter.ts` e `BotFactory.ts` com **100%** de cobertura; `useChatBot.ts` desacoplado do SDK |
| 2 | Facade (entrega) | **Concluído** | Gabriel Lineker | 66 testes passando (5 suítes); `EntregaAtividadeFacade.ts` com **100%** de cobertura; `useEntregas.ts` desacoplado de Storage+DB |
| 3 | Strategy (filtros) | **Concluído** | Gianlucca Paiva | 78 testes passando (6 suítes); `FiltroStrategy.ts` com **100%** de cobertura; condicionais e duplicações removidas de `Pesquisar`, `DuvidasBox` e `AppSidebar` |
| 4 | Observer (Realtime) | **Concluído** | Gabriel Lineker | 89 testes passando (7 suítes); `NotificacaoSubject.ts` com **100%** de cobertura; 5 canais Realtime desacoplados em `useMural`, `useGerenciador` e `useMensagens` |
| 5 | Singleton / Proxy documentados + diagrama | Planejado | a definir | — |
| 6 | Testes de componente + E2E | Planejado | a definir | — |
| 7 | Aba de Apresentação DCC061 (`InfoAplicacao.tsx`) | **Ativo (Refinamento Visual na Fase 7)** | Gabriel Lineker | Atualizado com dados reais da Fase 4; **pendente lapidação/correção de estilizações quebradas no fechamento (Fase 7)** |

## Métricas (antes → depois)
| Métrica | Antes (Baseline) | Pós-Fase 0 | Pós-Fase 1 | Pós-Fase 2 | Pós-Fase 3 | Depois (Pós-Fase 4) |
|:---|:---|:---|:---|:---|:---|:---|
| Testes automatizados | 1 arquivo (`button.spec.tsx` — 3 testes) | 2 arquivos (29 testes) | 4 arquivos (51 testes) | 5 arquivos (66 testes) | 6 arquivos (78 testes) | **7 arquivos (`button`, `utils`, `botFactory`, `geminiAdapter`, `entregaAtividadeFacade`, `filtroStrategy`, `notificacaoObserver` — 89 testes)** |
| Cobertura (`src/lib` + `src/patterns`) — Stmts / Branch / Funcs / Lines | **4.27% / 0% / 4% / 4.42%** | **98.36% / 96.15% / 100% / 98.30%** | **100% / 100% / 100% / 100%** | **100% / 100% / 100% / 100%** | **100% / 100% / 100% / 100%** | **100% / 100% / 100% / 100%** (`utils.ts`, `assetPath.ts`, `supabaseClient.ts`, `GeminiAdapter.ts`, `BotFactory.ts`, `EntregaAtividadeFacade.ts`, `FiltroStrategy.ts` e `NotificacaoSubject.ts` em **100%**) |
| Acoplamento componente↔Supabase/Gemini/Regras | Direto nos hooks/componentes | Direto nos hooks/componentes | `useChatBot.ts` desacoplado via `IAssistenteIA` + `BotFactory` | `useChatBot.ts` + `useEntregas.ts` desacoplados | `useChatBot.ts`, `useEntregas.ts`, `usePesquisa.ts` e `useDuvidas.ts` desacoplados | **`useChatBot.ts`, `useEntregas.ts`, `usePesquisa.ts`, `useDuvidas.ts`, `useMural.ts`, `useGerenciador.ts` e `useMensagens.ts` desacoplados via `GeminiAdapter`, `BotFactory`, `EntregaAtividadeFacade`, `FiltroStrategy` e `NotificacaoSubject`** |

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

### Fase 2 — Padrão Facade (`EntregaAtividadeFacade`) no Subsistema de Entregas e Avaliação
- **Implementado por:** Gabriel Lineker (`GabrielLineker`)
- **Por que foi escolhido:** O hook `src/hooks/EntregasHooks/useEntregas.ts` coordenava diretamente dois subsistemas distintos do Supabase — o bucket de arquivos `supabase.storage.from("entregas_atividades")` e a tabela relacional `supabase.from("entregas_atividades")` — misturando higienização de nome de arquivo (`replace(/[^a-zA-Z0-9.-]/g, "_")`), geração de caminho hierárquico, `UPSERT` com `onConflict: "atividade_id,aluno_id"`, normalização do join `perfis` (`aluno_nome`), avaliação docente e links temporários assinados (`createSignedUrl`), além de usar tipagem `any`.
- **Onde foi aplicado:** `src/patterns/facade/EntregaAtividadeFacade.ts`, `src/patterns/facade/README.md`, `src/hooks/EntregasHooks/useEntregas.ts`, `src/hooks/EntregasHooks/type.ts` e `testes/patterns/facade/entregaAtividadeFacade.spec.ts`.
- **Antes vs. depois:**
  - **Antes:** `useEntregas.ts` (152 linhas) fazia chamadas encadeadas diretas a `supabase.storage` e `supabase.from("entregas_atividades")`, possuía 4 usos de `any` e `0%` de testes automatizados.
  - **Depois:** `EntregaAtividadeFacade` encapsula toda a coordenação entre Storage e PostgreSQL com tipagem estrita (`IEntregaAtividadeFacade`, `IEntregaSupabaseClient`); `useEntregas.ts` cuida apenas do estado React e dos toasts (`sonner`), aceitando injeção opcional da fachada para testes sem rede.
- **Como contribui para qualidade/manutenção/testabilidade:**
  - **Testes Unitários Puros (Nível 2 RBT — 3 testes):** Valida `higienizarNomeArquivo`, `construirCaminhoArquivo` e `normalizarEntregasComPerfis` (tratando `perfis` como objeto, array ou nulo → `"Aluno Anônimo"`).
  - **Testes de Fronteira e Integração (Nível 3 RBT — 12 testes):** Valida o fluxo atômico `upload` + `upsert` (`onConflict: "atividade_id,aluno_id"`), garante que uma falha no Storage aborta a operação antes de gravar no banco, testa consultas por papel (`aluno` vs. `professor`), avaliação docente, `createSignedUrl` e o comportamento completo do hook `useEntregas` com `FakeEntregaFacade` e `toast`.
- **Funcionou?** **Sim** — **5 suítes / 66 testes passando**; `EntregaAtividadeFacade.ts` atingiu **100%** de cobertura em Statements, Branches, Functions e Lines.
- **Lições / trade-offs:** Descartamos os erros do rascunho `AnaliseDePossiveisDP.md` (que citava bucket `arquivos_atividades`, tabela `entregas`, `getPublicUrl` e chamada artificial de IA) e modelamos a fachada fielmente sobre o bucket e tabela reais `entregas_atividades` e `createSignedUrl(caminho, 3600)`.

### Fase 3 — Padrão Strategy (`FiltroStrategy`) nos Filtros de Pesquisa de Turmas e Central de Dúvidas
- **Implementado por:** Gianlucca Paiva (`GianluccaPaiva`)
- **Por que foi escolhido:** Os critérios de filtragem de turmas (`Inscritas`, `Disponíveis`, `Todas` + busca textual por matéria, professor, sala e código) estavam divididos entre `usePesquisa.ts` e blocos `if` dentro de `Pesquisar.tsx`. Na Central de Dúvidas, a filtragem por papel (`master`, `professor`, `aluno`) e por status (`todas`, `pendentes`, `resolvidas`) estava acoplada em `DuvidasBox.tsx` e duplicada em `AppSidebar.tsx` para calcular o badge de pendências.
- **Onde foi aplicado:** `src/patterns/strategy/FiltroStrategy.ts`, `src/patterns/strategy/README.md`, `src/hooks/PesquisaHooks/usePesquisa.ts`, `src/hooks/PesquisaHooks/type.ts`, `src/components/Pesquisar.tsx`, `src/hooks/DuvidaHooks/useDuvidas.ts`, `src/hooks/DuvidaHooks/type.ts`, `src/components/DuvidasBox.tsx`, `src/components/AppSidebar.tsx` e `testes/patterns/strategy/filtroStrategy.spec.ts`.
- **Antes vs. depois:**
  - **Antes:** Lógica de filtragem e ordenação acoplada em 3 componentes visuais (`Pesquisar.tsx`, `DuvidasBox.tsx`, `AppSidebar.tsx`), com duplicação de regras e `0%` de testes unitários puros.
  - **Depois:** Contrato genérico `FiltroStrategy<T, Contexto>` com 8 estratégias concretas puras e composições declarativas (`filtrarEOrdenarTurmas` e `filtrarDuvidasPorPerfilEStatus`) consumidas por `usePesquisa` e `useDuvidas`.
- **Como contribui para qualidade/manutenção/testabilidade:**
  - **Testes Unitários Puros (Nível 2 RBT — 10 testes):** Valida por Particionamento de Equivalência e Tabela de Decisão as buscas textuais, filtros de inscrição (`minhas`, `disponiveis`, `todas`), seleção por papel (`professor`, `master`, `aluno`, `null`), ordenação por inscrição e composição de visibilidade + status de dúvidas.
  - **Testes de Integração de Hooks (2 testes):** Valida a troca dinâmica de abas/filtros em `usePesquisa` e `useDuvidas`, o cálculo de `totalDuvidasPendentes` e o reset automático de filtro ao trocar de perfil sem renderizar componentes pesados.
- **Funcionou?** **Sim** — **6 suítes / 78 testes passando**; `FiltroStrategy.ts` atingiu **100%** de cobertura em Statements, Branches, Functions e Lines.
- **Lições / trade-offs:** Extrair tanto o filtro de status quanto o filtro de visibilidade por papel para estratégias permitiu eliminar simultaneamente os condicionais de `DuvidasBox.tsx` e a duplicação em `AppSidebar.tsx`.

### Fase 4 — Padrão Observer (`NotificacaoSubject`) nos Canais e Notificações Realtime
- **Implementado por:** Gabriel Lineker (`GabrielLineker`)
- **Por que foi escolhido:** O sistema possuía 5 canais Supabase Realtime (`realtime:mural_posts`, `realtime:atividades`, `realtime:entregas-mural`, `alertas-calendario-5-min` e `chat-nexusclass`) dispersos em 3 hooks (`useMural.ts`, `useGerenciador.ts`, `useMensagens.ts`), onde cada hook acoplava a infraestrutura WebSocket, as regras de negócio de filtragem/deduplicação e os efeitos visuais (`toast` Sonner e atualização de estado/badges).
- **Onde foi aplicado:** `src/patterns/observer/NotificacaoSubject.ts`, `src/patterns/observer/README.md`, `src/hooks/MuralHooks/useMural.ts`, `src/hooks/GerenciadorHooks/useGerenciador.ts`, `src/hooks/MensagensHooks/useMensagens.ts` e `testes/patterns/observer/notificacaoObserver.spec.ts`.
- **Antes vs. depois:**
  - **Antes:** 5 blocos `.channel(...).on('postgres_changes', ...)` espalhados em 3 hooks com verificações de autoria, deduplicação de alertas por `Set<string>`, reconciliação de mensagens com `localStorage` e chamadas diretas a `toast()` dentro dos callbacks do WebSocket (`0%` de testes unitários).
  - **Depois:** `NotificacaoSubject` publica `EventoNotificacaoRealtime` para observadores desacoplados (`ToastNotificacaoObserver`, `StateRefreshObserver`, `BadgeCounterObserver`), enquanto conectores de borda (`conectarCanaisMuralRealtime`, `conectarCanalAlertasCalendarioRealtime`, `conectarCanalMensagensRealtime`) traduzem eventos do Supabase e retornam funções de *cleanup* seguras.
- **Como contribui para qualidade/manutenção/testabilidade:**
  - **Testes Unitários do Subject e Observers (Nível 2/3 RBT — 9 testes):** Valida broadcast 1-para-N, desinscrição via retorno de `inscrever`, filtragem de autoria própria nos toasts do mural e de atividades, deduplicação de alertas de calendário (`${evento_id}-${minutos_antes ?? "db"}`), reconciliação imutável de `INSERT`/`UPDATE` de mensagens e contagem reativa de badges/não lidas.
  - **Testes de Fronteira dos 5 Canais Realtime (Nível 3 RBT — 2 testes):** Simula disparos de `postgres_changes` nos 5 canais com `ClienteRealtimeFake` e verifica o `removeChannel` no desmontar, sem depender de WebSocket real.
- **Funcionou?** **Sim** — **7 suítes / 89 testes passando**; `NotificacaoSubject.ts` atingiu **100%** de cobertura em Statements, Branches, Functions e Lines.
- **Lições / trade-offs:** Tipar os conectores Realtime com uma interface estrutural mínima (`ClienteRealtimeLike<TCanal>`) permitiu passar a instância real `supabase` nos hooks sem nenhum `any` ou *type cast*, ao mesmo tempo em que possibilitou injetar um fake determinístico nos testes.

## Diário de Sessões
| Data | Autor | Resumo |
|:---|:---|:---|
| 2026-10-19 | Gabriel Lineker (`GabrielLineker`) | Análise inicial dos 3 documentos; temas definidos (Design Patterns + Testes); `.agents/` inicializado; plano criado. Decisões: refatorar na `DesiningTeste`; descartar Template Method; Singleton e Proxy de proteção apenas documentados (já existem no código). |
| 2026-10-19 (2) | Gabriel Lineker (`GabrielLineker`) | Renomeado `.agent` → `.agents`. ADR-001 aprovado: padrões em `src/patterns/` (README por padrão) e cobertura v8 instalada (baseline 4.27% de statements em `src/lib`). Análise de viabilidade do E2E com Supabase local em Docker (espaço em disco) em andamento. |
| 2026-10-24 | Gabriel Lineker (`GabrielLineker`) | Pastas `.agents/`, `.docs/`, `relatorios/` e `AGENTS.md` liberadas no `.gitignore` para controle de versão da dupla (com limpeza via `git rm --cached` prevista no fechamento). Implementado protocolo de Handoff entre fases e identificação obrigatória de autoria. |
| 2026-10-24 (2) | Gabriel Lineker (`GabrielLineker`) | **Fase 0 concluída:** `setupTests.ts` configurado com `vi.stubGlobal`; criados 26 testes em `testes/lib/utils.spec.ts` elevando a cobertura de `src/lib` de **4.27%** para **98.36%** (`utils.ts` 100%). Criada apresentação interativa de **Engenharia de Software (DCC061)** na aba Informações (`InfoAplicacao.tsx`) com seletor de disciplina, catálogo interativo de Design Patterns (Antes vs. Depois) e painel de cobertura. |
| 2026-10-27 | Gianlucca Paiva (`GianluccaPaiva`) | **Fase 1 concluída:** Criados `ADR-002` e spec da Fase 1; implementados `GeminiAdapter` (`IAssistenteIA`) em `src/patterns/adapter/GeminiAdapter.ts` e `BotFactory` em `src/patterns/factory/BotFactory.ts`; refatorado `src/hooks/botsHooks/useChatBot.ts` sem regressão; criados 22 novos testes em `testes/patterns/` (total 4 suítes / 51 testes passando, **100%** de cobertura em `src/lib` e `src/patterns`). Atualizados slides interativos em `configEngenhariaSoftware.ts`. |
| 2026-11-04 | Gianlucca Paiva (`GianluccaPaiva`) | **Infraestrutura Docker PostgreSQL:** Criados `ADR-003`, spec de infraestrutura, `docker/structure/docker-compose.yml` (projeto `nexusclass`, container `nexusclass-db` com `postgres:17-alpine`, volume persistente `nexusclass_pgdata` e leitura de `docker/constructionsSQL/`) e script `000_teste_conexao.sql` para validação no SQLTools, com credenciais e porta 100% isoladas no `.env`. |
| 2026-11-05 | Gabriel Lineker (`GabrielLineker`) | **Fase 2 concluída:** Criados `ADR-004` e spec da Fase 2; implementada `EntregaAtividadeFacade` (`IEntregaAtividadeFacade`) em `src/patterns/facade/EntregaAtividadeFacade.ts`; refatorado `src/hooks/EntregasHooks/useEntregas.ts` sem regressão e sem `any`; criados 15 novos testes em `testes/patterns/facade/entregaAtividadeFacade.spec.ts` (total 5 suítes / 66 testes passando, **100%** de cobertura em `src/lib` e `src/patterns`). Atualizados slides interativos em `configEngenhariaSoftware.ts`. |
| 2026-11-05 (2) | Gianlucca Paiva (`GianluccaPaiva`) | **Fase 3 concluída:** Criados `ADR-005` e spec da Fase 3; implementado `FiltroStrategy` e estratégias concretas de turmas e dúvidas em `src/patterns/strategy/FiltroStrategy.ts`; refatorados `usePesquisa.ts`, `Pesquisar.tsx`, `useDuvidas.ts`, `DuvidasBox.tsx` e `AppSidebar.tsx` eliminando condicionais e duplicações; criados 12 novos testes em `testes/patterns/strategy/filtroStrategy.spec.ts` (total 6 suítes / 78 testes passando, **100%** de cobertura em `src/lib` e `src/patterns`). Atualizados slides interativos em `configEngenhariaSoftware.ts`. |
| 2026-11-05 (3) | Gabriel Lineker (`GabrielLineker`) | **Fase 4 concluída:** Criados `ADR-006` e spec da Fase 4; implementados `NotificacaoSubject`, `ToastNotificacaoObserver`, `StateRefreshObserver`, `BadgeCounterObserver` e conectores Realtime em `src/patterns/observer/NotificacaoSubject.ts`; refatorados `useMural.ts`, `useGerenciador.ts` e `useMensagens.ts` sem regressão; criados 11 novos testes em `testes/patterns/observer/notificacaoObserver.spec.ts` (total 7 suítes / 89 testes passando, **100%** de cobertura em `src/lib` e `src/patterns`). Atualizados slides interativos em `configEngenhariaSoftware.ts`. |

## Pontos para a Apresentação (15–20 min)
- Parte 1: documento-texto (2 temas). Parte 2: demo do código (antes/depois + testes rodando + aba *Informações → Engenharia de Software (DCC061)* dentro da própria aplicação).
- Mencionar: o risco do overengineering e por que descartamos padrões (*Template Method*).
