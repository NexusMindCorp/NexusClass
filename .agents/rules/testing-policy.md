---
name: testing-policy
description: Matriz de testes por risco (RBT) adaptada a Vitest + Testing Library + Playwright.
scope: universal
always_on: true
---

# Política de Testes

## Matriz por risco
| Nível | Alvo | Abordagem |
|:---|:---|:---|
| 1 — Visual/UI | Estilos, textos estáticos, cores | **Sem testes** (nem snapshots) |
| 2 — Lógica pura | `src/lib/utils.ts`, Strategies, Factories, formatadores | Unitários determinísticos, zero I/O |
| 3 — Crítico/fronteira | Facade (Supabase), Adapter (Gemini), Observer, Proxy de rota, fluxo de entrega | Integração direcionada; mocks **só na borda externa** (cliente Supabase / SDK Gemini) |

## Regras
- Padrão **AAA** (Arrange/Act/Assert). Testar comportamento/contrato, nunca detalhes privados.
- Sem `sleep`; usar `vi.useFakeTimers()` ou `waitFor`/`findBy*`.
- Localização: `testes/<area>/<nome>.spec.ts(x)` (alias `@ts`). Já existe `testes/ui/button.spec.tsx`.
- Globais de build (`__URL_SUPABASE__`, `__KEY_SUPABASE__`, `__API_GEMINI_KEY__`) devem ser definidos em `setupTests.ts` (via `vi.stubGlobal`) ou o módulo mockado — nunca usar chaves reais.
- Execução cirúrgica: `npx vitest run <arquivo> --silent`.
- Para o trabalho acadêmico: registrar em `.docs/DOCUMENTACAO_APRESENTACAO.md` como cada teste contribui para a qualidade (ex.: Adapter permite testar o chatbot sem rede).
- E2E (Playwright): somente fluxos críticos (login → entrega); nunca rodar contra produção com dados reais.
