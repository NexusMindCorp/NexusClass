# Documentação Vigente para Apresentação — NexusClass (Design Patterns + Testes)

> **Documento vivo e versionado no Git.** Atualizado a cada sessão (junto com os slides interativos em `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`) para sincronização da dupla, só com pontos-chave: o que foi escolhido, por quê, onde foi aplicado e se funcionou. Plano mestre: `PLANEJAMENTO_REFATORACAO.md`.

## 🔄 Ponto de Retomada (Handoff entre Membros / Fases)
> **Regra de Continuidade:** Antes de iniciar qualquer atualização ou nova fase, leia este bloco e o último relatório listado abaixo. Continue exatamente de onde o processo anterior parou, respeitando o planejamento e os contratos/testes já criados.

| Campo | Estado Atual |
|:---|:---|
| **Última modificação por** | **Gabriel Lineker** (`GabrielLineker`) em 2026-10-24 |
| **Última etapa concluída** | **Fase 0 Concluída** + **Slides Interativos DCC061 (`InfoAplicacao.tsx`) ativos**: `setupTests.ts` blindado com stubs globais; 25 novos testes unitários em `testes/lib/utils.spec.ts` (total 28 testes passando); cobertura de `src/lib` subiu de **4.27%** para **98.29%** (`utils.ts` e `assetPath.ts` com **100%**). |
| **Último relatório** | `relatorios/2026-10/2026-10-24-fase-0-base-testes-e-slides.md` (Autor: Gabriel Lineker) |
| **Fase atual / Próximo passo** | **Fase 1 (Planejado → Pronto para Iniciar):** Implementar **Adapter + Factory** para os bots (Tigreso & Falcão) em `src/patterns/adapter/` e `src/patterns/factory/`, refatorar `src/hooks/botsHooks/useChatBot.ts` sem quebrar a UI, criar testes em `testes/patterns/` e atualizar este documento + `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`. |
| **Restrições/Contratos ativos** | Globais de build já estão mockadas em `setupTests.ts`; padrões devem residir em `src/patterns/<padrao>/`; rodar `npx.cmd vitest run` e `npx.cmd tsc -b --noEmit` ao final de cada alteração de código. |

## Painel de Progresso
| Fase | Item | Status | Responsável (Última Mod.) | Resultado |
|:---|:---|:---|:---|:---|
| 0 | Base de testes (`utils.ts` + `assetPath.ts` + `setupTests.ts`) | **Concluído** | Gabriel Lineker | 28 testes passando (2 suítes); cobertura `src/lib` saltou de **4.27%** para **98.29%** (`utils.ts` 100%) |
| 1 | Adapter + Factory (bots) | Planejado | a definir | — |
| 2 | Facade (entrega) | Planejado | a definir | — |
| 3 | Strategy (filtros) | Planejado | a definir | — |
| 4 | Observer (Realtime) | Planejado | a definir | — |
| 5 | Singleton / Proxy documentados + diagrama | Planejado | a definir | — |
| 6 | Testes de componente + E2E | Planejado | a definir | — |
| 7 | Aba de Apresentação DCC061 (`InfoAplicacao.tsx`) | **Ativo (Contínuo)** | Gabriel Lineker | Seletor `Engenharia de Software (DCC061)` vs `Modelagem de Sistemas` implementado e preenchido com Fase 0 + espaços das Fases 1–6 |

## Métricas (antes → depois)
| Métrica | Antes (Baseline) | Depois (Pós-Fase 0) |
|:---|:---|:---|
| Testes automatizados | 1 arquivo (`button.spec.tsx` — 3 testes) | **2 arquivos (`button.spec.tsx` + `utils.spec.ts` — 28 testes)** |
| Cobertura (`src/lib`) — Stmts / Branch / Funcs / Lines | **4.27% / 0% / 4% / 4.42%** | **98.29% / 95.83% / 100% / 98.23%** (`utils.ts` e `assetPath.ts` em **100%**) |
| Acoplamento componente↔Supabase/Gemini | Direto nos hooks | A iniciar desacoplamento na Fase 1 |

## Registro por Padrão / Teste

### Fase 0 — Testes Unitários Determinísticos (`src/lib/utils.ts` & `assetPath.ts`) + Test Harness (`setupTests.ts`)
- **Implementado por:** Gabriel Lineker (`GabrielLineker`)
- **Por que foi escolhido:** Construir a base da Pirâmide de Testes (Nível 2 RBT) antes de refatorar hooks acoplados nas Fases 1 a 4, garantindo determinismo e isolando variáveis globais de build (`__URL_SUPABASE__`, `__KEY_SUPABASE__`, `__API_GEMINI_KEY__`, `__APP_VERSION__`, `__BASE_URL__`).
- **Onde foi aplicado:** `setupTests.ts`, `testes/lib/utils.spec.ts`, `vite.config.ts` (filtro `*.{ts,tsx}` e reporter HTML na cobertura) e `src/components/InfoAplicacao.tsx` + `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`.
- **Antes vs. depois:** Antes, `src/lib/utils.ts` tinha apenas `cn()` exercitado indiretamente (4.27% de statements) e qualquer função temporal dependia do relógio real da máquina. Depois, todas as 24 funções de `utils.ts` + `getAssetPath` possuem testes determinísticos cobrindo caminhos felizes, limites de prazo e blocos `catch`.
- **Como contribui para qualidade/manutenção/testabilidade:**
  - **Fake Timers (`vi.useFakeTimers`):** Congela o tempo para testar `isDataEntregaFutura`, `comparaDataHj`, `formatarDataRelativa` e `formatarDataUltimaMensagem` sem falsos negativos na virada do dia.
  - **Análise de Valor Limite:** Garante precisão na validação de prazos de entrega (ontem, instante exato e amanhã).
  - **Particionamento de Equivalência & Tabela de Decisão:** Valida `extrairUrlsAnexo`, `obterNomeArquivoDoUrl` e todos os códigos PostgreSQL de `formatarErroSupabase` (`PGRST205`, `42P01`, `42501`, genéricos).
  - **Tolerância a Falhas:** Injeção de JSON corrompido no `localStorage` e simulação de ausência de `window` (SSR guard).
- **Funcionou?** **Sim** — 2 suítes / 28 testes passando em ~2.6s; cobertura de `utils.ts` e `assetPath.ts` atingiu **100%** em Statements, Branches, Functions e Lines.
- **Lições / trade-offs:** O filtro de cobertura do `@vitest/coverage-v8` em `vite.config.ts` tentava fazer parse AST dos arquivos `README.md` dentro de `src/patterns/**`; restringir o glob para `src/{lib,patterns}/**/*.{ts,tsx}` eliminou os avisos do Rollup.

## Diário de Sessões
| Data | Autor | Resumo |
|:---|:---|:---|
| 2026-10-19 | Gabriel Lineker (`GabrielLineker`) | Análise inicial dos 3 documentos; temas definidos (Design Patterns + Testes); `.agents/` inicializado; plano criado. Decisões: refatorar na `DesiningTeste`; descartar Template Method; Singleton e Proxy de proteção apenas documentados (já existem no código). |
| 2026-10-19 (2) | Gabriel Lineker (`GabrielLineker`) | Renomeado `.agent` → `.agents`. ADR-001 aprovado: padrões em `src/patterns/` (README por padrão) e cobertura v8 instalada (baseline 4.27% de statements em `src/lib`). Análise de viabilidade do E2E com Supabase local em Docker (espaço em disco) em andamento. |
| 2026-10-24 | Gabriel Lineker (`GabrielLineker`) | Pastas `.agents/`, `.docs/`, `relatorios/` e `AGENTS.md` liberadas no `.gitignore` para controle de versão da dupla (com limpeza via `git rm --cached` prevista no fechamento). Implementado protocolo de Handoff entre fases e identificação obrigatória de autoria. |
| 2026-10-24 (2) | Gabriel Lineker (`GabrielLineker`) | **Fase 0 concluída:** `setupTests.ts` configurado com `vi.stubGlobal`; criados 25 testes em `testes/lib/utils.spec.ts` elevando a cobertura de `src/lib` de **4.27%** para **98.29%** (`utils.ts` 100%). Criada apresentação interativa de **Engenharia de Software (DCC061)** na aba Informações (`InfoAplicacao.tsx`) com seletor de disciplina, catálogo interativo de Design Patterns (Antes vs. Depois) e painel de cobertura. |

## Pontos para a Apresentação (15–20 min)
- Parte 1: documento-texto (2 temas). Parte 2: demo do código (antes/depois + testes rodando + aba *Informações → Engenharia de Software (DCC061)* dentro da própria aplicação).
- Mencionar: o risco do overengineering e por que descartamos padrões (*Template Method*).
