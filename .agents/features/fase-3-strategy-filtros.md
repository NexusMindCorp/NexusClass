# Feature: Fase 3 — Padrão Strategy nos Filtros de Pesquisa de Turmas e Central de Dúvidas (`FiltroStrategy`)

- **Registro:** 2026-11-05
- **Autor / Responsável:** Gianlucca Paiva (`GianluccaPaiva`)
- **Status:** Concluído
- **Risco (RBT):** Nível 2 (`FiltroStrategy` e estratégias concretas de turmas e dúvidas — lógica pura determinística, zero I/O) | Nível 3 (integração com `usePesquisa` e `useDuvidas`)
- **Validação:** `npx tsc -b --noEmit` + `npx vitest run testes/patterns/strategy/ --silent` + `npm run test:coverage`

## 1. Visão Geral
1. **Padrão Strategy (`src/patterns/strategy/FiltroStrategy.ts`):** Definir o contrato genérico `FiltroStrategy<T, Contexto = void>` e implementar estratégias concretas puras, determinísticas e intercambiáveis em tempo de execução para dois domínios da aplicação:
   - **Domínio de Pesquisa de Turmas (`TurmaEntry = [string, TurmaProps]`):**
     - `FiltroTurmaPorTextoStrategy`: filtra turmas cujo nome da matéria, professor, sala ou código da turma contenha o termo pesquisado (case-insensitive).
     - `FiltroTurmasInscritasStrategy` (`"minhas"`): retém apenas as turmas em que o usuário está inscrito/vinculado (`estaInscrito(key) === true`).
     - `FiltroTurmasDisponiveisStrategy` (`"disponiveis"`): retém apenas as turmas em que o aluno ainda não está inscrito (`estaInscrito(key) === false`).
     - `FiltroTodasTurmasStrategy` (`"todas"`): retém todas as turmas sem restrição de inscrição.
     - Seletor `obterEstrategiaFiltroTurma(abaAtiva, role)` e pipeline `filtrarEOrdenarTurmas(turmas, opcoes)` que compõem busca textual, ordenação alfabética base, estratégia de aba/papel e priorização de turmas inscritas.
   - **Domínio da Central de Dúvidas (`Duvida`):**
     - `FiltroDuvidasPorPerfilStrategy`: filtra dúvidas visíveis segundo o papel do usuário (`master` vê todas; `professor` vê `d.prof_id === perfil.id`; `aluno` vê `d.aluno_id === perfil.id`; perfil nulo retorna `[]`).
     - `FiltroTodasDuvidasStrategy` (`"todas"`): retém todas as dúvidas do perfil.
     - `FiltroDuvidasPendentesStrategy` (`"pendentes"`): retém apenas dúvidas com `resolvido === false`.
     - `FiltroDuvidasResolvidasStrategy` (`"resolvidas"`): retém apenas dúvidas com `resolvido === true`.
     - Seletor `obterEstrategiaStatusDuvida(status)` e pipeline `filtrarDuvidasPorPerfilEStatus(duvidas, perfil, status)`.
2. **Refatoração de `usePesquisa.ts` + `Pesquisar.tsx` e `useDuvidas.ts` + `DuvidasBox.tsx` + `AppSidebar.tsx`:**
   - Centralizar a aplicação das estratégias nos hooks `usePesquisa` e `useDuvidas`, removendo blocos condicionais (`if/else`) de filtragem que estavam espalhados nos componentes visuais `Pesquisar.tsx`, `DuvidasBox.tsx` e `AppSidebar.tsx`.
   - Eliminar usos remanescentes de `any` em `src/hooks/DuvidaHooks/useDuvidas.ts` e `src/hooks/DuvidaHooks/type.ts`.
3. **Suíte de Testes Automatizados (`testes/patterns/strategy/filtroStrategy.spec.ts`):**
   - Criar testes unitários puros (Nível 2 RBT) baseados em Particionamento de Equivalência e Tabela de Decisão para todas as estratégias de turmas e dúvidas, além de testes de integração dos hooks `usePesquisa` e `useDuvidas`.

## 2. Não-Objetivos (Non-Goals)
- Não alterar o layout visual, textos institucionais, abas (`Inscritas`, `Disponíveis`, `Todas`) ou itens do menu de filtro (`Todos`, `Pendente`, `Resolvida`) em `Pesquisar.tsx` e `DuvidasBox.tsx`.
- Não alterar a estrutura da tabela `duvidasalunostoprofessor` no Supabase/PostgreSQL.

## 3. UI/UX (consistência arquitetural)
- Comportamento visual idêntico na gaveta lateral de pesquisa (`Pesquisar.tsx`), na Central de Dúvidas (`DuvidasBox.tsx`) e no contador de pendências da barra lateral (`AppSidebar.tsx`).
- Atualização dos slides interativos de Engenharia de Software em `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`.

## 4. Acessibilidade
- Nenhuma alteração nos componentes Radix (`Sheet`, `Tabs`, `DropdownMenu`, `Dialog`) ou atributos ARIA existentes.

## 5. Desempenho e Segurança
- As estratégias operam sobre coleções em memória sem mutar os arrays originais (`readonly T[]` → novo `T[]`) e são memoizadas via `useMemo` nos hooks React.

## 6. Arquivos Tocados
- `.agents/features/fase-3-strategy-filtros.md` (novo)
- `.agents/decisions/adr-005-strategy-filtros-pesquisa-duvidas.md` (novo)
- `.agents/INICIALIZACAO.md`
- `src/patterns/strategy/FiltroStrategy.ts` (novo)
- `src/patterns/strategy/README.md`
- `src/hooks/PesquisaHooks/type.ts`
- `src/hooks/PesquisaHooks/usePesquisa.ts`
- `src/components/Pesquisar.tsx`
- `src/hooks/DuvidaHooks/type.ts`
- `src/hooks/DuvidaHooks/useDuvidas.ts`
- `src/components/DuvidasBox.tsx`
- `src/components/AppSidebar.tsx`
- `testes/patterns/strategy/filtroStrategy.spec.ts` (novo)
- `.docs/DOCUMENTACAO_APRESENTACAO.md`
- `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`
- `relatorios/2026-11/2026-11-05-fase-3-strategy-filtros.md` (novo)

## 7. Matriz de Risco
| Componente/Alvo | Nível RBT | Estratégia |
|:---|:---|:---|
| `src/patterns/strategy/FiltroStrategy.ts` (estratégias de turmas e dúvidas) | Nível 2 (Lógica Pura) | Testes unitários determinísticos por Particionamento de Equivalência e Tabela de Decisão cobrindo busca textual (matéria, professor, sala, código), abas (`minhas`, `disponiveis`, `todas`), papéis (`aluno`, `professor`, `master`, `null`) e status (`todas`, `pendentes`, `resolvidas`) |
| `usePesquisa.ts` & `useDuvidas.ts` | Nível 2 / Nível 3 (Integração Hook + Strategy) | Testes com `renderHook` validando troca dinâmica de estratégia (`setAbaAtiva`, `setFiltro`), reset de filtro ao trocar perfil e cálculo de `totalDuvidasPendentes` |

## 8. Validação
- [x] Typecheck (`npx tsc -b --noEmit`)
- [x] Testes da feature (`npx vitest run testes/patterns/strategy/ --silent`)
- [x] Sem regressão (`npx vitest run` e `npm run test:coverage` — 6 suítes / 78 testes passando, 100% de cobertura em `src/lib` e `src/patterns`)
- [x] `.docs/DOCUMENTACAO_APRESENTACAO.md` e `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts` atualizados

## 9. Procedimento de Rollback
Reverter `src/hooks/PesquisaHooks/`, `src/hooks/DuvidaHooks/`, `src/components/Pesquisar.tsx`, `src/components/DuvidasBox.tsx` e `src/components/AppSidebar.tsx`, e remover `src/patterns/strategy/FiltroStrategy.ts` e `testes/patterns/strategy/filtroStrategy.spec.ts`.
