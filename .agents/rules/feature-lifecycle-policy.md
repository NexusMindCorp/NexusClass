---
name: feature-lifecycle-policy
description: Ciclo de vida obrigatório de features e refatorações.
scope: universal
always_on: true
---

# Ciclo de Vida de Features e Continuidade entre Fases
0. **Retomada (Handoff de Entrada):** Antes de qualquer atualização ou transição para uma nova fase, ler o estado deixado pelo processo anterior (`.docs/DOCUMENTACAO_APRESENTACAO.md` + último relatório em `relatorios/<mes-ano>/`) e cruzar com `.docs/PLANEJAMENTO_REFATORACAO.md`. Continuar exatamente a partir do ponto anterior, reaproveitando contratos, helpers, mocks e decisões já implementados.
1. **Planejado:** spec criada em `.agents/features/<slug>.md` (a partir do template) antes de qualquer código.
2. **Em Andamento:** código + testes; tabela em `INICIALIZACAO.md` atualizada.
3. **Concluído:** `npx tsc -b --noEmit` limpo, testes da feature passando, sem regressão nos testes existentes.
4. **Registro e Passagem de Bastão (Handoff de Saída):** atualizar `.docs/DOCUMENTACAO_APRESENTACAO.md` (incluindo o bloco *Ponto de Retomada* no topo) e registrar o relatório em `relatorios/<mes-ano>/` detalhando o que foi concluído e o que o próximo membro/fase deve consumir.

Refatoração deve preservar comportamento observável; qualquer mudança funcional exige aval.
