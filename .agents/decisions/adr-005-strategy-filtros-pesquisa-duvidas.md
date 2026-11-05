# ADR-005: Padrão Strategy (`FiltroStrategy`) para Filtragem de Turmas e Central de Dúvidas

- **Data:** 2026-11-05
- **Autor / Responsável:** Gianlucca Paiva (`GianluccaPaiva`)
- **Status:** Implementado
> ADR aprovada nunca é reescrita; cria-se nova e marca-se a anterior como substituída.

## 1. Contexto e Motivação
Na inspeção cirúrgica do código antes da Fase 3, identificamos dois problemas arquiteturais relacionados à filtragem de dados:
1. **Fragmentação e condicionais na Pesquisa de Turmas (`usePesquisa.ts` + `Pesquisar.tsx`):**
   - `src/hooks/PesquisaHooks/usePesquisa.ts` realizava apenas a busca textual parcial (retornando `[]` quando o campo estava vazio), enquanto `src/components/Pesquisar.tsx` concentrava blocos condicionais acoplados à árvore JSX para decidir a lista base (`textoPesquisa.trim() === ""`), filtrar por papel (`isProfessor`, `isAluno`) e por aba (`abaAtiva === "minhas"`, `"disponiveis"`, `"todas"`), além de ordenar turmas inscritas no topo.
2. **Duplicação de regras e condicionais na Central de Dúvidas (`useDuvidas.ts` + `DuvidasBox.tsx` + `AppSidebar.tsx`):**
   - `src/components/DuvidasBox.tsx` continha dois encadeamentos `.filter()` com `if` para filtrar por papel (`master`, `professor`, `aluno`) e por status (`todas`, `pendentes`, `resolvidas`).
   - `src/components/AppSidebar.tsx` duplicava exatamente a mesma regra condicional de filtragem por papel + status pendente (`!d.resolvido`) para exibir o badge de dúvidas pendentes na barra lateral.
   - Como essas regras residiam dentro dos componentes React (Nível 1), testá-las exigia montar componentes complexos em vez de exercitar funções puras (Nível 2 RBT).

## 2. Decisão Arquitetural
1. **Contrato Genérico `FiltroStrategy<T, Contexto = void>` (`src/patterns/strategy/FiltroStrategy.ts`):**
   - Definir uma interface uniforme com o método `filtrar(itens: readonly T[], contexto: Contexto): T[]`.
   - Implementar estratégias concretas sem estado (*stateless*) para ambos os domínios:
     - **Turmas (`TurmaEntry`):** `FiltroTurmaPorTextoStrategy`, `FiltroTurmasInscritasStrategy`, `FiltroTurmasDisponiveisStrategy` e `FiltroTodasTurmasStrategy`, orquestradas por `obterEstrategiaFiltroTurma(abaAtiva, role)` e pela função de pipeline `filtrarEOrdenarTurmas`.
     - **Dúvidas (`Duvida`):** `FiltroDuvidasPorPerfilStrategy`, `FiltroTodasDuvidasStrategy`, `FiltroDuvidasPendentesStrategy` e `FiltroDuvidasResolvidasStrategy`, orquestradas por `obterEstrategiaStatusDuvida(status)` e pela função de pipeline `filtrarDuvidasPorPerfilEStatus`.
2. **Consolidação nos Hooks (`usePesquisa.ts` e `useDuvidas.ts`):**
   - `usePesquisa` passa a gerenciar `abaAtiva` (`"minhas" | "disponiveis" | "todas"`) e expor `turmasOrdenadas` calculada via Strategy, mantendo `turmasFiltradas` por compatibilidade.
   - `useDuvidas` passa a gerenciar `filtro` (`"todas" | "pendentes" | "resolvidas"`) e expor `duvidasFiltradas`, `duvidasFiltradasPorStatus` e `totalDuvidasPendentes`, eliminando a duplicação entre `DuvidasBox.tsx` e `AppSidebar.tsx` e removendo os usos de `any`.

## 3. Alternativas Consideradas e Descartadas (Anti-Decisões)
| Alternativa | Motivo do descarte |
|:---|:---|
| Manter os `.filter()` inline dentro de `Pesquisar.tsx`, `DuvidasBox.tsx` e `AppSidebar.tsx` | Viola o Princípio Aberto/Fechado (OCP) e o SRP, mantém código duplicado entre `DuvidasBox` e `AppSidebar` e impede testes unitários puros de Nível 2 RBT |
| Criar uma hierarquia de classes com herança (*Template Method*) para filtros | Descartado pelo plano mestre (`.docs/PLANEJAMENTO_REFATORACAO.md`): composição de estratégias via interface `FiltroStrategy<T, Contexto>` é mais simples, idiomática em TypeScript e evita overengineering |

## 4. Mapeamento de Arquivos
- `src/patterns/strategy/FiltroStrategy.ts`
- `src/patterns/strategy/README.md`
- `src/hooks/PesquisaHooks/type.ts`
- `src/hooks/PesquisaHooks/usePesquisa.ts`
- `src/components/Pesquisar.tsx`
- `src/hooks/DuvidaHooks/type.ts`
- `src/hooks/DuvidaHooks/useDuvidas.ts`
- `src/components/DuvidasBox.tsx`
- `src/components/AppSidebar.tsx`
- `testes/patterns/strategy/filtroStrategy.spec.ts`

## 5. Antes vs. Depois
- **Antes:** Lógica de filtragem espalhada e duplicada em 3 componentes (`Pesquisar.tsx`, `DuvidasBox.tsx`, `AppSidebar.tsx`) e parcial em `usePesquisa.ts`, com `0%` de cobertura unitária das regras de negócio de filtro.
- **Depois:** Todas as regras de filtragem e ordenação residem em estratégias puras em `src/patterns/strategy/FiltroStrategy.ts` (100% cobertas por testes de Nível 2 RBT) e são consumidas declarativamente pelos hooks `usePesquisa` e `useDuvidas`.

## 6. Análise de Risco e Mitigação
- **Risco:** Divergência sutil na listagem quando a busca textual está vazia (`textoPesquisa.trim() === ""`) ou quando o usuário é `professor` / `master`.
- **Mitigação:** `filtrarEOrdenarTurmas` reproduz exatamente a regra original de `Pesquisar.tsx`: ordena alfabeticamente por `materia` quando a busca está vazia, aplica `FiltroTurmasInscritasStrategy` para `professor`, `FiltroTodasTurmasStrategy` para `master`, a estratégia da aba ativa para `aluno` e prioriza turmas inscritas no topo.

## 7. Consequências (Trade-offs)
- **Positivas:** Eliminação de condicionais e duplicação nos componentes visuais; adição de novos filtros (ex.: filtrar dúvidas por turma ou por anexo) passa a exigir apenas uma nova estratégia sem alterar os componentes; testes executam em poucos milissegundos sem I/O.
- **Negativas:** Nenhuma sobrecarga perceptível em tempo de execução.

## 8. Comandos de Rollback
`git checkout -- src/hooks/PesquisaHooks/ src/hooks/DuvidaHooks/ src/components/Pesquisar.tsx src/components/DuvidasBox.tsx src/components/AppSidebar.tsx && rm -rf src/patterns/strategy/FiltroStrategy.ts testes/patterns/strategy/`
