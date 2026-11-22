# Relatório Consolidado da Sessão e Ponto de Retomada — 2026-11-22

- **Data:** 2026-11-22
- **Autor:** Gianlucca Paiva (`GianluccaPaiva`)
- **Branch de trabalho:** `DesiningTeste` (alterações finais de `grupo24/` e relatórios de limpeza ainda **sem commit**, conforme alinhado)
- **Contas reservadas da apresentação:** **intactas** (`prof@nexusclass.edu.br`, `descarte@nexus.com`, `testador@aluno.nexuclass.com`, `jae@nexus.com`)

---

## 1. Tudo o que foi concluído nesta sessão (2026-11-22)

### 1.1 Publicação e Validação E2E das Edge Functions de E-mail (`resend-*`)
- Publicadas no Supabase hospedado de teste com `verify_jwt: true`:
  - **`resend-email` (`v2`, `ACTIVE`)** e **`resend-suport` (`v1`, `ACTIVE`)**.
- Secrets `RESEND_API_KEY` e `DESTINATARIO_EMAIL` configurados no Supabase Dashboard (zero chaves versionadas no Git).
- Validação ponta a ponta ao vivo com conta descartável (auto-removida ao final via `deletar-conta`, sem tocar nas 4 contas reservadas):
  - `401` sem JWT nas duas funções;
  - `HTTP 200` em denúncia (`resend-email` v2, `destinatarios: 1`);
  - `HTTP 200` em suporte com anexo 1FN assinado por 7 dias (`resend-suport` v1, `destinatarios: 1, anexos: 1`);
  - limpeza completa via `deletar-conta` (`arquivos_removidos: 1, falhas: 0`).
- **Evidência:** [`2026-11-22-publicacao-validacao-resend-edge.md`](2026-11-22-publicacao-validacao-resend-edge.md).

### 1.2 Auditoria de Segurança do Supabase e Migração `17`
- Auditoria completa (`get_advisors(security)` + catálogo PostgreSQL/Storage) mapeando 6 achados (`S-01`..`S-06`).
- Criada, pré-validada (**12/12 asserções sob `BEGIN; ... ROLLBACK;`**) e aplicada no Supabase hospedado a migração [`docker/constructionsSQL/17_hardening_supabase_seguranca.sql`](../../docker/constructionsSQL/17_hardening_supabase_seguranca.sql):
  - `S-01`: revogado `EXECUTE` de `public.rls_auto_enable()` para `PUBLIC, anon, authenticated` (zerando alertas `0028`/`0029` no Security Advisor);
  - `S-02`: `SELECT` de `Escola` e `Turma` restrito a `authenticated`; `SELECT` de `Perfil` isolado por escola (`+ próprio perfil + master`) via `nexusclass_private.perfil_visivel_para_atual(...)` sem recursão RLS;
  - `S-03`: gatilhos RN12 (`trg_aluno_turma_escola`, `trg_professor_turma_escola`) reforçados de forma idempotente com `REVOKE EXECUTE`;
  - `S-04`: `file_size_limit = 10485760` (10 MB) nos 4 buckets privados;
  - `S-06`: revogados privilégios DDL de escrita de `anon` sobre `public.*`.
- Sincronizados [`docker/constructionsSQL/04_supabase_auth_rls.sql`](../../docker/constructionsSQL/04_supabase_auth_rls.sql) e [`scripts/validar-codigo-publico-escola.mjs`](../../scripts/validar-codigo-publico-escola.mjs).
- **Evidência:** [`2026-11-22-auditoria-seguranca-supabase.md`](2026-11-22-auditoria-seguranca-supabase.md).

### 1.3 Auditoria de Prontidão para Deploy na Vercel (`vercel.json` / `deploy`)
- Confirmado que a *Production Branch* na Vercel é **`deploy`** (atualmente em `ce69de1` com `vercel.json` legado sem `headers`), enquanto `main` (`76a80c7`) não tem `vercel.json`.
- Adicionado `Strict-Transport-Security` (HSTS) ao [`vercel.json`](../../vercel.json) (total de **6 cabeçalhos HTTP de segurança**), auditado contra `index.html`, `vite.config.ts` (`process.env.VERCEL ? '/'`) e todas as URLs externas em `src/` (Google Fonts, Pixabay, Supabase `https:`/`wss:`, Gemini).
- Build local validado com `$env:VERCEL='1'; npx vite build` (`2937` módulos, `0` erros).
- **Evidência:** [`2026-11-22-auditoria-prontidao-vercel.md`](2026-11-22-auditoria-prontidao-vercel.md).

### 1.4 Reconciliação Completa do Pacote [`grupo24/`](../../grupo24/) no Padrão `modelo_trabalho_v3.pdf`
- **Arquivamento do histórico E4:** os 3 scripts legados de PostgreSQL puro (`entrega_url`, IDs inteiros, 11 testes) foram preservados intactos em [`grupo24/sql_e4_historico/`](../../grupo24/sql_e4_historico/), junto de [`grupo24/relatorio.pdf`](../../grupo24/relatorio.pdf) e [`grupo24/modelo_trabalho_v3.pdf`](../../grupo24/modelo_trabalho_v3.pdf).
- **Concatenação em ordem numérica estrita (`grupo24/sql/`):**
  - [`01_esquema.sql`](../../grupo24/sql/01_esquema.sql): 18 tabelas, constraints (`01`/`08`/`09`/`15`/`16`), 4 buckets com limite 10 MB, **94 políticas RLS** (`04` sincronizado com `17` + `05` + `06` + `07`), Realtime, RPCs (`14`/`15`) e Hardening `17` — sem triggers (`BEGIN 5 / COMMIT 5`).
  - [`02_carga.sql`](../../grupo24/sql/02_carga.sql): 10.013 perfis (`auth.users` + `Perfil`), **200.006 entregas**, `setval` e `ANALYZE;`.
  - [`03_verificacao.sql`](../../grupo24/sql/03_verificacao.sql): **13 testes declarativos do DDL** sob `BEGIN; ... ROLLBACK;` com transcrição literal das mensagens `ERROR:` / `DETAIL:` capturadas ao vivo no PostgreSQL.
  - [`05_visoes.sql`](../../grupo24/sql/05_visoes.sql): **Visão 1 (`public.v_storage_objetos`, `security_invoker = true`)** documentada (pronta para receber a 2ª visão na E5).
  - [`06_triggers.sql`](../../grupo24/sql/06_triggers.sql): **9 gatilhos reais** + `fn_processar_alertas_calendario()` (`America/Sao_Paulo`, `pg_cron`) + **bloco de verificação da Seção 7.3 (6/6 validados ao vivo sob `ROLLBACK`)**.
  - Trilha incremental [`docker/constructionsSQL/`](../../docker/constructionsSQL/) (`000` + `01`..`17`) mantida **100% intacta**.
- **Álgebra Relacional:** reconciliada a Seção 4.1 em [`grupo24/algebra/consultas_ar.md`](../../grupo24/algebra/consultas_ar.md) (preservando intactas as 10 consultas).
- **Relatório e PDF no estilo tradicional:**
  - Fechadas todas as 7 lacunas contra `modelo_trabalho_v3.pdf` em [`grupo24/RELATORIO_ATUALIZADO.md`](../../grupo24/RELATORIO_ATUALIZADO.md) (quadro de Identificação da Equipe, Seção 1 expandida, exemplo concreto de desnormalização + justificativa histórica de `atraso` na 3.3, explicação detalhada do `ANALYZE` na 5.2, transcrição literal `ERROR:` na 5.3, Seções 6 e 7 alinhadas ao modelo v3 e evolução movida para Apêndice B).
  - Normalizado o nome da imagem do DER para [`grupo24/der.png`](../../grupo24/der.png) em minúsculas e criados [`grupo24/README.md`](../../grupo24/README.md) e [`grupo24/RELATORIO_ATUALIZADO.pdf`](../../grupo24/RELATORIO_ATUALIZADO.pdf) no **estilo visual tradicional** do `relatorio.pdf` (**24 páginas**, `518 KB`, Arial, tabelas cabeçalho `#f3f3f3` + linha preta `2px`, DER embutido na Seção 3.1, **`0` vazamentos**).

### 1.5 Inventário de Limpeza Pré-Deploy (Pós-Fase 7)
- Auditados todos os **382 arquivos rastreados** no Git + referências em `src/`, `public/`, `docker/` e `supabase/`, gerando o plano detalhado por blocos em [`2026-11-22-inventario-limpeza-pos-fase-7.md`](2026-11-22-inventario-limpeza-pos-fase-7.md):
  - **Bloco 1 (Obrigatório pré-deploy):** sanitizar `project-id` em `src/lib/database.types.ts:7`, remover `out/casos_de_uso/SupabaseMakdown/` (`project-ref` legado no nome do `.png`), remover `supabase/.temp/cli-latest` (+ `.gitignore`) e remover 2 assets mortos em `public/` que hoje vão para `dist/` (`imgLivro.png` — 2,30 MB e `tigreso.mp3` — 59 KB).
  - **Bloco 2 (Recomendado):** remover 6 SQLs legados `supabase/001..006_*.sql`, remover cópia duplicada `docker/edge_function/`, enxugar 43 scripts pontuais em `scripts/` (mantendo os 3 validadores reutilizáveis), remover `Testes de segurança.pdf` da raiz e atualizar `README.md`.
  - **Bloco 3 (Decisão estratégica):** ocultar governança interna (`.agents/`, `.docs/`, `relatorios/`, `AGENTS.md`, `GEMINI.md`) via `git rm -r --cached` + `.gitignore` quando alinhado com o Gabriel.

---

## 2. O que falta fazer (Checklist Priorizado de Retomada)

### A. Antes do commit e do deploy (ações imediatas)
- [ ] **1. Executar a limpeza aprovada do inventário** ([`2026-11-22-inventario-limpeza-pos-fase-7.md`](2026-11-22-inventario-limpeza-pos-fase-7.md)):
  - Aplicar **Bloco 1** (obrigatório: sanitizar `database.types.ts:7`, remover `SupabaseMakdown/`, `supabase/.temp/`, `public/Logos/imgLivro.png` e `public/sons/tigreso.mp3`).
  - Aplicar **Bloco 2** conforme aprovação (`supabase/001..006_*.sql`, `docker/edge_function/`, enxugamento de `scripts/`, `Testes de segurança.pdf` e atualização de `README.md`).
  - Decidir sobre **Bloco 3** (ocultar `.agents/`, `.docs/`, `relatorios/`, `AGENTS.md`/`GEMINI.md` agora ou manter visíveis na `DesiningTeste` até fechar DCC061 com Gabriel).
- [ ] **2. Conferir imagem [`grupo24/der.png`](../../grupo24/der.png):** decidir se mantém o `der.png` escuro atual (que ainda exibe `entrega_url`, `no_prazo`, `anexos_urls*` e sem `codigo_publico`) ou se re-exporta `der.png` em fundo branco a partir de [`grupo24/modelo.drawio`](../../grupo24/modelo.drawio) atualizado e regenera `RELATORIO_ATUALIZADO.pdf`.
- [ ] **3. Decidir sobre reenvio de confirmação de e-mail:** implementar agora ou registrar formalmente como adiado fora desta entrega.

### B. Validação final, Commit e Publicação na Vercel (`DesiningTeste` → `deploy`)
- [ ] **4. Validar após limpeza** (caso toque em `src/` ou `public/`): `tsc` (`0` erros), `npx vitest run` (**19 suítes / 144 testes**), `$env:VERCEL='1'; npx vite build` e varredura anti-vazamento (`0` hits).
- [ ] **5. Commitar na `DesiningTeste`** as alterações pendentes (`grupo24/`, limpeza aplicada, relatórios de 22/11 e governança).
- [ ] **6. Promover `DesiningTeste` → `deploy` na Vercel** (alinhando o momento com Gabriel) e verificar ao vivo na URL publicada:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_GEMINI_KEY` apontando para o banco normalizado de 18 tabelas;
  - resposta HTTP servindo os **6 cabeçalhos de segurança** do [`vercel.json`](../../vercel.json) (CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`);
  - autenticação funcional das **4 contas reservadas** da apresentação.

### C. Fechamento acadêmico DCC061 (em dupla com Gabriel Lineker)
- [ ] **7. Revisar cópias externas dos 3 PDFs da DCC061** guardadas pelo Gabriel (documento-texto, slides e roteiro), confirmar a submissão no canal da disciplina e ensaiar a apresentação de 15–20 minutos (aba *Informações* + código + testes).

### D. Entregas futuras de DCC060 (não bloqueiam o deploy atual)
- [ ] **8. Entrega E5 (27/11):** criar `grupo24/sql/04_consultas.sql` (≥ 12 consultas SQL com `INNER`/`LEFT`/`RIGHT`, ≥ 2 `GROUP BY + HAVING`, ≥ 2 subconsultas correlacionadas), adicionar a 2ª visão em `grupo24/sql/05_visoes.sql` e preencher as Seções 6 e 7.1 de `RELATORIO_ATUALIZADO.md`.
- [ ] **9. Entrega E6 (11/12):** criar `grupo24/sql/07_indices.sql` + `grupo24/sql/experimentos.md` (`EXPLAIN ANALYZE` antes/depois sobre as 200.006 linhas de `Entrega_Atividade`), preencher Seções 8 e 9 (incluindo `grupo24/app/LEIAME.md`), revalidar a sequência concatenada em Docker limpo e montar o `.zip` oficial com `relatorio.pdf` e `der.png` na raiz de `grupo24/`.
