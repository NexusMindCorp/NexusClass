# Strategy

**Por quê:** `usePesquisa` (Inscritas/Disponíveis/Todas + busca por matéria, professor, sala e código) e `useDuvidas` (Todos/Pendente/Resolvida) decidem o filtro com condicionais. Cada novo critério exige editar o hook (viola Aberto/Fechado).

**Como funciona:** cada critério é uma função/objeto com a mesma assinatura; o hook apenas aplica a estratégia escolhida. Estratégias são puras, logo triviais de testar.

**Exemplo (esboço):**
```ts
export type FiltroStrategy<T> = (itens: T[]) => T[]
export const apenasPendentes: FiltroStrategy<Duvida> = (d) => d.filter((x) => !x.resolveu)
```
**Status:** Planejado (Fase 3)
