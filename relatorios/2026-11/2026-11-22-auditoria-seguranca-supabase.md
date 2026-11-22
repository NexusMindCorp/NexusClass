# Relatório de Auditoria de Segurança — Supabase (Banco, RLS, Funções, Storage e Auth)

- **Autor:** Gianlucca Paiva (`GianluccaPaiva`)
- **Data:** 2026-11-22
- **Branch:** `DesiningTeste`
- **Ambiente auditado:** Supabase de teste (`REF_DO_PROJETO`) — PostgreSQL 17.6 + GoTrue Auth + Storage + Edge Functions
- **Metodologia:** Auditoria baseada em evidências com verificação adversarial (`security-audit`), combinando **Supabase Security Advisors** (`get_advisors(security)`) e inspeção direta dos catálogos `pg_class`, `pg_policies`, `pg_proc`, `pg_trigger`, `information_schema.table_privileges`, `information_schema.column_privileges` e `storage.buckets`.
- **Relação com o Pentest anterior:** Complementa a camada de banco/infraestrutura do consolidado [`.docs/PENTEST_E_SEGURANCA_NEXUSCLASS.md`](../../.docs/PENTEST_E_SEGURANCA_NEXUSCLASS.md) (onde `V-01` a `V-05` já foram remediadas e validadas).

---

## 1. Resumo Executivo e Controles Já Conformes (Baseline Positivo)

Antes de listar as lacunas encontradas, a auditoria confirmou que os pilares críticos da arquitetura de segurança do NexusClass já estão ativos no Supabase de teste:

| Controle Auditado | Evidência Verificada | Status |
|:---|:---|:---|
| **Row Level Security (RLS)** | `18/18` tabelas em `public` com `relrowsecurity = true` | **Conforme ✅** |
| **View de Storage (`public.v_storage_objetos`)** | Configurada com `security_invoker = true`, bloqueada para `anon` e liberada para `authenticated` | **Conforme ✅** |
| **Privacidade dos Buckets** | `4/4` buckets (`anexos_atividades`, `anexos_suporte`, `duvidasalunostoprofessor`, `entregas_atividades`) com `public = false` | **Conforme ✅** |
| **Proteção contra `search_path` Hijacking** | Todas as funções do projeto (`public.*` e `nexusclass_private.*`) possuem `SET search_path = ''` | **Conforme ✅** |
| **Proteção de Coluna (`escola.codigo_publico`)** | Privilégio `SELECT` revogado para `anon` e `authenticated` (ADR-010) | **Conforme ✅** |
| **Autenticação das Edge Functions** | `3/3` funções (`deletar-conta`, `resend-email` v2, `resend-suport` v1) `ACTIVE` com `verify_jwt: true` | **Conforme ✅** |

### Síntese dos Vereditos da Auditoria
- **`CONFIRMED` (5 achados reais + 1 hardening complementar):** `S-01`, `S-02 (Partes 1 e 2)`, `S-03`, `S-04` e `S-06` (defesa em profundidade em grants de `anon`).
- **`NEEDS_VALIDATION` (1 configuração externa de painel/plano):** `S-05` (*Leaked Password Protection*).
- **`REJECTED` (1 falso positivo neutralizado na verificação adversarial):** alerta `0029` sobre `public.obter_codigo_publico_minha_escola()`.

---

## 2. Detalhamento das Vulnerabilidades e Lacunas

### S-01 — Função `SECURITY DEFINER` `public.rls_auto_enable()` exposta na API REST
- **Veredito / Severidade:** `CONFIRMED` · **Média**
- **Fonte:** Supabase Security Advisors (`0028_anon_security_definer_function_executable` e `0029_authenticated_security_definer_function_executable`) + `pg_proc`.
- **O que acontece (cenário de risco):**
  - A função `public.rls_auto_enable()`, criada por padrão como auxiliar de *event trigger*, possui `SECURITY DEFINER` (executa com privilégios elevados do dono) e permissão `EXECUTE` concedida a `anon` e `authenticated`.
  - Por estar no schema `public` (exposto pelo PostgREST), qualquer usuário — inclusive não autenticado — pode tentar invocá-la diretamente via `POST /rest/v1/rpc/rls_auto_enable`.
- **Como resolver:**
  ```sql
  REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()
  FROM PUBLIC, anon, authenticated;
  ```
- **O que afeta no projeto ao corrigir:**
  - **Impacto funcional:** **Zero.** A SPA, os scripts de validação, as Edge Functions e as 4 contas reservadas da apresentação nunca invocam essa função.
  - **Ganho:** Elimina imediatamente 2 alertas oficiais do Supabase Security Advisor.
- **Referência oficial:** [Supabase Database Linter 0028](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)

---

### S-02 (Parte 1) — Leitura pública sem autenticação (`anon`) nas tabelas `escola` e `turma`
- **Veredito / Severidade:** `CONFIRMED` · **Média**
- **Fonte:** `pg_policies` (`Escola: leitura publica` e `Turma: leitura publica`, ambas com `roles = {anon, authenticated}` e `qual = true`).
- **O que acontece (cenário de risco):**
  - Qualquer pessoa na internet, **sem fazer login**, utilizando apenas a chave pública `anon` presente no bundle da SPA, pode consultar `GET /rest/v1/escola` e `GET /rest/v1/turma`.
  - Isso expõe publicamente a lista completa de escolas (nomes, IDs internos, anos letivos) e todas as turmas (matérias, salas, períodos e **`codigo_acesso`**), facilitando reconhecimento e enumeração institucional antes mesmo de existir uma conta.
- **Como resolver:**
  - Recriar/alterar as políticas de `SELECT` em `public.escola` e `public.turma` restringindo o acesso de `TO anon, authenticated` para **`TO authenticated`** (exigindo sessão válida).
  - Atualizar também [`docker/constructionsSQL/04_supabase_auth_rls.sql`](../../docker/constructionsSQL/04_supabase_auth_rls.sql) para que futuras instalações limpas já nasçam fechadas.
- **O que afeta no projeto ao corrigir:**
  - **SPA (`src/`):** **Zero impacto.** Inspeção em `src/repositories/EscolaTurmaRepository.ts` confirmou que `escola` e `turma` só são consultadas após autenticação (`ProtectedRoute`). A tela `Login.tsx` (cadastro público) não lista escolas — o usuário informa o `codigo_escola` manualmente (ADR-010).
  - **Scripts / Testes:** Em [`scripts/validar-codigo-publico-escola.mjs`](../../scripts/validar-codigo-publico-escola.mjs), a checagem com `anon` em `escola` continuará impedida de ler `codigo_publico` (com proteção adicional nas demais colunas).
  - **Contas reservadas:** Nenhuma impactada (todas acessam autenticadas).

---

### S-02 (Parte 2) — Leitura irrestrita de perfis e e-mails entre escolas diferentes (`public.perfil`)
- **Veredito / Severidade:** `CONFIRMED` · **Média**
- **Fonte:** `pg_policies` (`Perfil: leitura para autenticados` com `roles = {authenticated}` e `qual = true`).
- **O que acontece (cenário de risco):**
  - Qualquer usuário autenticado (por exemplo, um aluno recém-cadastrado na **Escola 3**) pode executar `GET /rest/v1/perfil?select=id_perfil,nome,email,role,id_escola` e baixar **todos os nomes, e-mails, fotos, bios e papéis dos ~10.000 usuários da Escola 1**.
  - Isso caracteriza quebra de isolamento multi-escola (*Cross-Tenant Data Exposure*) e exposição desnecessária de dados pessoais (LGPD).
- **Como resolver:**
  - Criar função auxiliar `nexusclass_private.meu_escopo_perfil()` (ou `nexusclass_private.minha_escola_e_papel()`) com `STABLE SECURITY DEFINER SET search_path = ''` (concedida apenas a `authenticated`, sem risco de recursão infinita de RLS — lição já documentada em [`.agents/troubleshooting/entrega-atividade-recursao-rls.md`](../../.agents/troubleshooting/entrega-atividade-recursao-rls.md)).
  - Atualizar a política `SELECT` de `public.perfil` (`TO authenticated`) para permitir leitura somente quando:
    1. `id_perfil = auth.uid()` (o próprio perfil), **OU**
    2. o usuário autenticado é `master` (visão administrativa global), **OU**
    3. o perfil alvo pertence à **mesma escola** (`id_escola = escola_do_usuario`), **OU**
    4. o perfil alvo tem `role = 'master'` (evita quebrar exibição de nomes/metadados de suporte/moderação vinculados a tickets ou respostas).
- **O que afeta no projeto ao corrigir:**
  - **Fluxos legítimos (mesma escola):** Mural, lista de alunos da turma, dúvidas, entregas, chat e perfil de colegas/professores da mesma escola continuam funcionando normalmente.
  - **Conta `master`:** Continua visualizando todos os perfis de todas as escolas.
  - **Tentativas entre escolas:** Um aluno ou professor da Escola 3 **deixa de conseguir listar e-mails/perfis da Escola 1** (retorna apenas sua própria escola + masters).
  - **Cuidado operacional:** Validar a nova política sob `BEGIN; ... ROLLBACK;` antes de confirmar, verificando que não há recursão RLS e que as 4 contas reservadas e o `03_verificacao.sql` continuam operando normalmente.

---

### S-03 — Ausência dos triggers RN12 (`aluno_turma` e `professor_turma`) na instância de teste da nuvem
- **Veredito / Severidade:** `CONFIRMED` · **Média** *(Drift de ambiente)*
- **Fonte:** `pg_trigger` na instância de teste da nuvem (apenas 6 triggers em `public`, sem os triggers de validação de escola em `aluno_turma` e `professor_turma`).
- **O que acontece (cenário de risco):**
  - Embora o [`01_esquema.sql`](../../docker/constructionsSQL/01_esquema.sql) e a validação em Docker (`16/16`) já imponham a RN12 no banco via triggers, a instância hospedada de teste é anterior ao commit `bd0994c`.
  - Sem os triggers RN12 na nuvem, qualquer escrita privilegiada (ou `master` / script / futura mudança de RLS) conseguiria matricular um aluno ou vincular um professor em uma turma de **outra escola** sem o banco rejeitar.
- **Como resolver:**
  - Instalar de forma idempotente as funções e triggers `BEFORE INSERT OR UPDATE` de validação de escola em `public.aluno_turma` e `public.professor_turma` (idênticos ao `01_esquema.sql` homologado em Docker).
- **O que afeta no projeto ao corrigir:**
  - **Dados já gravados e 4 contas reservadas:** **Zero quebra.** Triggers `BEFORE INSERT OR UPDATE` só avaliam novas inserções ou alterações de matrícula/vínculo.
  - **Consistência entre ambientes:** Elimina a divergência entre o Docker local (`16/16`) e a instância hospedada de teste.

---

### S-04 — Buckets do Storage sem limite de tamanho (`file_size_limit`) e sem restrição de MIME
- **Veredito / Severidade:** `CONFIRMED` · **Baixa–Média**
- **Fonte:** `storage.buckets` (`file_size_limit = null` e `allowed_mime_types = null` nos 4 buckets: `anexos_atividades`, `anexos_suporte`, `duvidasalunostoprofessor`, `entregas_atividades`).
- **O que acontece (cenário de risco):**
  - Um usuário autenticado pode enviar arquivos de dezenas ou centenas de MB, esgotando rapidamente a cota de armazenamento do projeto (negação de serviço por consumo de Storage).
  - Também permite upload de tipos potencialmente arriscados (`.html`, `.svg`, executáveis). O risco de execução direta no navegador já é mitigado porque os 4 buckets são privados (`public = false`) e servidos via URLs assinadas, mas ainda convém aplicar limite defensivo.
- **Como resolver (e trade-off técnico avaliado):**
  - **Definir `file_size_limit = 10485760` (10 MB)** nos 4 buckets — proteção imediata contra abuso de cota com zero impacto em arquivos escolares normais.
  - **Trade-off de `allowed_mime_types`:** o Supabase Storage só oferece *allowlist* estrita (tudo fora da lista é recusado). Como o NexusClass atende disciplinas de Computação (onde alunos podem submeter `.pdf`, imagens, `.docx`, `.txt`, `.zip`, `.sql`, `.py`, `.ts` — frequentemente rotulados pelo navegador como `application/octet-stream`), uma allowlist excessivamente restritiva poderia bloquear entregas legítimas na demonstração.
  - **Decisão proporcional:** aplicar **`file_size_limit = 10 MB`** agora nos 4 buckets; deixar `allowed_mime_types` opcional ou restrito apenas se o escopo do LMS limitar entregas a PDF/imagens/texto/ZIP.
- **O que afeta no projeto ao corrigir:**
  - Uploads de até **10 MB** (todos os fluxos da SPA, testes automatizados e anexos de suporte) continuam funcionando sem nenhuma mudança no frontend.
  - Tentativas de upload acima de **10 MB** passam a ser barradas diretamente no Storage (`413 Payload Too Large`).

---

### S-05 — *Leaked Password Protection* desativada no Supabase Auth
- **Veredito / Severidade:** `NEEDS_VALIDATION` · **Baixa** *(Configuração externa de painel/plano)*
- **Fonte:** Supabase Security Advisor (`auth_leaked_password_protection`).
- **O que acontece (cenário de risco):**
  - O Supabase Auth não consulta a base pública HaveIBeenPwned ao cadastrar novos usuários ou alterar senhas, permitindo que usuários escolham senhas sabidamente comprometidas em vazamentos externos (ex.: `123456`, `qwerty`).
- **Como resolver:**
  - Habilitar manualmente em **Supabase Dashboard → Authentication → Attack Protection → Leaked Password Protection** *(observação: no plano Free do Supabase essa opção normalmente exige plano Pro)*.
- **O que afeta no projeto ao corrigir:**
  - Afeta apenas **novos cadastros** e **alterações de senha** (rejeitando senhas presentes em listas vazadas).
  - **Não invalida** nenhuma conta já existente nem as 4 contas reservadas da apresentação.
- **Referência oficial:** [Supabase Password Security Docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

---

### S-06 *(Bônus — Defesa em Profundidade)* — Privilégios DDL excessivos do papel `anon` em tabelas `public`
- **Veredito / Severidade:** `CONFIRMED` · **Baixa** *(Hardening preventivo)*
- **Fonte:** `information_schema.table_privileges` (`anon` detém `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `TRIGGER` e `REFERENCES` em todas as 18 tabelas `public`).
- **O que acontece (cenário de risco):**
  - Atualmente as políticas RLS já bloqueiam escritas de `anon`. Porém, manter `GRANT INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES` para `anon` viola o **Princípio do Menor Privilégio**: se algum dia uma tabela nova ou migração esquecer uma policy, `anon` já teria permissão de tabela para escrever ou truncar dados.
- **Como resolver:**
  ```sql
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON ALL TABLES IN SCHEMA public
  FROM anon;
  ```
- **O que afeta no projeto ao corrigir:**
  - **Zero impacto funcional.** Usuários não autenticados (`anon`) nunca escrevem diretamente em nenhuma tabela `public` (cadastro passa pelo GoTrue Auth → trigger `SECURITY DEFINER` `handle_new_user()`).
  - **Ganho:** Segunda linha de defesa independente de RLS em nível de privilégio PostgreSQL.

---

## 3. Falso Positivo Descartado na Verificação Adversarial (`REJECTED`)

| Alerta | Função | Motivo do Descarte (`REJECTED`) |
|:---|:---|:---|
| **Advisor `0029`** *(Signed-In Users Can Execute SECURITY DEFINER Function)* | `public.obter_codigo_publico_minha_escola()` | **Intencional e seguro por design (ADR-010).** A função não recebe parâmetros (impossível passar ID de outra escola), lê exclusivamente `auth.uid()` do JWT validado e retorna apenas o `codigo_publico` da escola do próprio usuário (ou `NULL` para `master`). Existe justamente para permitir que a coluna `escola.codigo_publico` permaneça com `SELECT` revogado para `anon` e `authenticated`. |

---

## 4. Plano de Remediação Proposto (`17_hardening_supabase_seguranca.sql`)

Para corrigir de forma atômica, idempotente e rastreável os achados confirmados no banco:

1. **Criar [`docker/constructionsSQL/17_hardening_supabase_seguranca.sql`](../../docker/constructionsSQL/17_hardening_supabase_seguranca.sql)** (e manter [`04_supabase_auth_rls.sql`](../../docker/constructionsSQL/04_supabase_auth_rls.sql) sincronizado) contemplando:
   - **S-01:** `REVOKE EXECUTE` em `public.rls_auto_enable()` para `PUBLIC, anon, authenticated`;
   - **S-02 (Parte 1):** restringir `SELECT` de `escola` e `turma` exclusivamente a `authenticated`;
   - **S-02 (Parte 2):** restringir `SELECT` de `perfil` à mesma escola + próprio perfil + `master`, com função auxiliar `SECURITY DEFINER` (`SET search_path = ''`) livre de recursão RLS;
   - **S-03:** instalar de forma idempotente os triggers RN12 em `aluno_turma` e `professor_turma`;
   - **S-04:** definir `file_size_limit = 10485760` (10 MB) nos 4 buckets privados do Storage;
   - **S-06:** revogar `INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES` de `anon` em `ALL TABLES IN SCHEMA public`.
2. **Validação obrigatória antes e depois de aplicar:**
   - Testar a migração inteira em *dry-run* (`BEGIN; ... ROLLBACK;`) verificando zero erros e ausência de recursão RLS;
   - Aplicar via `apply_migration` no Supabase de teste;
   - Reexecutar `get_advisors(security)` para comprovar a eliminação dos alertas `0028`/`0029` de `rls_auto_enable`;
   - Validar leitura sob RLS das contas (isolamento entre escolas + acesso `master` + integridade das 4 contas reservadas intactas);
   - Executar suíte Vitest (`19` suítes / `144` testes) para garantir zero regressão na aplicação.

---

## 5. Resultado Pós-Aplicação (`17_hardening_supabase_seguranca.sql` — 22/11/2026)

- **Dry-run reversível (`BEGIN; ... ROLLBACK;`):** **12/12 asserções aprovadas** (`MIGRACAO_17_DRY_RUN_12_DE_12_OK`), incluindo isolamento multi-escola de `perfil` sem recursão RLS, bloqueio de `anon` em `escola`/`turma`/escritas DDL, triggers RN12 em `aluno_turma`/`professor_turma`, limite `10 MB` nos 4 buckets privados e integridade das **4 contas reservadas da apresentação**.
- **Aplicação no Supabase de teste + Rechecagem do Security Advisor (`get_advisors(security)`):**
  - **`0028` (`anon` em `rls_auto_enable`) e `0029` (`authenticated` em `rls_auto_enable`):** **ELIMINADOS ✅**.
  - **Restaram apenas 2 `WARN` esperados e documentados:**
    1. `0029` em `public.obter_codigo_publico_minha_escola()` — **falso positivo intencional (`REJECTED`, ADR-010)**: função sem parâmetros que lê exclusivamente `auth.uid()` para retornar apenas o código da própria escola mantendo `SELECT` na coluna revogado.
    2. `auth_leaked_password_protection` (`S-05`) — recurso de painel do Supabase Auth (HaveIBeenPwned), tipicamente vinculado ao plano Pro.
- **Arquivos sincronizados:** [`docker/constructionsSQL/17_hardening_supabase_seguranca.sql`](../../docker/constructionsSQL/17_hardening_supabase_seguranca.sql), [`docker/constructionsSQL/04_supabase_auth_rls.sql`](../../docker/constructionsSQL/04_supabase_auth_rls.sql), [`scripts/validar-codigo-publico-escola.mjs`](../../scripts/validar-codigo-publico-escola.mjs) e [`.docs/PENTEST_E_SEGURANCA_NEXUSCLASS.md`](../../.docs/PENTEST_E_SEGURANCA_NEXUSCLASS.md).

