# Documentação Vigente para Apresentação — NexusClass (Design Patterns + Testes)

> **Documento vivo e versionado no Git.** Atualizado a cada sessão para sincronização da dupla, só com pontos-chave: o que foi escolhido, por quê, onde foi aplicado e se funcionou. Plano mestre: `PLANEJAMENTO_REFATORACAO.md`.

## 🔄 Ponto de Retomada (Handoff entre Membros / Fases)
> **Regra de Continuidade:** Antes de iniciar qualquer atualização ou nova fase, leia este bloco e o último relatório listado abaixo. Continue exatamente de onde o processo anterior parou, respeitando o planejamento e os contratos/testes já criados.

| Campo | Estado Atual |
|:---|:---|
| **Última modificação por** | **Gabriel Lineker** (`GabrielLineker`) em 2026-10-24 |
| **Última etapa concluída** | Setup de governança, catálogo inicial `src/patterns/`, `@vitest/coverage-v8` instalado e baseline medida (4.27% Stmts). Pastas `.agents/`, `.docs/`, `relatorios/` e `AGENTS.md` abertas no Git com rastreabilidade de autor por etapa. |
| **Último relatório** | `relatorios/2026-10/2026-10-19-setup-governanca-ambiente.md` (Autor: Gabriel Lineker) |
| **Fase atual / Próximo passo** | **Fase 0 (Em Andamento):** Criar spec em `.agents/features/`, configurar stubs globais (`__API_GEMINI_KEY__`, `__URL_SUPABASE__`, `__KEY_SUPABASE__`) em `setupTests.ts` e implementar testes unitários puros de `src/lib/utils.ts`. |
| **Restrições/Contratos ativos** | Padrões devem residir em `src/patterns/<padrao>/`; testes em `testes/*.spec.tsx`; rodar `npx vitest run` para validar não-regressão antes de avançar de fase. |

## Painel de Progresso
| Fase | Item | Status | Responsável (Última Mod.) | Resultado |
|:---|:---|:---|:---|:---|
| 0 | Base de testes | Em Andamento | Gabriel Lineker | `@vitest/coverage-v8` instalado; baseline medida |
| 1 | Adapter + Factory (bots) | Planejado | a definir | — |
| 2 | Facade (entrega) | Planejado | a definir | — |
| 3 | Strategy (filtros) | Planejado | a definir | — |
| 4 | Observer (Realtime) | Planejado | a definir | — |
| 5 | Singleton / Proxy documentados + diagrama | Planejado | a definir | — |
| 6 | Testes de componente + E2E | Planejado | a definir | — |

## Métricas (antes → depois)
| Métrica | Antes | Depois |
|:---|:---|:---|
| Testes automatizados | 1 arquivo (`button.spec.tsx`) | — |
| Cobertura (`src/lib`) — Stmts / Branch / Funcs / Lines | **Baseline: 4.27% / 0% / 4% / 4.42%** (3 testes, só `button.spec`) | — |
| Acoplamento componente↔Supabase/Gemini | Direto nos hooks | — |

## Registro por Padrão / Teste
*(Copiar o bloco abaixo para cada item concluído)*

### <Padrão ou tipo de teste>
- **Implementado por:** <Nome (`git user.name`)>
- **Por que foi escolhido:**
- **Onde foi aplicado:** (arquivos)
- **Antes vs. depois:**
- **Como contribui para qualidade/manutenção/testabilidade:**
- **Funcionou?** Sim / Parcial / Não — evidência (testes, cobertura):
- **Lições / trade-offs:**

## Diário de Sessões
| Data | Autor | Resumo |
|:---|:---|:---|
| 2026-10-19 | Gabriel Lineker (`GabrielLineker`) | Análise inicial dos 3 documentos; temas definidos (Design Patterns + Testes); `.agents/` inicializado; plano criado. Decisões: refatorar na `DesiningTeste`; descartar Template Method; Singleton e Proxy de proteção apenas documentados (já existem no código). |
| 2026-10-19 (2) | Gabriel Lineker (`GabrielLineker`) | Renomeado `.agent` → `.agents`. ADR-001 aprovado: padrões em `src/patterns/` (README por padrão) e cobertura v8 instalada (baseline 4.27% de statements em `src/lib`). Análise de viabilidade do E2E com Supabase local em Docker (espaço em disco) em andamento. |
| 2026-10-24 | Gabriel Lineker (`GabrielLineker`) | Pastas `.agents/`, `.docs/`, `relatorios/` e `AGENTS.md` liberadas no `.gitignore` para controle de versão da dupla (com limpeza via `git rm --cached` prevista na Fase 6). Implementado protocolo de Handoff entre fases e identificação obrigatória de autoria em todos os artefatos. |

## Pontos para a Apresentação (15–20 min)
- Parte 1: documento-texto (2 temas). Parte 2: demo do código (antes/depois + testes rodando).
- Mencionar: o risco do overengineering e por que descartamos padrões.
