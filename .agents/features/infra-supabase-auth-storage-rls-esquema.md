# Feature: Adaptação do Esquema SQL (`docker/constructionsSQL/`) para Supabase Auth, Storage e RLS

- **Registro:** 2026-11-16
- **Autor / Responsável:** Gianlucca Paiva (`GianluccaPaiva`)
- **Status:** Concluído
- **Risco (RBT):** Nível 1/2 (Camada de persistência SQL e políticas RLS; sem alteração em código TypeScript/React da SPA)
- **Validação:** Revisão estática de integridade referencial, remoção de colunas/sequências legadas via `Select-String`, inspeção de `git diff` em `01_esquema.sql` e verificação das 18 tabelas + `storage.objects` em `04_supabase_auth_rls.sql` (sem execução contra instância ativa do Supabase nesta sessão)

## 1. Visão Geral
Evolução dos scripts em `docker/constructionsSQL/` para operação nativa no **Supabase**:
1. Vinculação da tabela `Perfil` e de todas as suas 16 FKs ao `auth.users(id)` (via `UUID`) diretamente no DDL de criação (`01_esquema.sql`).
2. Vinculação das 4 tabelas de arquivos (`Atividade_Anexo`, `Entrega_Atividade`, `Duvida_Anexo`, `Ticket_Suporte_Anexo`) ao `storage.objects(id)` e provisionamento dos 4 buckets privados em `storage.buckets`.
3. Criação do arquivo exclusivo de Row Level Security `04_supabase_auth_rls.sql` cobrindo todas as 18 tabelas de `public` e os 4 buckets em `storage.objects`.
4. Adaptação de `02_carga.sql` para usar UUIDs determinísticos e pré-carga em `auth.users` e `storage.objects`, mantendo integralmente a massa de dados original (10.013 usuários, 25 atividades e >200.000 entregas).

## 2. Não-Objetivos (Non-Goals)
- Não alterar hooks, componentes ou fachadas React/TypeScript em `src/` (como `useMural.ts`, `useDuvidas.ts` ou `EntregaAtividadeFacade.ts`).
- Não incluir triggers (`handle_new_user`), funções auxiliares `SECURITY DEFINER` nem `GRANT`s dentro de `04_supabase_auth_rls.sql`.
- Não adaptar `docker/constructionsSQL/03_verificacao.sql` nesta etapa (permanece como próximo passo opcional).

## 3. UI/UX (consistência arquitetural)
Não aplicável (escopo exclusivo de scripts SQL em `docker/constructionsSQL/`).

## 4. Acessibilidade
Não aplicável.

## 5. Desempenho e Segurança
- **Auth (`auth.uid()`):** Todas as políticas usam `(SELECT auth.uid())` para permitir caching por initPlan no PostgreSQL.
- **Anti-escalonamento de privilégios:** Política de `UPDATE` em `Perfil` impede alteração do próprio `role`; política de `UPDATE` (reenvio) em `Entrega_Atividade` bloqueia alteração fraudulenta de `nota` e `feedback` pelo aluno; `Denuncia` e `Ticket_Suporte` forçam `status = 'pendente'`, `id_master IS NULL` e resposta/parecer nulo na inserção.
- **Storage (`storage.objects`):** Buckets configurados com `public = FALSE`, comparando `owner_id = (SELECT auth.uid()::text)` e verificando vínculo de turma/autoria/papel sem executar `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY` (que causaria erro `42501`).
- **Carga massiva (`02_carga.sql`):** Geração de 10.000 alunos (`auth.users` + `Perfil`) e 200.000 entregas (`storage.objects` + `Entrega_Atividade`) preservada via `generate_series` e `CROSS JOIN`, finalizando com `ANALYZE`.

## 6. Arquivos Tocados
- `docker/constructionsSQL/01_esquema.sql` (atualizado)
- `docker/constructionsSQL/02_carga.sql` (atualizado)
- `docker/constructionsSQL/04_supabase_auth_rls.sql` (novo)
- `.agents/decisions/adr-008-esquema-sql-supabase-auth-storage-rls.md` (novo)
- `.agents/features/infra-supabase-auth-storage-rls-esquema.md` (novo)
- `.agents/INICIALIZACAO.md` (atualizado)
- `.docs/DOCUMENTACAO_APRESENTACAO.md` (atualizado)
- `relatorios/2026-11/2026-11-16-esquema-supabase-auth-storage-rls.md` (novo)

## 7. Matriz de Risco
| Risco | Impacto | Mitigação |
|:---|:---|:---|
| Tentativa de executar `03_verificacao.sql` sem adaptar IDs inteiros/`url` | Médio | Registrar explicitamente no relatório que `03_verificacao.sql` continua com o formato antigo |
| Upload no Storage exigir registro prévio na tabela de anexo | Alto | Políticas `INSERT` em `storage.objects` validam papel/matrícula do usuário sem exigir linha prévia em `Atividade_Anexo`/`Entrega_Atividade`/`Duvida_Anexo`/`Ticket_Suporte_Anexo`; aplicação deve enviar ao Storage primeiro e usar o `id` no `INSERT` da tabela |
| Leitura via `getPublicUrl()` com buckets `public = FALSE` | Médio | Documentar uso de `createSignedUrl()` / download autenticado para leitura respeitando RLS |
| Cadastro via `signUp()` sem trigger de criação de `Perfil` | Médio | Documentar necessidade de inserir `Perfil` na aplicação ou adicionar trigger dedicada em script próprio |

## 8. Validação
- [x] `git diff` de `01_esquema.sql` conferido (`Perfil.id_perfil` + 16 FKs como `UUID`, 4 colunas `id_objeto_storage` + `fk_*_storage`, 4 buckets em `storage.buckets`)
- [x] `Select-String` em `04_supabase_auth_rls.sql` confirmou todas as 18 tabelas com `ENABLE ROW LEVEL SECURITY` e 4 buckets em `storage.objects` (sem `CREATE FUNCTION`, `CREATE TRIGGER`, `GRANT` ou `ALTER TABLE storage.objects`)
- [x] `Select-String` em `02_carga.sql` confirmou remoção de `entrega_url`, `(url,` e `pg_get_serial_sequence('Perfil'...)`, preservando os dados nominais e as 200.000 entregas em lote
- [ ] Execução ponta-a-ponta dos scripts em uma instância ativa do Supabase (pendente para validação no ambiente de destino)

## 9. Procedimento de Rollback
```powershell
git checkout -- docker/constructionsSQL/01_esquema.sql docker/constructionsSQL/02_carga.sql
Remove-Item docker/constructionsSQL/04_supabase_auth_rls.sql
```
