# 🚀 INICIALIZACAO — NexusClass

| Campo | Valor |
|:---|:---|
| Projeto | NexusClass (plataforma educacional) |
| Stack | React 19, TypeScript 5.9, Vite 7, Tailwind 4, Shadcn/Radix, Supabase, Gemini SDK, Vitest + Testing Library + jsdom, Playwright |
| Modo | **Brownfield com refatoração autorizada** (objetivo acadêmico: Design Patterns + Testes). Mudanças arquiteturais somente conforme o plano e com ADR. |
| Dupla (Autores) | **Gabriel Lineker** (`GabrielLineker`) & **Gianlucca Paiva** (`GianluccaPaiva`) — identificar autor ativo via `git config user.name` |
| Branch ativa | `DesiningTeste` |
| Plataforma | Web SPA |
| Verificação de integridade | `npx tsc -b --noEmit` |
| Tamanho | ~150 arquivos versionados (projeto pequeno → sem ferramentas de grafo; usar `npx madge --circular src/` se necessário) |

## Roteiro Rápido (Trabalho em Dupla & Continuidade entre Fases)
1. Ler `AGENTS.md`.
2. **Checagem de Continuidade (Obrigatória antes de atualizar ou iniciar fase):** Ler o bloco **Ponto de Retomada (Handoff)** em `.docs/DOCUMENTACAO_APRESENTACAO.md` e o relatório mais recente em `relatorios/<mes-ano>/` para absorver o que foi feito no processo anterior. Nunca iniciar uma fase do zero sem considerar os artefatos, contratos e testes deixados pela etapa anterior, mantendo alinhamento estrito com `.docs/PLANEJAMENTO_REFATORACAO.md`.
3. Ler **apenas** a spec da feature atual em `features/` e o ADR relacionado.
4. Contexto geral do sistema se necessário: `.docs/AnaliseMaisAtualDoSistema.md` (fonte da verdade do sistema).
5. Ao final: atualizar `.docs/DOCUMENTACAO_APRESENTACAO.md` (progresso + bloco de Handoff com **identificação de quem fez a alteração**), atualizar os slides interativos em `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`, atualizar a tabela abaixo (coluna `Responsável`) e gerar relatório em `relatorios/<mes-ano>/` com o campo `Autor` (ambos versionados no Git para o parceiro de equipe saber quem fez e continuar de onde parou).

## Mapa de Diretórios
| Pasta | Conteúdo |
|:---|:---|
| [rules/](rules/) | Políticas: ciclo de vida, infraestrutura, testes, relatórios, segurança, code-guidelines |
| [features/](features/) | Specs de cada refatoração/padrão (template + 1 por padrão) |
| [decisions/](decisions/) | ADRs (template + 1 por padrão escolhido) |
| [troubleshooting/](troubleshooting/) | Guias de erro |

## Tabela de Features (Plano de Refatoração)
| Fase | Feature | Status | Responsável (Última Mod.) | Spec |
|:---|:---|:---|:---|:---|
| 0 | Base de testes (`utils.ts` + `assetPath.ts` unitários, `setupTests.ts`, slides DCC061) | **Concluído** (2 suítes / 29 testes; `utils.ts` e `assetPath.ts` 100%) | Gabriel Lineker | [fase-0-base-testes-e-slides-dcc061.md](features/fase-0-base-testes-e-slides-dcc061.md) / [ADR-001](decisions/adr-001-patterns-e-cobertura.md) |
| 1 | Adapter + Factory (Gemini / Tigreso & Falcão) | Planejado | a definir | a criar |
| 2 | Facade (entrega de atividade) | Planejado | a definir | a criar |
| 3 | Strategy (filtros de pesquisa e dúvidas) | Planejado | a definir | a criar |
| 4 | Observer (Realtime → notificações) | Planejado | a definir | a criar |
| 5 | Documentar Singleton (`supabaseClient`) e Proxy de proteção (`ProtectedRoute`) | Planejado | a definir | a criar |
| 6 | Testes de componente + E2E (login → entrega) | Planejado | a definir | a criar |
| 7 | Apresentação Interativa DCC061 na aba Informações (`InfoAplicacao.tsx`) | **Ativo / Refinamento Visual na Fase 7** (corrigir estilizações quebradas ao final das fases) | Gabriel Lineker | [fase-0-base-testes-e-slides-dcc061.md](features/fase-0-base-testes-e-slides-dcc061.md) |
| — | Template Method | **Descartado** (forçado; ver plano) | Gabriel Lineker | — |

## Comandos Operacionais
| Ação | Comando |
|:---|:---|
| Dev | `npm run dev` |
| Typecheck | `npx tsc -b --noEmit` |
| Lint | `npm run lint` |
| Teste cirúrgico | `npx vitest run <arquivo> --silent` |
| Todos os testes | `npx vitest run` |
| Cobertura | `npm run test:coverage` (escopo: `src/lib` e `src/patterns`) |
| Build | `npm run build` |

## Convenções do Projeto (descobertas)
- Alias `@` → `src/`, `@ts` → `testes/` (ver `vite.config.ts`). Testes ficam em `testes/` (`*.spec.tsx`).
- Vitest: `environment: jsdom`, `globals: true`, setup em `setupTests.ts`.
- Globais de build: `__API_GEMINI_KEY__`, `__URL_SUPABASE__`, `__KEY_SUPABASE__` (declarados via `define` no Vite; mockar em testes).
- Hooks por domínio em `src/hooks/<Dominio>Hooks/{use*.ts,type.ts,config.ts}`.
- Cliente Supabase único: `src/lib/supabaseClient.ts`. Gemini instanciado em `src/hooks/botsHooks/useChatBot.ts`.
