# Troubleshooting: Erro 429 (Too Many Requests) no Signup do Supabase (`over_email_send_rate_limit`)

- **Data:** 2026-11-17
- **Autor / Responsável:** Gianlucca Paiva (`GianluccaPaiva`)
- **Ambiente:** Browser (SPA React + Vite) → Supabase Auth hospedado (`https://qexobdhuwxcoeteqnlcn.supabase.co/auth/v1/signup`)
- **Severidade:** Alta (bloqueia novos cadastros em testes consecutivos quando a confirmação por e-mail está ativa)
- **Status:** Mitigado na UI / Aguardando configuração no painel Supabase

## Sintomas e Erro
Ao submeter o formulário de cadastro em [`src/components/Login.tsx`](../../src/components/Login.tsx) (`supabase.auth.signUp`), o console do navegador registra erro HTTP 429 antes mesmo do trigger `on_auth_user_created` ou logo após poucas tentativas seguidas:

```text
POST https://qexobdhuwxcoeteqnlcn.supabase.co/auth/v1/signup 429 (Too Many Requests)
```

O código retorna `status: 429` e/ou `code: "over_email_send_rate_limit"` (ou cooldown de 60 segundos entre envios para o mesmo endereço).

## Causa Raiz
1. O provedor de e-mail embutido (*built-in SMTP*) de projetos Supabase hospedados no plano padrão impõe limite rígido de **2 e-mails/hora por projeto** quando **Confirm email** está habilitado, além de janela mínima entre reenvios e restrições para envio a destinatários fora da organização do projeto.
2. Como cada chamada `signUp` tenta disparar o e-mail de confirmação no servidor Auth (`/auth/v1/signup`), atingir esse teto faz o endpoint retornar `429` independentemente do frontend.

## Solução Definitiva
No Dashboard do projeto Supabase (`Authentication → Providers → Email` e `Project Settings → Authentication → SMTP Settings`):
1. **Ambiente acadêmico / testes locais ou E2E:** desabilitar **Confirm email** (ou usar instância Supabase local com Inbucket/Mailpit) para que `signUp` não consuma cota de disparo externo.
2. **Ambiente de produção / entrega:** configurar um **Custom SMTP** (Resend, Postmark, SES, Brevo etc.) e calibrar os *Rate Limits* em `Authentication → Rate Limits`.

## Workaround (Já Aplicado no Frontend)
Em [`src/components/Login.tsx`](../../src/components/Login.tsx) (commit `618db71`):
- Adicionada trava contra duplo clique (`if (loading) return`) durante o `handleSubmit`;
- Adicionada detecção explícita de `status === 429`, `code === "over_email_send_rate_limit"`, `"rate limit"` e `"only request this after"`, exibindo mensagem explicativa em português ao usuário;
- Os campos `email`, `password`, `nome` e `idEscola` são preservados em caso de erro para evitar perda do preenchimento;
- Quando `signUp` cria a conta com confirmação pendente (`!data.session`), a tela exibe toast orientando confirmar o e-mail e alterna para o modo de login.

## Prevenção
- Não usar `signUp` repetido em suítes E2E contra o projeto Supabase hospedado com SMTP padrão ativo; preferir seed pré-carregado (`docker/constructionsSQL/02_carga.sql`), usuários fixos de teste ou criação via `auth.admin.createUser` no ambiente local do Passo 9-B / Fase 6.
