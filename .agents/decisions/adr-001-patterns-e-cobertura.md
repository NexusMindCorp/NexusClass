# ADR-001: Pasta `src/patterns/` e cobertura com `@vitest/coverage-v8`

- **Data:** 2026-10-19
- **Autor / Responsável:** Gabriel Lineker (`GabrielLineker`)
- **Status:** Aprovado
> ADR aprovada nunca é reescrita; cria-se nova e marca-se a anterior como substituída.

## 1. Contexto e Motivação
O trabalho DCC061 exige demonstrar Design Patterns + Testes. É preciso (a) um local claro para os padrões, com documentação simples de cada um, e (b) evidência numérica da evolução dos testes entre fases.

## 2. Decisão Arquitetural
1. Padrões ficam em `src/patterns/<padrao>/` (código + `README.md` curto: *por quê*, *como funciona*, *exemplo*). Os hooks de domínio continuam em `src/hooks/` e passam a consumir os padrões. Testes espelham em `testes/patterns/<padrao>/`.
2. Instalar `@vitest/coverage-v8@5.0.0` (mesma versão do `vitest`) como devDependency. Cobertura restrita a `src/lib` e `src/patterns`. Snapshots de cada fase registrados em `.docs/DOCUMENTACAO_APRESENTACAO.md`.

## 3. Alternativas Consideradas e Descartadas (Anti-Decisões)
| Alternativa | Motivo do descarte |
|:---|:---|
| Padrões dentro de cada `<Dominio>Hooks/` | Dispersa o catálogo; pior para apresentar e para o diagrama |
| `@vitest/coverage-istanbul` | Mais lento/pesado; v8 tem remapeamento por AST com precisão equivalente; projeto roda em Node/jsdom |
| Cobertura global de `src/` | Número enganoso (UI nível 1 não é testada) |
| Não medir cobertura | Sem evidência quantitativa de evolução |

## 4. Mapeamento de Arquivos
`src/patterns/**`, `testes/patterns/**`, `package.json` (devDependency + script `test:coverage`), `vite.config.ts` (bloco `test.coverage`).

## 5. Antes vs. Depois
Antes: 1 spec (`testes/ui/button.spec.tsx`), sem cobertura. Depois: baseline e snapshots por fase.

## 6. Análise de Risco e Mitigação
Risco baixo: só devDependency. Manter versão alinhada ao `vitest` (erro de peer se divergir).

## 7. Consequências
+ Histórico numérico por fase. − Uma dependência de dev a mais e pequeno tempo extra por execução com cobertura.

## 8. Comandos de Rollback
`npm uninstall @vitest/coverage-v8`; remover bloco `coverage` do `vite.config.ts` e o script `test:coverage`; apagar `src/patterns/` se necessário.
