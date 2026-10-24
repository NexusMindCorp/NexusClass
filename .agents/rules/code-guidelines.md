---
name: code-guidelines
description: Convenções de código específicas do NexusClass.
scope: project-specific
always_on: true
---

# Code Guidelines
- TypeScript estrito; sem `any` em código novo (a análise de padrões usa `any` — não copiar).
- UI com Shadcn/Radix em `src/components/ui/`; ícones `lucide-react`; toasts `sonner`.
- Lógica de dados em hooks por domínio (`src/hooks/<Dominio>Hooks/`); tipos em `type.ts`, constantes em `config.ts`.
- Novos padrões de projeto ficam em `src/patterns/<padrao>/` **ou** junto ao domínio em `src/hooks/<Dominio>Hooks/` — escolher um e manter (decisão em ADR-001).
- Imports com alias `@/`. Textos de UI em português.
- Lint: `npm run lint` deve passar.
