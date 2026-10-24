---
name: security-policy
description: Guardrails de segurança (OWASP) para código gerado por IA.
scope: universal
always_on: true
---

# Segurança
1. **Zero segredos hardcoded:** chaves só via `.env` (`VITE_*`); nunca commitar `.env`. Nos testes, usar valores fictícios.
2. **Armazenamento seguro:** nada sensível em `localStorage` além do que já existe (preferências/leitura de mensagens).
3. **TLS obrigatório** em toda comunicação externa.
4. **Sanitização** de inputs/outputs; preservar `formatarErroSupabase` e os nomes de arquivo higienizados.
5. **Higiene de produção:** sem `console.log` de dados de usuário. (O exemplo do Proxy na análise com `console.log` não deve ser copiado.)
- Preservar RLS/triggers do Supabase: refatorações de front não podem remover validações de backend.
- Nota conhecida: `VITE_GEMINI_KEY` é embutida no bundle (risco aceito no escopo acadêmico; citar na documentação).
