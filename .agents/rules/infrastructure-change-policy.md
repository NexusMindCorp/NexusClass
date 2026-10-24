---
name: infrastructure-change-policy
description: Regras para mudanças de arquitetura, bibliotecas e padrões.
scope: universal
always_on: true
---

# Mudanças de Infraestrutura
- **Modo:** Brownfield com refatoração *autorizada apenas* para os padrões listados em `.docs/PLANEJAMENTO_REFATORACAO.md`. Qualquer padrão/arquitetura fora do plano exige aval humano.
- **Anti-overengineering:** um padrão só entra se resolver problema real e verificável no código atual. Sem classes/interfaces "de enfeite".
- **Bibliotecas:** reaproveitar antes de instalar; pesquisa ativa + aval antes de qualquer `npm install`. Stack de testes já existente: Vitest, Testing Library, jsdom, Playwright (não adicionar Jest).
- **ADR obrigatório** em `.agents/decisions/` antes de aplicar cada padrão (inclui alternativas descartadas). ADR aprovado nunca é reescrito; cria-se um novo e marca-se o anterior como substituído.
- Estilo: o código novo deve se parecer com o existente (hooks por domínio, `type.ts`/`config.ts`, alias `@`).
