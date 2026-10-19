# `src/patterns/` — Catálogo de Padrões de Projeto do NexusClass

Cada subpasta contém o código do padrão e um `README.md` curto (por quê · como funciona · exemplo). Decisão: [ADR-001](../../.agents/decisions/adr-001-patterns-e-cobertura.md). Testes em `testes/patterns/<padrao>/`.

| Padrão | Tipo (GoF) | Pasta | Problema real que resolve | Status |
|:---|:---|:---|:---|:---|
| Adapter | Estrutural | [adapter/](adapter/) | SDK do Gemini acoplado ao hook do chatbot | Planejado |
| Factory | Criacional | [factory/](factory/) | Criação dos bots (Tigreso/Falcão) e telas por tipo | Planejado |
| Facade | Estrutural | [facade/](facade/) | Entrega de atividade orquestra Storage + DB | Planejado |
| Strategy | Comportamental | [strategy/](strategy/) | Filtros de pesquisa e dúvidas com condicionais | Planejado |
| Observer | Comportamental | [observer/](observer/) | Canais Realtime dispersos com toasts próprios | Planejado |
| Singleton | Criacional | [singleton/](singleton/) | Cliente Supabase único (já existe; só documentado) | Documentado |
| Proxy | Estrutural | [proxy/](proxy/) | Controle de acesso por papel/sessão (já existe; só documentado) | Documentado |

Regras: um padrão só ganha código se resolver problema real (ver `.docs/PLANEJAMENTO_REFATORACAO.md`). Ao concluir um padrão, atualizar a tabela acima e `.docs/DOCUMENTACAO_APRESENTACAO.md`.
