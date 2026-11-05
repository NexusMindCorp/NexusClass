# Strategy (`FiltroStrategy`)

**Por quê:** Antes da Fase 3, as regras de filtragem de turmas (`Inscritas`, `Disponíveis`, `Todas` + busca por matéria, professor, sala e código) estavam divididas entre `src/hooks/PesquisaHooks/usePesquisa.ts` e condicionais inline em `src/components/Pesquisar.tsx`. Da mesma forma, os filtros da Central de Dúvidas por papel (`aluno`, `professor`, `master`) e por status (`todas`, `pendentes`, `resolvidas`) estavam acoplados e duplicados em `src/components/DuvidasBox.tsx` e `src/components/AppSidebar.tsx`.

**Como funciona (`src/patterns/strategy/FiltroStrategy.ts`):**
- Contrato genérico `FiltroStrategy<T, Contexto = void>` com método `filtrar(itens: readonly T[], contexto: Contexto): T[]`.
- **Domínio de Turmas (`TurmaEntry`):**
  - `FiltroTurmaPorTextoStrategy`: busca case-insensitive por matéria, professor, sala ou código.
  - `FiltroTurmasInscritasStrategy` (`minhas`), `FiltroTurmasDisponiveisStrategy` (`disponiveis`) e `FiltroTodasTurmasStrategy` (`todas`), selecionadas via `obterEstrategiaFiltroTurma(abaAtiva, role)` e compostas em `filtrarEOrdenarTurmas`.
- **Domínio de Dúvidas (`Duvida`):**
  - `FiltroDuvidasPorPerfilStrategy`: isola a regra de visibilidade por papel (`aluno`, `professor`, `master` ou `null`).
  - `FiltroTodasDuvidasStrategy` (`todas`), `FiltroDuvidasPendentesStrategy` (`pendentes`) e `FiltroDuvidasResolvidasStrategy` (`resolvidas`), selecionadas via `obterEstrategiaStatusDuvida(status)` e compostas em `filtrarDuvidasPorPerfilEStatus`.

**Status:** **Concluído (Fase 3)** — 100% de cobertura em `testes/patterns/strategy/filtroStrategy.spec.ts`.
