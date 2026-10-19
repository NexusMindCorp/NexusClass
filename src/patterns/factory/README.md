# Factory

**Por quê:** existem dois bots (Tigreso e Falcão Peregrino) com prompts e configurações distintos (`configBot.ts`), e a tela ativa é escolhida por `acessouOq` em `GerenciadorTelas`. Escolher por tipo fica espalhado em condicionais.

**Como funciona:** um ponto único de criação recebe o tipo e devolve o objeto/configuração certo. Adicionar um novo tipo muda apenas a fábrica.

**Exemplo (esboço):**
```ts
type TipoBot = 'tigreso' | 'falcao'
export function criarAssistente(tipo: TipoBot): IAssistenteIA { /* escolhe config + adapter */ }
```
**Status:** Planejado (Fase 1)
