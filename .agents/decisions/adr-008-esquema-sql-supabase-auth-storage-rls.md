# ADR-008: Integração do Esquema SQL (`docker/constructionsSQL/`) com Supabase Auth, Storage e RLS

- **Data:** 2026-11-16
- **Autor / Responsável:** Gianlucca Paiva (`GianluccaPaiva`)
- **Status:** Implementado
> ADR aprovada nunca é reescrita; cria-se nova e marca-se a anterior como substituída.

## 1. Contexto e Motivação
Os scripts acadêmicos de construção do banco em `docker/constructionsSQL/` (`01_esquema.sql` e `02_carga.sql`) utilizavam originalmente chaves primárias `SERIAL` (`INTEGER`) na tabela `Perfil` e colunas `TEXT` (`url` / `entrega_url`) para armazenar caminhos de arquivos. Para operar nativamente no **Supabase** integrado ao **Supabase Auth (`auth.users`)**, ao **Supabase Storage (`storage.buckets` / `storage.objects`)** e à proteção em camadas com **Row Level Security (RLS)**, era necessário adaptar o esquema relacional, as políticas de acesso e o script de carga mantendo intactas as entidades, regras de negócio e o volume de dados de teste.

## 2. Decisão Arquitetural
1. **Vínculo direto de `Perfil` ao Supabase Auth na criação (`01_esquema.sql`):**
   - Alterar `Perfil.id_perfil` de `SERIAL` para `UUID NOT NULL`, com `CONSTRAINT fk_perfil_auth_users FOREIGN KEY (id_perfil) REFERENCES auth.users (id) ON DELETE CASCADE` diretamente no `CREATE TABLE`.
   - Converter para `UUID` as 16 colunas de chave estrangeira nas 11 tabelas filhas que referenciam `Perfil(id_perfil)` (`Professor_Turma`, `Aluno_Turma`, `Atividade`, `Entrega_Atividade`, `Duvida`, `Mural_Post`, `Comentario_Mural`, `Evento_Calendario`, `Mensagem`, `Denuncia` e `Ticket_Suporte`).
2. **Vínculo referencial de anexos/entregas ao Supabase Storage (`01_esquema.sql`):**
   - Substituir `url TEXT NOT NULL` / `entrega_url TEXT NOT NULL` por `id_objeto_storage UUID NOT NULL` com `FOREIGN KEY (id_objeto_storage) REFERENCES storage.objects (id) ON DELETE CASCADE` nas 4 tabelas de arquivos: `Atividade_Anexo` (`fk_ativ_anexo_storage`), `Entrega_Atividade` (`fk_entrega_storage`), `Duvida_Anexo` (`fk_duvida_anexo_storage`) e `Ticket_Suporte_Anexo` (`fk_ticket_anexo_storage`).
   - Provisionar de forma idempotente (`ON CONFLICT (id) DO NOTHING`) os 4 buckets privados (`public = FALSE`) em `storage.buckets`: `anexos_atividades`, `entregas_atividades`, `duvidasalunostoprofessor` e `anexos_suporte`.
3. **Arquivo dedicado exclusivamente às regras de RLS (`04_supabase_auth_rls.sql`):**
   - Isolar `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, `DROP POLICY IF EXISTS` e `CREATE POLICY` das 18 tabelas de `public` + políticas `ON storage.objects` para os 4 buckets em um arquivo separado.
   - Expressar todas as verificações de papel (`master`, `professor`), matrícula ativa em `Aluno_Turma`, autoria, proteção contra auto-promoção de `role` em `Perfil` e proteção contra fraude de `nota`/`feedback` em `Entrega_Atividade` diretamente via subqueries `EXISTS` (sem funções auxiliares `SECURITY DEFINER`, `GRANT`s ou triggers extras no arquivo de RLS).
   - Omitir `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY` para evitar erro `42501 must be owner of table objects` no Supabase, e usar `owner_id = (SELECT auth.uid()::text)` (padrão atual do Supabase Storage).
4. **Adaptação determinística da carga (`02_carga.sql`):**
   - Mapear os IDs inteiros `1..10013` para UUIDs determinísticos (`00000000-0000-0000-0000-<N com 12 dígitos>`), realizando pré-carga em `auth.users` e removendo `setval` de `Perfil`.
   - Realizar pré-carga em `storage.objects` (`10000000-...` para `Atividade_Anexo`, `20000000-...` para `Entrega_Atividade` — 6 nominais + 200.000 em lote, `30000000-...` para `Duvida_Anexo` e `40000000-...` para `Ticket_Suporte_Anexo`), preservando integralmente todos os registros originais.

## 3. Alternativas Consideradas e Descartadas (Anti-Decisões)
| Alternativa | Motivo do descarte |
|:---|:---|
| Manter `01_esquema.sql` com `SERIAL` e migrar via `ALTER TABLE / ALTER COLUMN` | Decidido corrigir a PK/FK já na criação para manter o DDL limpo e sem sequência órfã (`perfil_id_perfil_seq`) |
| Manter `url` / `entrega_url` junto com `id_objeto_storage` | Optado pela substituição direta por `id_objeto_storage UUID NOT NULL REFERENCES storage.objects(id) ON DELETE CASCADE` para garantir integridade referencial estrita com o Storage |
| Incluir trigger `handle_new_user()`, funções `SECURITY DEFINER` e `GRANT`s em `04_supabase_auth_rls.sql` | Solicitado explicitamente manter apenas regras de RLS em `04_supabase_auth_rls.sql` |
| Deixar buckets do Storage com `public = TRUE` | `public = FALSE` garante que leituras de arquivos passem obrigatoriamente pelas políticas RLS em `storage.objects` via URL assinada/autenticada |

## 4. Mapeamento de Arquivos
- `docker/constructionsSQL/01_esquema.sql` (atualizado)
- `docker/constructionsSQL/02_carga.sql` (atualizado)
- `docker/constructionsSQL/04_supabase_auth_rls.sql` (novo)

## 5. Antes vs. Depois
- **Antes:** `Perfil` usava `SERIAL` (`INTEGER`) desvinculado de `auth.users`, anexos/entregas guardavam apenas `TEXT` (`url` / `entrega_url`) sem vínculo com `storage.objects`, `02_carga.sql` usava inteiros `1..10013` e não havia script de políticas RLS para essas 18 tabelas.
- **Depois:** `01_esquema.sql` nasce vinculado a `auth.users(id)` e `storage.objects(id)` com os 4 buckets em `storage.buckets`; `04_supabase_auth_rls.sql` protege as 18 tabelas de `public` e os 4 buckets em `storage.objects`; e `02_carga.sql` preserva os 10.013 usuários e 200.006 entregas usando UUIDs determinísticos.

## 6. Análise de Risco e Mitigação
- **Risco 1:** O script `03_verificacao.sql` ainda usa IDs inteiros e colunas `url`/`entrega_url`, falhando se executado sem adaptação sobre o novo esquema.
  - **Mitigação:** Documentar a pendência de adaptação de `03_verificacao.sql` no relatório e no Handoff.
- **Risco 2:** Sem trigger `on_auth_user_created` em `04_supabase_auth_rls.sql`, cadastros via `supabase.auth.signUp()` no frontend exigem inserção de `Perfil` pela aplicação ou criação de trigger à parte; além disso, buckets `public = FALSE` requerem `createSignedUrl()` / download autenticado (e não `getPublicUrl()`).
  - **Mitigação:** Registrar explicitamente esses requisitos operacionais na spec e no relatório de entrega.
- **Risco 3:** O PostgreSQL local puro (sem schemas `auth` e `storage` do Supabase) não possui `auth.users` nem `storage.objects`.
  - **Mitigação:** Scripts voltados ao ambiente Supabase (ordem de execução: `01_esquema.sql` → `04_supabase_auth_rls.sql` → `02_carga.sql`).

## 7. Consequências (Trade-offs)
- **Positivas:** Integridade referencial forte entre usuários de autenticação (`auth.users`), perfis, arquivos no Storage (`storage.objects`) e exclusão em cascata; proteção completa via RLS no banco e nos buckets sem código duplicado em triggers/funções extras.
- **Negativas / Atenção:** Dependência explícita dos schemas `auth` e `storage` do Supabase e necessidade de alinhar `03_verificacao.sql` e eventuais chamadas `getPublicUrl()` / fluxo de criação de perfil no `signUp()`.

## 8. Comandos de Rollback
```powershell
git checkout -- docker/constructionsSQL/01_esquema.sql docker/constructionsSQL/02_carga.sql
Remove-Item docker/constructionsSQL/04_supabase_auth_rls.sql
```
