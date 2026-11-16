# Relatório de Sessão — Adaptação do Esquema SQL (`docker/constructionsSQL/`) para Supabase Auth, Storage e RLS

- **Data:** 2026-11-16
- **Autor / Responsável:** Gianlucca Paiva (`GianluccaPaiva`)
- **Branch:** `DesiningTeste`
- **Status:** **Concluído** (Esquema, RLS e carga massiva adaptados para `auth.users` e `storage.objects` do Supabase; validação estática realizada)

## 1. Resumo das Entregas
1. **Adaptação do DDL em `docker/constructionsSQL/01_esquema.sql`:**
   - **Integração com Supabase Auth (`auth.users`):** `Perfil.id_perfil` alterado de `SERIAL` para `UUID NOT NULL` com `CONSTRAINT fk_perfil_auth_users FOREIGN KEY (id_perfil) REFERENCES auth.users (id) ON DELETE CASCADE`, e todas as **16 colunas de FK** nas **11 tabelas dependentes** (`Professor_Turma`, `Aluno_Turma`, `Atividade`, `Entrega_Atividade`, `Duvida`, `Mural_Post`, `Comentario_Mural`, `Evento_Calendario`, `Mensagem`, `Denuncia` e `Ticket_Suporte`) convertidas para `UUID`.
   - **Integração com Supabase Storage (`storage.objects` e `storage.buckets`):** Substituídas as colunas `url` / `entrega_url` por `id_objeto_storage UUID NOT NULL` com FK `ON DELETE CASCADE` para `storage.objects(id)` em `Atividade_Anexo`, `Entrega_Atividade`, `Duvida_Anexo` e `Ticket_Suporte_Anexo`. Adicionado provisionamento idempotente (`ON CONFLICT (id) DO NOTHING`) dos 4 buckets privados (`public = FALSE`): `anexos_atividades`, `entregas_atividades`, `duvidasalunostoprofessor` e `anexos_suporte`.
2. **Criação do Arquivo Exclusivo de RLS (`docker/constructionsSQL/04_supabase_auth_rls.sql`):**
   - Criado arquivo contendo exclusivamente regras de Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, `DROP POLICY IF EXISTS` e `CREATE POLICY`) para todas as **18 tabelas** do esquema `public` usando `(SELECT auth.uid())` e subqueries `EXISTS` diretas (sem triggers, funções auxiliares ou `GRANT`s).
   - Proteções específicas implementadas: bloqueio de auto-promoção de `role` no `UPDATE` de `Perfil`, bloqueio de adulteração de `nota` e `feedback` no reenvio pelo aluno em `Entrega_Atividade`, e validação de `status = 'pendente'` / campos nulos de moderação em `Denuncia` e `Ticket_Suporte`.
   - Incluída a **Seção 19 (`storage.objects`)** com políticas `SELECT`, `INSERT`, `UPDATE` e `DELETE` para os 4 buckets usando `owner_id = (SELECT auth.uid()::text)` e vínculos com as tabelas de anexo/entrega (sem `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY`, evitando erro `42501` no Supabase).
3. **Adaptação da Carga de Dados (`docker/constructionsSQL/02_carga.sql`):**
   - Preservadas integralmente todas as cargas originais (3 escolas, 4 turmas, 13 usuários nominais + 10.000 alunos em lote, 25 atividades, 6 entregas nominais + 200.000 entregas em lote, dúvidas, posts, comentários, eventos, alertas, mensagens, denúncias e tickets).
   - Mapeados os IDs `1..10013` para UUIDs determinísticos (`00000000-0000-0000-0000-<N com 12 dígitos>`) com pré-carga em `auth.users`, remoção do `setval` de `Perfil` e atualização das FKs em todas as tabelas filhas.
   - Adicionada pré-carga em `storage.objects` (`10000000-...`, `20000000-...`, `30000000-...`, `40000000-...`, incluindo os 200.000 objetos em lote) vinculada via `id_objeto_storage` nas 4 tabelas de anexos/entregas.
4. **Governança e Documentação (`.agents/` e `.docs/`):**
   - Criados `.agents/decisions/adr-008-esquema-sql-supabase-auth-storage-rls.md` e `.agents/features/infra-supabase-auth-storage-rls-esquema.md`.
   - Atualizados `.agents/INICIALIZACAO.md`, `.docs/DOCUMENTACAO_APRESENTACAO.md` e criado este relatório em `relatorios/2026-11/`.

## 2. Arquivos Tocados
- `docker/constructionsSQL/01_esquema.sql` (atualizado)
- `docker/constructionsSQL/02_carga.sql` (atualizado)
- `docker/constructionsSQL/04_supabase_auth_rls.sql` (novo)
- `.agents/decisions/adr-008-esquema-sql-supabase-auth-storage-rls.md` (novo)
- `.agents/features/infra-supabase-auth-storage-rls-esquema.md` (novo)
- `.agents/INICIALIZACAO.md` (atualizado)
- `.docs/DOCUMENTACAO_APRESENTACAO.md` (atualizado)
- `relatorios/2026-11/2026-11-16-esquema-supabase-auth-storage-rls.md` (novo)

## 3. Validação e Testes Executados
- **Conferência de alterações DDL (`git diff docker/constructionsSQL/01_esquema.sql`):** Confirmada a alteração exclusiva de `Perfil.id_perfil` + 16 FKs para `UUID`, substituição de `url`/`entrega_url` por `id_objeto_storage` com FK para `storage.objects(id)` e inserção dos 4 buckets em `storage.buckets`.
- **Verificação estática das políticas (`Select-String` em `04_supabase_auth_rls.sql`):** Confirmadas as 18 tabelas com `ENABLE ROW LEVEL SECURITY` e as políticas para os 4 buckets em `storage.objects`, com ausência de `CREATE FUNCTION`, `CREATE TRIGGER`, `GRANT` ou `ALTER TABLE storage.objects`.
- **Verificação estática da carga (`Select-String` em `02_carga.sql`):** Confirmada a remoção de `entrega_url`, `(url,` e `pg_get_serial_sequence('Perfil'...)`.
- **Aplicação/TypeScript:** Nenhum arquivo `.ts`/`.tsx` alterado; `npx tsc -b --noEmit` não executado conforme regra do `GEMINI.md`.
- **Execução em banco ativo:** Os scripts adaptados **não** foram executados contra uma instância ativa do Supabase/PostgreSQL nesta sessão.

## 4. Handoff / Ponto de Retomada para a Próxima Sessão
- **Quem executou esta sessão:** Gianlucca Paiva (`GianluccaPaiva`).
- **O que ficou pronto:**
  - Scripts SQL da trilha de banco (`01_esquema.sql`, `04_supabase_auth_rls.sql` e `02_carga.sql`) alinhados com `auth.users`, `storage.buckets`/`storage.objects` e RLS completo do Supabase.
  - Ordem recomendada de execução no SQL Editor do Supabase: `01_esquema.sql` → `04_supabase_auth_rls.sql` → `02_carga.sql`.
- **Pontos de atenção / Impactos:**
  - `docker/constructionsSQL/03_verificacao.sql` ainda usa IDs inteiros e colunas `url`/`entrega_url` — precisa ser adaptado caso seja executado contra este esquema.
  - Como `04_supabase_auth_rls.sql` contém apenas RLS (sem trigger `on_auth_user_created`), novos cadastros via `supabase.auth.signUp()` no Supabase demandam criação de `Perfil` pela aplicação ou uma trigger dedicada.
  - Como os 4 buckets foram criados com `public = FALSE`, leituras devem usar `createSignedUrl()` / download autenticado (em vez de `getPublicUrl()`).
- **Próximos Passos Disponíveis:**
  1. **Trilha Banco / Supabase:** Validar a execução de `01_esquema.sql` → `04_supabase_auth_rls.sql` → `02_carga.sql` no Supabase e, se necessário, adaptar `03_verificacao.sql`.
  2. **Trilha DCC061 — Fase 6 (Planejado):** Implementar Testes de Componente (`ProtectedRoute`, `BoxRestrito`, filtro de dúvidas) e Teste E2E (Playwright), consolidar cobertura e atualizar a Fase 7 (`InfoAplicacao.tsx` / `configEngenhariaSoftware.ts`).
