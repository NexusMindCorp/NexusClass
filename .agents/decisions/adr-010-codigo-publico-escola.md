# ADR-010 — Código Público Alfanumérico da Escola (`Escola.codigo_publico`)

- **Data:** 2026-11-21
- **Autor:** Gianlucca Paiva (`GianluccaPaiva`)
- **Status:** Aprovado (Ordem 3 — Fase 6 / Passo 9-B)
- **Relacionado a:** [ADR-008](adr-008-esquema-sql-supabase-auth-storage-rls.md), [ADR-009](adr-009-camada-acesso-dados-esquema-normalizado.md), [PLANO_VALIDACAO_FASE_6_E_9B.md](../../.docs/PLANO_VALIDACAO_FASE_6_E_9B.md#ordem-3--decisões-da-dupla)

---

## 1. Contexto
Na Fase 6-A, o cadastro público (`src/components/Login.tsx` → `auth.signUp` → trigger `public.handle_new_user()`) passou a solicitar o inteiro sequencial `id_escola` (`1`, `2`, `3`) para vincular novos alunos sem expor o catálogo completo de escolas antes do login. Embora funcional para a RN11/RN12, usar a chave primária sequencial diretamente no formulário de cadastro permite adivinhação trivial de escolas (`1, 2, 3...`) e expõe o identificador interno do banco na interface.

## 2. Decisão
1. **Chave interna preservada:** `public.Escola.id_escola SERIAL PRIMARY KEY` permanece intocada em todas as chaves estrangeiras (`Turma`, `Perfil`), políticas RLS e repositórios, preservando 100% das contas, turmas e vínculos existentes.
2. **Código público alfanumérico (`15_codigo_publico_escola.sql`):**
   - Adicionar `codigo_publico VARCHAR(16) NOT NULL` em `public.escola`, com `UNIQUE (codigo_publico)` e `CHECK (codigo_publico ~ '^[A-Z0-9-]{4,16}$')`.
   - Formato padrão gerado automaticamente no PostgreSQL via `gen_random_uuid()` (nativo do Postgres 17): **`ESC-XXXXXXXX`** (8 caracteres maiúsculos do alfabeto sem ambiguidade `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`), com normalização `UPPER(TRIM(...))` por trigger e backfill idempotente para todas as escolas existentes.
3. **Cadastro público estrito em `public.handle_new_user()`:**
   - Passa a exigir `raw_user_meta_data ->> 'codigo_escola'`, resolvendo `codigo_publico` → `id_escola` internamente.
   - **Sem fallback para `id_escola` numérico puro:** evita contorno do código público via chamadas diretas à API de cadastro.
4. **Proteção contra enumeração e visibilidade restrita ao próprio usuário:**
   - Como `04_supabase_auth_rls.sql` mantém `SELECT USING (true)` em `public.Escola` para `anon` e `authenticated`, a migração `15` aplica privilégio de coluna (`REVOKE SELECT ON public.escola FROM anon, authenticated; GRANT SELECT (id_escola, nome, ano_letivo, created_at) ...`), impedindo que `anon` ou usuários de outra escola consultem `codigo_publico` via PostgREST.
   - A RPC `public.obter_codigo_publico_minha_escola()` (`STABLE`, `SECURITY DEFINER`, exclusiva de `authenticated`/`service_role`) retorna somente o `codigo_publico` da escola do próprio `auth.uid()` (ou `NULL` para `master`).
   - Na SPA, o código é exibido **exclusivamente na visualização de informações pessoais do próprio usuário** (`Navbar` → *Minha Conta → Perfil* e `BoxPerfilUsuario` quando `ehProprioUsuario === true`), nunca no perfil de terceiros nem em listagens de turmas.

## 3. Alternativas Consideradas
- **Substituir a PK `id_escola` por texto/UUID:** descartada por quebrar todas as FKs, `01_esquema.sql`, `02_carga.sql` e relatórios acadêmicos sem ganho adicional.
- **Manter fallback numérico em `handle_new_user()`:** descartada por anular o benefício de segurança do código não sequencial.
- **Deixar `codigo_publico` legível em `SELECT` para `anon`/`authenticated`:** descartada por permitir enumeração trivial de códigos de todas as escolas via API REST.

## 4. Consequências
- **Positivas:** preserva 100% da integridade referencial e dados existentes; elimina exposição de IDs sequenciais no cadastro; impede enumeração entre escolas no banco; melhora a experiência de compartilhamento do código pelo próprio usuário autenticado.
- **Impactos controlados:** scripts administrativos/de validação (`provisionar-contas-teste.mjs`, `validar-cadastro-matricula.mjs`, `validar-exclusao-conta.mjs`) passam a enviar `codigo_escola` em vez de `id_escola`; na Ordem 4, incluir `15_codigo_publico_escola.sql` após `14_rpc_storage_exclusao_conta.sql`.
