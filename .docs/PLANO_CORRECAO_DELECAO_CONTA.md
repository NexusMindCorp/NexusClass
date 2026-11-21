# Plano de Correção — Deleção de Conta (`deletar-conta`) — Opção A (Enxuta)

- **Autor:** Gianlucca Paiva (`GianluccaPaiva`)
- **Data:** 2026-11-21
- **Frente:** Fase 6 / Passo 9-B — Ordem 3 (Item: Exclusão de conta)
- **Projeto Supabase analisado:** Supabase de teste (`REF_DO_PROJETO`)
- **Status:** **Concluído e validado ponta a ponta** em 2026-11-21 (migração `14` aplicada, Edge Function e frontend refatorados, deploy ativo com slug `deletar-conta`, função legada `bright-task` removida e auditoria pós-exclusão com `0` registros remanescentes em Auth, banco e Storage). Evidências em [2026-11-21-correcao-validacao-exclusao-conta.md](../relatorios/2026-11/2026-11-21-correcao-validacao-exclusao-conta.md).

---

## 1. Diagnóstico do Estado Atual (Evidências Reais)

A auditoria direta no banco, na Edge Function implantada e no frontend identificou:

1. **Cadeia `ON DELETE CASCADE` no PostgreSQL está coesa para `role = 'aluno'`:**
   - `auth.users(id)` → `public.perfil(id_perfil)` (`CASCADE`) → `aluno_turma`, `entrega_atividade`, `duvida` (`→ duvida_anexo`), `mural_post` (`→ comentario_mural`), `comentario_mural`, `evento_calendario` (`→ alerta_calendario`), `mensagem`, `denuncia`, `ticket_suporte` (`→ ticket_suporte_anexo`) — todas com `ON DELETE CASCADE`.
   - `atividade(id_professor)` usa `ON DELETE RESTRICT`, coerente com a trava `perfil.role !== 'aluno'` (`403`) na Edge Function.
   - `storage.objects` não possui FK para `auth.users` e possui o trigger `protect_objects_delete`, exigindo remoção via Storage API (`storage.remove()`).
2. **Falha crítica #1 — Divergência de `slug` no Supabase (`404`):**
   - A função publicada no Supabase de teste possui `name = "deletar-conta"`, porém **`slug = "bright-task"`**.
   - O frontend ([`BoxAlertaDeletaConta.tsx`](../src/components/BoxAlertaDeletaConta.tsx)) chama `/functions/v1/deletar-conta`, resultando em `404 Not Found`.
3. **Falha crítica #2 — Limpeza do Storage falha silenciosamente (`PGRST106`) e na ordem errada:**
   - A Edge Function chama `supabaseAdmin.schema("storage").from("objects")`, mas o schema `storage` não está exposto no PostgREST (retorna `PGRST106` sem lançar exceção) e todos os `{ error }` são ignorados.
   - Além disso, apagar no Storage **antes** de `auth.admin.deleteUser(user.id)` viola a atomicidade: o `storage.remove()` não possui rollback e aciona `ON DELETE CASCADE` em `entrega_atividade` / anexos antes mesmo de o usuário ser excluído.
4. **Arquivo legado duplicado:**
   - [`docker/edge_function/deletar-conta/index.ts`](../docker/edge_function/deletar-conta/index.ts) ainda aponta para o esquema antigo (`perfis`, `entregas_atividades`, `aluno_id`, etc.).

---

## 2. Decisão Arquitetural — Por que Opção A (e não Outbox)

Foi avaliada a alternativa de *Transactional Outbox* (tabela privada `storage_limpeza_pendente` + trigger `BEFORE DELETE ON public.perfil` + 3 RPCs), descartada para este projeto pelos seguintes critérios de boas práticas (YAGNI / sem *overengineering*):

- Sem um *worker* assíncrono automático (`pg_net` + reprocessador), a tabela *Outbox* não drena sozinha e vira apenas log manual.
- Um trigger `BEFORE DELETE ON public.perfil` dispara inclusive em `DELETE`s administrativos/manuais fora da Edge Function.
- No Supabase não existe 2PC entre Auth/Postgres e S3; logo, após o commit de `deleteUser()`, nenhuma estratégia recria a conta se o S3 oscilar.

**Solução adotada (Opção A):** **1 única RPC somente-leitura** (`service_role` only) + **inversão da ordem de execução na Edge Function** (coletar caminhos em memória → excluir usuário no Postgres de forma 100% ACID → remover arquivos no Storage em lotes com checagem explícita de `{ error }`).

### Garantias e Limites Explícitos
- **Garantido (100% desfeito em caso de erro):** qualquer falha na validação (`POST`, JWT, `role = 'aluno'`), na listagem de objetos pela RPC ou durante `auth.admin.deleteUser(user.id)` dispara `ROLLBACK` ACID automático no PostgreSQL **sem tocar em nenhum arquivo do Storage**.
- **Limite conhecido (pós-commit):** se a chamada `storage.remove()` falhar *após* o `deleteUser()` já ter confirmado o commit no banco, a conta permanece excluída com integridade referencial preservada no Postgres, e a Edge Function registra no log estruturado os caminhos/buckets que falharam para limpeza posterior (sem perder integridade do banco nem deixar a conta em estado meio-apagado).

---

## 3. Passo a Passo de Execução

### Passo 1 — Migração SQL (`14_rpc_storage_exclusao_conta.sql`)
- **Arquivo:** [`docker/constructionsSQL/14_rpc_storage_exclusao_conta.sql`](../docker/constructionsSQL/14_rpc_storage_exclusao_conta.sql) *(já criado)*.
- **Conteúdo:** cria somente a função `public.listar_objetos_storage_perfil(p_id_perfil UUID)` (`STABLE`, `SECURITY DEFINER`, `SET search_path = ''`), revogada de `PUBLIC`, `anon` e `authenticated` e liberada exclusivamente para `service_role`.
- **Ação:** aplicar no Supabase de teste e incluir na sequência da Ordem 4 (após `13_bloqueia_evento_em_data_passada.sql`).

### Passo 2 — Refatoração da Edge Function (`supabase/functions/deletar-conta/index.ts`)
1. Rejeitar métodos HTTP diferentes de `POST` (exceto `OPTIONS`) com `405 Method Not Allowed`.
2. Validar cabeçalho `Authorization` no formato `Bearer <token>` e autenticar via `supabaseAdmin.auth.getUser(token)` (`401`).
3. Verificar em `public.perfil` que `role === 'aluno'` (`403` para `professor`/`master`).
4. **Leitura prévia (0 efeitos colaterais):** chamar `supabaseAdmin.rpc("listar_objetos_storage_perfil", { p_id_perfil: user.id })`, checando `{ data, error }`. Se houver erro, abortar com `500` **antes** de mutar o banco.
5. **Commit atômico no banco (Pivot Transaction):** executar `supabaseAdmin.auth.admin.deleteUser(user.id)`. Se retornar erro, retornar `500` (Postgres faz `ROLLBACK` total; Storage segue intacto).
6. **Limpeza do Storage pós-commit:** agrupar os caminhos coletados por `bucket_id` e chamar `supabaseAdmin.storage.from(bucket).remove(lote)` em lotes de até 100 itens, validando `{ error }` de cada lote e registrando qualquer falha parcial em log estruturado (e indicando no payload se houve pendência de Storage sem mascarar erro silenciosamente).

### Passo 3 — Limpeza do Repositório e Ajuste no Frontend
1. Remover ou sincronizar a cópia obsoleta [`docker/edge_function/deletar-conta/index.ts`](../docker/edge_function/deletar-conta/index.ts) para evitar deploy acidental do código legado na Ordem 4.
2. Em [`src/components/BoxAlertaDeletaConta.tsx`](../src/components/BoxAlertaDeletaConta.tsx):
   - Substituir o `fetch` manual com `(supabase as any)` e `?apikey=` na querystring por `supabase.functions.invoke("deletar-conta")` (ou envio seguro de cabeçalhos sem expor chave na URL).
   - Evitar chamar `onClose()` dentro do `finally` quando houver erro (ex.: senha incorreta), fechando o modal apenas em caso de sucesso ou clique em *Cancelar*.

### Passo 4 — Deploy no Supabase de teste
1. Aplicar `14_rpc_storage_exclusao_conta.sql` no Supabase de teste.
2. Publicar a Edge Function com **`slug = "deletar-conta"`** e `verify_jwt = true`.
3. Remover a função obsoleta com slug **`bright-task`** no painel do Supabase.

### Passo 5 — Validação (Ordem 3 — mediante autorização da dupla)
1. **Testes sem exclusão de dados reais:**
   - Conferir no SQL que `listar_objetos_storage_perfil` rejeita execução por `anon` e `authenticated` e funciona para `service_role`.
   - Conferir que chamada com método `GET` retorna `405` e conta `professor` / `master` retorna `403` sem alterar banco nem Storage.
2. **Teste de ponta a ponta com conta descartável autorizada (Gabriel + Gianlucca):**
   - Preparar aluno descartável com matrícula, entrega + arquivo (`entregas_atividades`), dúvida + anexo (`duvidasalunostoprofessor`) e ticket + anexo (`anexos_suporte`).
   - Executar exclusão pelo fluxo da aplicação (`BoxAlertaDeletaConta` → `/functions/v1/deletar-conta`).
   - Conferir evidências finais:
     - `auth.users`: 0 registros
     - `public.perfil` e tabelas filhas: 0 registros
     - `storage.objects` (por `id` e por `owner_id`/`owner`): 0 registros remanescentes
     - Sessão encerrada e login bloqueado após exclusão.

---

## 4. Referências
- [Plano de validação — Fase 6 e Passo 9-B](PLANO_VALIDACAO_FASE_6_E_9B.md#ordem-3--decisões-da-dupla)
- [Migração 14 (Opção A)](../docker/constructionsSQL/14_rpc_storage_exclusao_conta.sql)
- [Edge Function oficial](../supabase/functions/deletar-conta/index.ts)
- [Modal de confirmação no frontend](../src/components/BoxAlertaDeletaConta.tsx)
