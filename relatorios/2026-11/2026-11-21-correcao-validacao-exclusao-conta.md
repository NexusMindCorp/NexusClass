# Correção e Validação Ponta a Ponta — Exclusão de Conta (`deletar-conta`)

- **Autor:** Gianlucca Paiva (`GianluccaPaiva`)
- **Data:** 2026-11-21
- **Frente:** Fase 6 / Passo 9-B — Ordem 3 (Item: Exclusão de conta)
- **Ambiente:** Supabase de teste (`REF_DO_PROJETO`)

---

## 1. Resumo das Correções Aplicadas (Opção A — Enxuta)

1. **Migração SQL ([`14_rpc_storage_exclusao_conta.sql`](../../docker/constructionsSQL/14_rpc_storage_exclusao_conta.sql)):**
   - Criada a função somente-leitura `public.listar_objetos_storage_perfil(UUID)` (`STABLE`, `SECURITY DEFINER`, `search_path = ''`), com `EXECUTE` revogado de `PUBLIC`, `anon` e `authenticated` e concedido exclusivamente a `service_role`.
   - Elimina o acesso direto a `supabaseAdmin.schema("storage").from("objects")` (que falhava silenciosamente com `PGRST106`), sem expor o schema `storage` no PostgREST e sem criar tabelas ou triggers com efeitos colaterais.
2. **Edge Function ([`supabase/functions/deletar-conta/index.ts`](../../supabase/functions/deletar-conta/index.ts)):**
   - Espelhada também em [`docker/edge_function/deletar-conta/index.ts`](../../docker/edge_function/deletar-conta/index.ts) (removendo a versão legada pré-remodelagem).
   - Fluxo reordenado para preservar atomicidade: pré-validações (`POST` / `Bearer` / JWT / `role = 'aluno'`) → coleta prévia via RPC → `auth.admin.deleteUser(user.id)` (transação ACID única com `ON DELETE CASCADE`) → remoção em lotes de até 100 arquivos via Storage API com verificação explícita de `{ error }`.
   - Publicada no Supabase de teste com **`slug = "deletar-conta"`** (`ACTIVE`, `verify_jwt: true`); função duplicada anterior (`bright-task`) removida do painel.
3. **Frontend ([`BoxAlertaDeletaConta.tsx`](../../src/components/BoxAlertaDeletaConta.tsx)):**
   - Migrado de `fetch` manual com `(supabase as any)` e `?apikey=` na querystring para `supabase.functions.invoke("deletar-conta")`.
   - Removido `onClose()` do `finally` em caso de erro e desabilitado o botão *Cancelar* durante o processamento.

---

## 2. Arquivos Tocados

| Arquivo | Ação | Finalidade |
|:---|:---|:---|
| [`docker/constructionsSQL/14_rpc_storage_exclusao_conta.sql`](../../docker/constructionsSQL/14_rpc_storage_exclusao_conta.sql) | Criado | RPC somente-leitura `listar_objetos_storage_perfil(UUID)` exclusiva de `service_role` |
| [`supabase/functions/deletar-conta/index.ts`](../../supabase/functions/deletar-conta/index.ts) | Refatorado | Ordem segura (coleta RPC → `deleteUser` ACID → `storage.remove` em lotes) e validações HTTP/JWT |
| [`docker/edge_function/deletar-conta/index.ts`](../../docker/edge_function/deletar-conta/index.ts) | Sincronizado | Substituída a cópia legada pré-remodelagem pela versão oficial |
| [`src/components/BoxAlertaDeletaConta.tsx`](../../src/components/BoxAlertaDeletaConta.tsx) | Refatorado | Troca de `fetch` manual por `supabase.functions.invoke("deletar-conta")` e preservação do modal em erro |
| [`scripts/validar-exclusao-conta.mjs`](../../scripts/validar-exclusao-conta.mjs) | Criado | Roteiro reproduzível de validação ponta a ponta (sem credenciais ou `ref` fixos) |
| [`.docs/PLANO_CORRECAO_DELECAO_CONTA.md`](../../.docs/PLANO_CORRECAO_DELECAO_CONTA.md) | Criado | Registro do diagnóstico, justificativa da Opção A e plano de execução |
| [`.docs/PLANO_VALIDACAO_FASE_6_E_9B.md`](../../.docs/PLANO_VALIDACAO_FASE_6_E_9B.md) | Atualizado | Registro da conclusão e evidências do item Exclusão de conta (Ordem 3) |
| [`.docs/DOCUMENTACAO_APRESENTACAO.md`](../../.docs/DOCUMENTACAO_APRESENTACAO.md) | Atualizado | Handoff, Painel de Progresso e Diário de Sessões |
| [`.agents/features/fase-6-validacao-sistema.md`](../../.agents/features/fase-6-validacao-sistema.md) | Atualizado | Checklist da Fase 6 com a exclusão de conta validada |
| [`.agents/INICIALIZACAO.md`](../../.agents/INICIALIZACAO.md) | Atualizado | Status e responsáveis da Fase 6 na tabela mestre |
| [`src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`](../../src/hooks/InfoAplicacao/configEngenhariaSoftware.ts) | Atualizado | Slides interativos DCC061 (16 suítes / 125 testes + status da Fase 6) |

---

## 3. Evidências de Validação Ponta a Ponta

Execução do roteiro [`scripts/validar-exclusao-conta.mjs`](../../scripts/validar-exclusao-conta.mjs) contra o Supabase de teste com conta descartável criada via cadastro público (`auth.signUp`, escola `1`, matrícula em `DCC001`):

| Cenário | Esperado | Observado | Status |
|:---|:---|:---|:---|
| Funções ativas no Supabase de teste | Apenas `deletar-conta` (`slug: "deletar-conta"`, `verify_jwt: true`) | Confirmado via `list_edge_functions` (`bright-task` removida) | **Passou** |
| Permissão da RPC `listar_objetos_storage_perfil` | `PUBLIC`/`anon`/`authenticated` = `false`; `service_role` = `true` | Confirmado no catálogo `pg_proc` e chamada como `authenticated` recusada (`42501`) | **Passou** |
| Método HTTP inválido (`GET /functions/v1/deletar-conta`) | HTTP `405` | HTTP `405` | **Passou** |
| Chamada sem cabeçalho `Authorization` | HTTP `401` | HTTP `401` | **Passou** |
| Massa descartável nos 3 buckets + 1 arquivo órfão | Upload + vínculos em `aluno_turma`, `entrega_atividade`, `duvida`/`duvida_anexo`, `ticket_suporte`/`ticket_suporte_anexo`, `evento_calendario` e 1 arquivo em `anexos_suporte` sem registro em tabela | 4 arquivos criados sob RLS real + todos os registros gravados | **Passou** |
| Invocação `supabase.functions.invoke("deletar-conta")` | HTTP `200`, `storage_limpeza_parcial: false`, `arquivos_removidos: 4`, `arquivos_com_falha: 0` | `{"message":"Conta e dados deletados com sucesso","storage_limpeza_parcial":false,"arquivos_removidos":4,"arquivos_com_falha":0}` | **Passou** |
| Tentativa de login após exclusão | Rejeição por credenciais inválidas | `invalid_credentials` | **Passou** |
| Auditoria administrativa no banco pós-exclusão | `0` linhas em `auth.users`, `perfil`, todas as tabelas filhas e `storage.objects` (por `id` e por `owner_id`/`owner`) | `auth_users=0`, `perfil=0`, `aluno_turma=0`, `entrega_atividade=0`, `duvida=0`, `duvida_anexo=0`, `ticket_suporte=0`, `ticket_suporte_anexo=0`, `evento_calendario=0`, `storage_por_id=0`, `storage_por_owner=0` | **Passou** |
| Validação local (TypeScript + Vitest) | `0` erros de compilação e suíte verde | `tsc` (`tsconfig.app.json` + `tsconfig.node.json`) = `0` erros; Vitest = **16 arquivos / 125 testes passando** | **Passou** |

### Limites de cobertura desta rodada
- O bloqueio `403` para `professor`/`master` está validado por inspeção de código e mantido na Edge Function, sem ter sido reexecutado ao vivo nesta rodada para evitar alterar/tocar sessões de contas docentes compartilhadas.

---

## 4. Handoff / Ponto de Retomada
- **Executado por:** Gianlucca Paiva (`GianluccaPaiva`) em 2026-11-21.
- **O que ficou pronto:** Item **Exclusão de conta** da **Ordem 3** corrigido, implantado com slug oficial `deletar-conta` (`bright-task` removida) e validado ponta a ponta no Supabase de teste.
- **Impactos para as próximas etapas:** Na **Ordem 4** (carga isolada), incluir [`14_rpc_storage_exclusao_conta.sql`](../../docker/constructionsSQL/14_rpc_storage_exclusao_conta.sql) após `13_bloqueia_evento_em_data_passada.sql` e publicar a Edge Function com slug `deletar-conta`.
- **Próximo passo exato do planejamento:** Decisão da dupla sobre os itens restantes da **Ordem 3** (**Código público da escola**, **Banners reais** e **Reenvio de confirmação de e-mail**) e, após fechá-los, validação em instalação isolada + atualização do pacote `grupo24/` (**Ordem 4**).
