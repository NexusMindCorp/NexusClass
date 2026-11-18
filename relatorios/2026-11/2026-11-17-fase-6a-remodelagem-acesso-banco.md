# Relatório de Sessão — Fase 6-A (Remodelagem de Interfaces e Acesso ao Banco para o Esquema Normalizado)

- **Data:** 2026-11-17
- **Autor:** Gianlucca Paiva (`GianluccaPaiva`)
- **Branch:** `DesiningTeste` (últimos commits desta entrega: `6a0dd61`, `618db71`, `b193442`)
- **Status:** **Fase 6-A Concluída (Passos 0–10)** *(Passo 9-B — validação de RLS ao vivo — agendado para o fechamento junto à Fase 6)*

## 1. Resumo das Entregas
1. **Diagnóstico Arquitetural (`graphify-out/`) vs. Esquema Novo (ADR-008):**
   - Mapeadas ~85 chamadas `.from()/.storage/.channel` em 19 arquivos de `src/` falando com o esquema legado sem tipagem estática (`createClient` sem `<Database>`).
   - Identificadas 4 lacunas no SQL novo e criado o script complementar [`docker/constructionsSQL/05_supabase_funcoes_realtime.sql`](../../docker/constructionsSQL/05_supabase_funcoes_realtime.sql) (sem modificar `01`, `02` ou `04`):
     - `handle_new_user()` + trigger `on_auth_user_created` (papel fixo `'aluno'`, `id_escola` validado via `ck_perfil_escola_por_role`);
     - publicação idempotente das 5 tabelas em `supabase_realtime` + `REPLICA IDENTITY FULL` em `Entrega_Atividade`;
     - policy aditiva de `DELETE` para o professor da turma no bucket `entregas_atividades`;
     - `fn_processar_alertas_calendario()` via `pg_cron` (Decisão 3);
     - view segura `public.v_storage_objetos` (`WITH (security_invoker = true)`) para resolver `id_objeto_storage` → caminho do bucket respeitando as RLS de `storage.objects`.
   - Ordem recomendada de carga definida como `01 → 04 → 02 → 05` (para preservar os papéis `master`/`professor`/`aluno` de `02_carga.sql` antes do trigger).
2. **Tipagem Estática e Data Mappers (Passos 2–3):**
   - Criado [`src/lib/database.types.ts`](../../src/lib/database.types.ts) espelhando as 18 tabelas e a view `v_storage_objetos`, e tipado `createClient<Database>` em [`src/lib/supabaseClient.ts`](../../src/lib/supabaseClient.ts) (o compilador `tsc` expôs inicialmente 106 erros em 10 arquivos).
   - Criado [`src/lib/db/mappers.ts`](../../src/lib/db/mappers.ts) e atualizados os contratos em `src/hooks/*/type.ts` (`AnexoRef[]`, `id_escola`, remoção de `updated_at` / `assunto` obsoletos, IDs `SERIAL` expostos como `string` no domínio).
3. **Facades 1FN, 6 Repositories e Observer (Passos 4–6):**
   - Criada [`src/patterns/facade/AnexoStorageFacade.ts`](../../src/patterns/facade/AnexoStorageFacade.ts) (genérica para `atividade_anexo`, `duvida_anexo` e `ticket_suporte_anexo`, `createSignedUrls`, compensação em falha de `insert`, remoção via Storage API).
   - Atualizada [`src/patterns/facade/EntregaAtividadeFacade.ts`](../../src/patterns/facade/EntregaAtividadeFacade.ts) (ordem segura no reenvio: `upload` → `upsert` → `remove` antigo, impedindo perda de entrega por `ON DELETE CASCADE`).
   - Criados os 6 Repositories aprovados na ADR-009 em `src/repositories/` (`PerfilRepository`, `EscolaTurmaRepository`, `AtividadeRepository`, `DuvidaRepository`, `MuralRepository`, `ComunicacaoRepository`).
   - Migrados todos os hooks, componentes consumidores e [`src/patterns/observer/NotificacaoSubject.ts`](../../src/patterns/observer/NotificacaoSubject.ts) (5 canais Realtime em tabela declarativa).
4. **Protection Proxy, Ajustes de UI e Edge Function (Passos 7–8):**
   - Criado [`src/lib/permissoes.ts`](../../src/lib/permissoes.ts) (`pode.*`) alinhado às RLS.
   - [`src/components/Login.tsx`](../../src/components/Login.tsx): campo numérico obrigatório `id_escola` no cadastro (sem expor lista de escolas), trava de duplo clique, tratamento de `!data.session` e tradução de `429` (`over_email_send_rate_limit`) sem apagar o formulário.
   - `BoxAgendamento.tsx` e `BoxAtividade.tsx`: `horario` e `data_entrega` obrigatórios (`NOT NULL`).
   - `TurmaCard.tsx` e `ListagemConteudosInscritos.tsx`: matrícula/desinscrição restrita a `aluno` da mesma escola (`RN12`); `EscolaTurmaRepository.carregarDadosEscola` bloqueia fallback para outra escola quando `role !== 'master'`.
   - [`supabase/functions/deletar-conta/index.ts`](../../supabase/functions/deletar-conta/index.ts): migrada para `perfil`/`id_perfil`, limpeza dos 3 buckets privados pela Storage API e `auth.admin.deleteUser()` com `ON DELETE CASCADE`.
5. **Testes, Slides e Diagrama UML (Passos 9-A e 10):**
   - Atualizadas 3 suítes (`entregaAtividadeFacade`, `notificacaoObserver`, `filtroStrategy`) e criadas 6 novas (`mappers`, `permissoes`, `anexoStorageFacade`, `atividadeRepository`, `escolaTurmaRepository`, `duvidaRepository`).
   - Atualizados [`src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`](../../src/hooks/InfoAplicacao/configEngenhariaSoftware.ts), [`out/diagramas/diagrama_classes_detalhado.puml`](../../out/diagramas/diagrama_classes_detalhado.puml), [`.docs/DOCUMENTACAO_APRESENTACAO.md`](../../.docs/DOCUMENTACAO_APRESENTACAO.md), [`.agents/INICIALIZACAO.md`](../../.agents/INICIALIZACAO.md) e [`.agents/features/fase-6a-remodelagem-acesso-banco.md`](../../.agents/features/fase-6a-remodelagem-acesso-banco.md).

## 2. Problemas Encontrados, Causa Raiz e Soluções/Mitigações
| # | Problema Encontrado | Causa Raiz | Solução / Status | Guia `.agents/` |
|:---|:---|:---|:---|:---|
| 1 | Quebra generalizada entre SPA (`src/`) e o esquema normalizado (ADR-008): **~85 chamadas** dispersas e **106 erros `tsc`** ao tipar o cliente | `createClient()` não usava `<Database>`; hooks falavam direto com tabelas legadas (`perfis`, `atividades`, URLs públicas em JSON) | **Resolvido (Passos 2–5):** `database.types.ts` + `mappers.ts` + `AnexoStorageFacade` + 6 Repositories desacoplando hooks e componentes | [ADR-009](../../.agents/decisions/adr-009-camada-acesso-dados-esquema-normalizado.md) |
| 2 | 4 lacunas no SQL + ponte 1FN `id_objeto_storage -> path` | `01`/`04` não tinham trigger `handle_new_user`, publicação `supabase_realtime`, `DELETE` do professor em `entregas_atividades`, gerador de alertas nem view para resolver `storage.objects.name` | **Resolvido (Passos 1 e 3):** criado `05_supabase_funcoes_realtime.sql` (inclui `v_storage_objetos` com `security_invoker = true`); **pendente execução ao vivo no Supabase** | [Spec Fase 6-A](../../.agents/features/fase-6a-remodelagem-acesso-banco.md) |
| 3 | Conflito `02_carga.sql` × `on_auth_user_created` | `02_carga.sql` insere `auth.users` sem `id_escola` no metadata e define `master`/`professor`/`aluno`; disparar o trigger antes violaria `ck_perfil_escola_por_role` | **Resolvido (Passo 1):** ordem oficial documentada como `01 → 04 → 02 → 05` | [Plano 6-A](../../.docs/PLANEJAMENTO_REMODELAGEM_ACESSO_BANCO.md) |
| 4 | Exposição da lista de escolas no cadastro + fallback cruzado entre escolas | Dropdown inicial no `Login.tsx` expunha escolas a usuários não autenticados; `carregarDadosEscola` aceitava fallback quando a escola do perfil faltava | **Mitigado na SPA (Passo 7 + solicitação do usuário):** `Login.tsx` exige `id_escola` numérico direto e `EscolaTurmaRepository` bloqueia fallback quando `role !== 'master'`. *Nota em aberto:* `04_supabase_auth_rls.sql` ainda mantém `SELECT USING (true)` em `Escola`/`Turma` (conforme ADR-008) | [Spec Fase 6-A](../../.agents/features/fase-6a-remodelagem-acesso-banco.md) |
| 5 | Erro `POST .../auth/v1/signup 429 (Too Many Requests)` em `Login.tsx:48` | Limite padrão de **2 e-mails/hora** + cooldown do SMTP embutido no Supabase hospedado (`over_email_send_rate_limit`) quando *Confirm email* está ativo | **Mitigado na UI / Aberto no Supabase:** `Login.tsx` traduz `429`, trava duplo clique e preserva o formulário; falta desativar *Confirm email* ou configurar SMTP customizado no painel Supabase | [Troubleshooting 429](../../.agents/troubleshooting/supabase-signup-429-rate-limit.md) |
| 6 | Erro `EPERM` no sandbox Windows ao rodar `npx tsc -b --noEmit` (`TS5033`) e `npx vitest run` (`.vite-temp`) | Bloqueio de escrita em `node_modules/.tmp/*.tsbuildinfo` e `node_modules/.vite-temp/vite.config.ts.timestamp-*.mjs` dentro do sandbox | **Contornado:** usar `npx tsc -p tsconfig.app.json --noEmit --incremental false` para typecheck no sandbox e `npx vitest run --coverage` fora do sandbox (`BypassSandbox: true`) | [Troubleshooting EPERM](../../.agents/troubleshooting/vitest-tsc-eperm-sandbox-windows.md) |
| 7 | Pendências pré-existentes fora do escopo | `03_verificacao.sql` ainda usa tabelas legadas (non-goal desde ADR-008); Passo 9-B não rodou contra Supabase vivo; working tree mantém `D AGENTS.md` e `?? GEMINI.md` fora dos commits da Fase 6-A | **Aberto para fechamento:** Passo 9-B junto à Fase 6 e saneamento final na Fase 7 | [Handoff](../../.docs/DOCUMENTACAO_APRESENTACAO.md) |

## 3. Artefatos e Relatórios no `.agents/` e `.docs/`
- **ADR da arquitetura de acesso:** [`.agents/decisions/adr-009-camada-acesso-dados-esquema-normalizado.md`](../../.agents/decisions/adr-009-camada-acesso-dados-esquema-normalizado.md)
- **Especificação e checklist da Fase 6-A:** [`.agents/features/fase-6a-remodelagem-acesso-banco.md`](../../.agents/features/fase-6a-remodelagem-acesso-banco.md)
- **Índice mestre do `.agents/`:** [`.agents/INICIALIZACAO.md`](../../.agents/INICIALIZACAO.md)
- **Guias de troubleshooting criados nesta sessão:**
  - [`.agents/troubleshooting/supabase-signup-429-rate-limit.md`](../../.agents/troubleshooting/supabase-signup-429-rate-limit.md)
  - [`.agents/troubleshooting/vitest-tsc-eperm-sandbox-windows.md`](../../.agents/troubleshooting/vitest-tsc-eperm-sandbox-windows.md)
- **Planejamento detalhado & Doc viva:** [`.docs/PLANEJAMENTO_REMODELAGEM_ACESSO_BANCO.md`](../../.docs/PLANEJAMENTO_REMODELAGEM_ACESSO_BANCO.md) · [`.docs/DOCUMENTACAO_APRESENTACAO.md`](../../.docs/DOCUMENTACAO_APRESENTACAO.md)

## 4. Validação e Métricas (Reexecutado após o commit `b193442`)
- `npx tsc -p tsconfig.app.json --noEmit --incremental false`: **0 erros** em toda a pasta `src/` e `testes/`. *(Nota: `npx tsc -b --noEmit` falha apenas no sandbox por `EPERM` ao gravar `node_modules/.tmp/tsconfig.app.tsbuildinfo`.)*
- `npx vitest run --coverage` *(executado com `BypassSandbox: true`, pois no sandbox falha com `EPERM` em `node_modules/.vite-temp`)*: **13 suítes / 113 testes passando (100%)**.
- **Cobertura (`src/lib` + `src/patterns`):** **98% Statements | 92.87% Branch | 100% Functions | 100% Lines**.

## 5. Onde Parou & Handoff (Próxima Etapa: Fase 6 + Passo 9-B)
- **Onde parou:** Os **Passos 0 a 10 da Fase 6-A estão 100% implementados, testados e commitados** na branch `DesiningTeste` (até `b193442`), restando apenas os relatórios/troubleshootings de fechamento desta sessão (este documento e `.agents/troubleshooting/*.md`). No working tree atual permanecem apenas as alterações externas de governança (`D AGENTS.md` e `?? GEMINI.md`) e os novos arquivos de documentação/troubleshooting desta etapa.
- **Autor desta entrega:** Gianlucca Paiva (`GianluccaPaiva`).
- **Próximos passos exatos ao retomar:**
  1. **Infra / Painel Supabase:** executar [`05_supabase_funcoes_realtime.sql`](../../docker/constructionsSQL/05_supabase_funcoes_realtime.sql) na instância alvo (após `01 → 04 → 02`) e desativar **Confirm email** (ou configurar SMTP customizado) para eliminar o erro `429` no cadastro.
  2. **Fase 6 + Passo 9-B:** implementar os **Testes de Componente** (`ProtectedRoute`, `BoxRestrito`, filtro de dúvidas) com Testing Library, os **Testes E2E** com Playwright (`login → turma → entrega`) e os **Testes de integração RLS/triggers ao vivo** (`Passo 9-B`: `rls.spec.ts`, `alertasCalendario.spec.ts`, `handleNewUser.spec.ts`).
  3. **Fase 7 (Fechamento):** lapidar estilizações de [`src/components/InfoAplicacao.tsx`](../../src/components/InfoAplicacao.tsx), decidir sobre `AGENTS.md`/`GEMINI.md` e limpar `.agents/`/`.docs/`/`relatorios/` do rastreamento final conforme planejado no `.gitignore`.
