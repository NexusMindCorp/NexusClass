# Código Público da Escola (`15_codigo_publico_escola.sql`) — Implementação e Validação

- **Autor:** Gianlucca Paiva (`GianluccaPaiva`)
- **Data:** 2026-11-21
- **Frente:** Fase 6 / Passo 9-B — Ordem 3 (Item: Código público da escola)
- **Ambiente:** Supabase de teste (`REF_DO_PROJETO`)

---

## 1. Resumo das Entregas
1. **ADR-010 ([`adr-010-codigo-publico-escola.md`](../../.agents/decisions/adr-010-codigo-publico-escola.md)):** registra a decisão de manter `Escola.id_escola` como chave primária/estrangeira interna e adicionar `codigo_publico VARCHAR(16)` único no formato `ESC-XXXXXXXX`.
2. **Migração 15 ([`15_codigo_publico_escola.sql`](../../docker/constructionsSQL/15_codigo_publico_escola.sql)):**
   - Função `nexusclass_private.gerar_codigo_publico_escola()` gerando códigos no formato `ESC-XXXXXXXX` (alfabeto sem `0/O/1/I/L`, via `gen_random_uuid()`).
   - Backfill idempotente das escolas existentes (`1`, `2`, `3`), constraints `uq_escola_codigo_publico` (`UNIQUE`) e `ck_escola_codigo_publico_formato` (`CHECK`), além de trigger `BEFORE INSERT OR UPDATE` de normalização (`UPPER(TRIM(...))`).
   - Atualização de `public.handle_new_user()` exigindo `codigo_escola` no cadastro público (sem fallback para `id_escola` numérico puro).
   - Privilégios de coluna em `public.escola` ocultando `codigo_publico` de `anon` e `authenticated`, combinados com a RPC `public.obter_codigo_publico_minha_escola()` (`SECURITY DEFINER`, `authenticated`/`service_role`), que devolve apenas o código da escola do próprio `auth.uid()`.
3. **Frontend & Repository:**
   - [`src/components/Login.tsx`](../../src/components/Login.tsx): cadastro migrado para campo texto `Código da Escola` (`ESC-XXXXXXXX`), enviando `codigo_escola`.
   - [`src/repositories/PerfilRepository.ts`](../../src/repositories/PerfilRepository.ts) + [`src/lib/database.types.ts`](../../src/lib/database.types.ts): tipagem e método `obterCodigoPublicoMinhaEscola()`.
   - [`src/components/Navbar.tsx`](../../src/components/Navbar.tsx), [`src/hooks/PerfilUserHooks/usePerfilUsuario.ts`](../../src/hooks/PerfilUserHooks/usePerfilUsuario.ts) e [`src/components/BoxPerfilUsuario.tsx`](../../src/components/BoxPerfilUsuario.tsx): exibição do código da escola (com botão copiar) **restrita exclusivamente às informações pessoais do próprio usuário** (oculto em perfis de terceiros e para `master`).
4. **Scripts e Testes:**
   - Atualizados `provisionar-contas-teste.mjs`, `provisionar-contas-teste.node.mjs`, `validar-cadastro-matricula.mjs`, `validar-exclusao-conta.mjs` e criado [`scripts/validar-codigo-publico-escola.mjs`](../../scripts/validar-codigo-publico-escola.mjs).
   - Criada a suíte [`testes/ui/codigoPublicoEscola.spec.tsx`](../../testes/ui/codigoPublicoEscola.spec.tsx) (4 testes).

---

## 2. Arquivos Tocados

| Arquivo | Ação | Finalidade |
|:---|:---|:---|
| [`.agents/decisions/adr-010-codigo-publico-escola.md`](../../.agents/decisions/adr-010-codigo-publico-escola.md) | Criado | ADR da arquitetura do código público da escola |
| [`docker/constructionsSQL/15_codigo_publico_escola.sql`](../../docker/constructionsSQL/15_codigo_publico_escola.sql) | Criado | Migração idempotente (coluna, backfill, constraints, `handle_new_user`, privilégios, RPC) |
| [`src/lib/database.types.ts`](../../src/lib/database.types.ts) | Atualizado | `escola.codigo_publico` e RPC `obter_codigo_publico_minha_escola` |
| [`src/repositories/PerfilRepository.ts`](../../src/repositories/PerfilRepository.ts) | Atualizado | Método `obterCodigoPublicoMinhaEscola()` |
| [`src/components/Login.tsx`](../../src/components/Login.tsx) | Atualizado | Campo `Código da Escola` no cadastro |
| [`src/hooks/PerfilUserHooks/usePerfilUsuario.ts`](../../src/hooks/PerfilUserHooks/usePerfilUsuario.ts) | Atualizado | Carregamento condicional do código somente para `ehProprioUsuario` |
| [`src/components/BoxPerfilUsuario.tsx`](../../src/components/BoxPerfilUsuario.tsx) | Atualizado | Exibição + cópia do código somente no próprio perfil |
| [`src/components/Navbar.tsx`](../../src/components/Navbar.tsx) | Atualizado | Exibição + cópia do código no modal *Perfil do Usuário* |
| [`testes/ui/codigoPublicoEscola.spec.tsx`](../../testes/ui/codigoPublicoEscola.spec.tsx) | Criado | 4 testes unitários/componente de privacidade e RPC |
| [`scripts/validar-codigo-publico-escola.mjs`](../../scripts/validar-codigo-publico-escola.mjs) | Criado | Validação ao vivo completa (10 asserções + limpeza via `deletar-conta`) |
| `scripts/provisionar-contas-teste.{mjs,node.mjs}`, `scripts/validar-cadastro-matricula.mjs`, `scripts/validar-exclusao-conta.mjs` | Atualizados | Alinhamento ao parâmetro `codigo_escola` |

---

## 3. Validação Executada

| Camada | Verificação | Resultado |
|:---|:---|:---|
| Banco (SQL sob `ROLLBACK`) | Backfill das 3 escolas (`ESC-XXXXXXXX`), unicidade (`uq_escola_codigo_publico`), formato (`ck_escola_codigo_publico_formato`), geração automática no `INSERT`, privilégios de coluna (`anon`/`authenticated` = `false` em `codigo_publico`, `true` em `nome`) e RPC (`anon` = `false`, `authenticated` = `true`) | **Passou** |
| API ao vivo (`validar-codigo-publico-escola.mjs`) | Bloqueio `42501` em `SELECT codigo_publico` e RPC para `anon`; leitura básica de `escola`; recusa de código inexistente e de `id_escola` numérico puro; cadastro válido (normalização de minúsculas/espaços) na escola `1`; bloqueio `42501` em `SELECT codigo_publico` para `authenticated`; RPC retornando exatamente o código da própria escola; isolamento entre escolas (`DCC001` aceita / `MAT101` recusada com `42501`); limpeza da conta descartável via `deletar-conta` | **Passou (10/10)** |
| Local (TypeScript + Testes) | `tsc` (`tsconfig.app.json` + `tsconfig.node.json`), `node --test scripts/provisionar-contas-teste.node.mjs` e `npx vitest run` | **0 erros `tsc` · 17 suítes / 129 testes Vitest · 1/1 teste Node** |

---

## 4. Handoff / Ponto de Retomada
- **Executado por:** Gianlucca Paiva (`GianluccaPaiva`) em 2026-11-21.
- **O que ficou pronto:** Item **Código público da escola** da **Ordem 3** implementado, aplicado no Supabase de teste e validado ponta a ponta.
- **Impactos para a Ordem 4:** Incluir [`15_codigo_publico_escola.sql`](../../docker/constructionsSQL/15_codigo_publico_escola.sql) após `14_rpc_storage_exclusao_conta.sql` na instalação isolada e atualizar `grupo24/RELATORIO_ATUALIZADO.md` / `grupo24/modelo.drawio` com `Escola.codigo_publico` no fechamento da Ordem 4.
- **Próximo passo exato:** Definir o destino dos 2 últimos itens opcionais da Ordem 3 (**Banners reais** e **Reenvio de confirmação de e-mail**), tornar `09_valida_feedback_avaliacao.sql` idempotente e executar a carga isolada da **Ordem 4**.
