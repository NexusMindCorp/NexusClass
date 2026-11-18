# Feature: Fase 6-A — Remodelagem das Interfaces e do Acesso ao Banco para o Esquema Normalizado

- **Registro:** 2026-11-17
- **Autor / Responsável:** Gianlucca Paiva (`GianluccaPaiva`)
- **Status:** Em Andamento (Passo 4/10 concluído)
- **Risco (RBT):** Nível 3 (fronteira Supabase: Repositories, Facade, Observer, fluxo de entrega) + Nível 2 (mappers e permissões puros)
- **Validação:** `npx tsc -b --noEmit` + `npx vitest run` (por passo); testes de RLS reais no Passo 9-B (final)
- **Plano detalhado:** [`.docs/PLANEJAMENTO_REMODELAGEM_ACESSO_BANCO.md`](../../.docs/PLANEJAMENTO_REMODELAGEM_ACESSO_BANCO.md) · **ADR:** [ADR-009](../decisions/adr-009-camada-acesso-dados-esquema-normalizado.md)

## 1. Visão Geral
Adequar a SPA ao esquema de `docker/constructionsSQL/01_esquema.sql` + `04_supabase_auth_rls.sql` (ADR-008). Passos:

| Passo | Entrega | Status |
|:---|:---|:---|
| 0 | ADR-009 + esta spec + índice + handoff | **Concluído** |
| 1 | `05_supabase_funcoes_realtime.sql` (`handle_new_user`, Realtime, DELETE do professor em entregas, alertas `pg_cron`) | **Concluído** |
| 2 | `database.types.ts` + `createClient<Database>` | **Concluído** (10 arquivos / 106 erros de schema expostos pelo `tsc`) |
| 3 | `src/lib/db/mappers.ts` + ajuste de tipos `src/hooks/*/type.ts` | **Concluído** (+ view `v_storage_objetos` `security_invoker = true`) |
| 4 | `AnexoStorageFacade` + `EntregaAtividadeFacade` + 6 Repositories | **Concluído** (0 erros `tsc` nas Facades e Repositories) |
| 5 | Migração dos hooks (Auth → Escola/Turma → Atividade/Entrega/Mural → Dúvida → Calendário → Mensagens → Denúncia/Suporte → Bots → slides) | Pendente |
| 6 | Observer com canais novos | Pendente |
| 7 | `permissoes.ts` (Proxy) + ajustes de UI autorizados | Pendente |
| 8 | Edge Function `deletar-conta` | Pendente |
| 9-A | Testes unitários e de borda (cliente falso) | Pendente |
| 10 | Doc viva, slides, relatório, UML | Pendente |
| 9-B | Testes de RLS no Supabase local + E2E (**final**) | Pendente |

## 2. Não-Objetivos (Non-Goals)
- Não alterar `01_esquema.sql`, `02_carga.sql` nem `04_supabase_auth_rls.sql`.
- Não executar scripts contra a instância remota do Supabase.
- Não adaptar `03_verificacao.sql` (pendência da ADR-008).
- Não criar testes de UI pura (Nível 1 RBT).
- Não introduzir bibliotecas novas.

## 3. UI/UX (consistência arquitetural)
Mudanças autorizadas pela dupla (Decisão 1): seletor de escola no cadastro (`Login.tsx`); `data_entrega` e `horario` obrigatórios; denúncia por `id_denunciado` (UUID); "Inscrever-se" visível só para aluno. Os demais textos e botões são preservados. Ações negadas pela RLS ficam ocultas via `permissoes.ts`.

## 4. Acessibilidade
O novo seletor de escola usa o `Select` Radix/Shadcn existente (navegação por teclado e `label` associado). Campos que passam a ser obrigatórios recebem `required` + `aria-invalid` na validação.

## 5. Desempenho e Segurança
- Buckets privados: leitura por `createSignedUrls` (lote, TTL 3600 s).
- Ordem Storage ↔ FK `ON DELETE CASCADE` obrigatória (ADR-009 §2.8).
- `handle_new_user` e `fn_processar_alertas_calendario` como `SECURITY DEFINER SET search_path = ''`, com `EXECUTE` revogado de `anon`/`authenticated`.
- Opcional: `private.is_master()` `STABLE` para reduzir os cerca de 150 `EXISTS` repetidos nas RLS.

## 6. Arquivos Tocados
Ver ADR-009 §4. Passo 0: `.agents/decisions/adr-009-...md`, esta spec, `.agents/INICIALIZACAO.md`, `.docs/DOCUMENTACAO_APRESENTACAO.md`, `.docs/PLANEJAMENTO_REMODELAGEM_ACESSO_BANCO.md`.

## 7. Matriz de Risco
| Risco | Impacto | Mitigação |
|:---|:---|:---|
| Regressão ampla em 19 arquivos | Alto | Migração por agregado; `tsc` + `vitest` verdes por item |
| Entrega apagada pela cascata ao reenviar | Alto | UPSERT antes de `remove()`; teste de ordem na Facade |
| Arquivos órfãos ao excluir atividade | Médio | Policy de DELETE do professor (`05_*.sql`) + ordem de exclusão no `AtividadeRepository` |
| Cadastro quebrado (Perfil exige escola) | Alto | `handle_new_user` + seletor de escola |
| Canais Realtime mudos | Médio | `ALTER PUBLICATION` no `05_*.sql` |
| Tipos gerados exigem Supabase local | Médio | Gerar com `supabase start` + scripts `01 → 04 → 05`; versionar o arquivo gerado |

## 8. Validação
- [ ] Typecheck
- [ ] Testes da feature (9-A)
- [ ] Sem regressão (suíte completa)
- [ ] Testes de RLS reais (9-B, final)
- [ ] `.docs/DOCUMENTACAO_APRESENTACAO.md` atualizado

## 9. Procedimento de Rollback
Ver ADR-009 §8.
