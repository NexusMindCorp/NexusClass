# `src/patterns/` — Catálogo de Padrões de Projeto do NexusClass

Cada subpasta contém a implementação e/ou documentação técnica do padrão GoF aplicado no projeto (`por quê` · `como funciona` · `arquivos` · `testes`). Decisão fundacional: [ADR-001](../../.agents/decisions/adr-001-patterns-e-cobertura.md). Suítes de teste em `testes/patterns/<padrao>/`.

| # | Padrão | Tipo (GoF) | Pasta / Implementação | Problema real que resolve | Status |
|:---|:---|:---|:---|:---|:---|
| 1 | **Adapter** | Estrutural | [adapter/GeminiAdapter.ts](adapter/GeminiAdapter.ts) | Isola o SDK `@google/generative-ai`, *Function Calling* e *retry* 503 por trás de `IAssistenteIA` | **Concluído (Fase 1 — 100% cov)** |
| 2 | **Factory** | Criacional | [factory/BotFactory.ts](factory/BotFactory.ts) | Centraliza a criação determinística dos bots **Tigreso** e **Falcão Peregrino** e seus prompts por papel | **Concluído (Fase 1 — 100% cov)** |
| 3 | **Facade** | Estrutural | [facade/EntregaAtividadeFacade.ts](facade/EntregaAtividadeFacade.ts) | Unifica Supabase Storage (`upload` + `createSignedUrl`) e PostgreSQL (`upsert` + avaliação) na entrega de atividades | **Concluído (Fase 2 — 100% cov)** |
| 4 | **Strategy** | Comportamental | [strategy/FiltroStrategy.ts](strategy/FiltroStrategy.ts) | Substitui condicionais e duplicações nos filtros de pesquisa de turmas (`usePesquisa`) e dúvidas (`useDuvidas`) | **Concluído (Fase 3 — 100% cov)** |
| 5 | **Observer** | Comportamental | [observer/NotificacaoSubject.ts](observer/NotificacaoSubject.ts) | Desacopla os 5 canais Supabase Realtime dos efeitos de Toast, Refresh de estado e contador de Badges | **Concluído (Fase 4 — 100% cov)** |
| 6 | **Singleton** | Criacional | [singleton/README.md](singleton/README.md) (`src/lib/supabaseClient.ts`) | Garante instância única do cliente Supabase (Auth + Realtime) via cache nativo de ES Modules | **Concluído / Documentado (Fase 5 — 100% cov)** |
| 7 | **Protection Proxy** | Estrutural | [proxy/README.md](proxy/README.md) (`ProtectedRoute.tsx` / `BoxRestrito.tsx`) | Intercepta e protege rotas autenticadas e telas restritas por papel antes de montar o componente-alvo | **Concluído / Documentado (Fase 5)** |

> **Anti-Decisão Registrada:** O padrão *Template Method* foi avaliado e **descartado** porque os formulários do sistema (Mural, Atividades, Dúvidas e Suporte) possuem fluxos e campos muito distintos; forçar uma superclasse abstrata introduziria *overengineering* por herança.
