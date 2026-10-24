# Feature: Fase 0 — Base de Testes Unitários (`utils.ts`) + Apresentação Interativa DCC061 (`InfoAplicacao`)

- **Registro:** 2026-10-24
- **Autor / Responsável:** Gabriel Lineker (`GabrielLineker`)
- **Status:** Concluído
- **Risco (RBT):** Nível 2 (Testes unitários determinísticos de `src/lib/utils.ts` + extensão visual sem regressão na aba `InfoAplicacao.tsx`)
- **Validação:** `npx tsc -b --noEmit` + `npx vitest run testes/lib/utils.spec.ts --silent` + `npm run test:coverage`

## 1. Visão Geral
1. **Blindagem do Ambiente de Testes (`setupTests.ts`):** Configurar stubs globais (`__URL_SUPABASE__`, `__KEY_SUPABASE__`, `__API_GEMINI_KEY__`, `__APP_VERSION__`) via `vi.stubGlobal` e limpeza de `localStorage`/timers entre testes para permitir importação segura de qualquer módulo nas Fases 0 a 6 sem acesso acidental à rede.
2. **Suíte de Testes Unitários Puros (`testes/lib/utils.spec.ts`):** Cobrir todas as 24 funções exportadas de `src/lib/utils.ts` aplicando Particionamento de Equivalência, Análise de Valor Limite, Tabela de Decisão e Determinismo Temporal (`vi.useFakeTimers()`).
3. **Apresentação Interativa de Engenharia de Software (`src/components/InfoAplicacao.tsx`):** Adicionar seletor no topo da aba *Informações* alternando entre **Modelagem de Sistemas** (original 100% preservada) e **Engenharia de Software (DCC061 — Design Patterns & Testes)**, já populada com os resultados reais da Fase 0 e estruturada com espaços para atualização contínua nas Fases 1 a 6.

## 2. Não-Objetivos (Non-Goals)
- Não alterar nenhuma função de negócio em `src/lib/utils.ts`.
- Não remover nem alterar os textos originais da apresentação de Modelagem de Sistemas em `InfoAplicacao.tsx`.
- Não implementar ainda os Design Patterns das Fases 1 a 4 no código de produção (apenas catalogar seus espaços comparativos Antes/Depois no slide interativo).

## 3. UI/UX (consistência arquitetural)
- Reutilizar integralmente as classes de layout (`info-apresentacao`, `info-hero`, `info-slide-card`, `info-slide-destaque`, `info-metrics-grid`, `info-build-panel`, `info-flow-grid`) e os componentes `SectionHeader` e `InfoCard` de `src/hooks/InfoAplicacao/InfoElementos.tsx`.

## 4. Acessibilidade
- Botões seletores de apresentação e de filtro de padrões com indicação visual clara de estado ativo e semântica de botão (`type="button"`).

## 5. Desempenho e Segurança
- Nenhum segredo real exposto em `setupTests.ts` (apenas URLs e chaves dummy de teste).
- Renderização puramente declarativa e leve no cliente.

## 6. Arquivos Tocados
- `setupTests.ts`
- `testes/lib/utils.spec.ts` (novo)
- `src/hooks/InfoAplicacao/type.ts`
- `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts` (novo)
- `src/components/InfoAplicacao.tsx`

## 7. Matriz de Risco
| Componente/Alvo | Nível RBT | Estratégia |
|:---|:---|:---|
| `src/lib/utils.ts` | Nível 2 (Lógica Pura) | Testes unitários determinísticos cobrindo caminhos felizes, limites de data e blocos `catch` |
| `InfoAplicacao.tsx` | Nível 1 (Visual/Apresentação) | Verificação estática (`tsc -b --noEmit`) e preservação integral da aba original |

## 8. Validação
- [x] Typecheck (`npx tsc -b --noEmit`)
- [x] Testes da feature (`npx vitest run testes/lib/utils.spec.ts`)
- [x] Sem regressão (`npx vitest run`)
- [x] `.docs/DOCUMENTACAO_APRESENTACAO.md` e `InfoAplicacao.tsx` atualizados

## 9. Procedimento de Rollback
Reverter `setupTests.ts`, `src/components/InfoAplicacao.tsx` e `src/hooks/InfoAplicacao/type.ts`, e remover `testes/lib/utils.spec.ts` e `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`.
