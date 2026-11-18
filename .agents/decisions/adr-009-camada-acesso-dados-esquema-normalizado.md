# ADR-009: Camada de Acesso a Dados para o Esquema Normalizado (Repository + Facade de Anexos + Cliente Tipado)

- **Data:** 2026-11-17
- **Autor / Responsável:** Gianlucca Paiva (`GianluccaPaiva`)
- **Status:** Aprovado (aval da dupla registrado em `.docs/PLANEJAMENTO_REMODELAGEM_ACESSO_BANCO.md` → *Decisões da Dupla*)
> ADR aprovada nunca é reescrita; cria-se nova e marca-se a anterior como substituída.

## 1. Contexto e Motivação
A ADR-008 reescreveu o banco em `docker/constructionsSQL/01_esquema.sql` e `04_supabase_auth_rls.sql`: tabelas no singular (`perfil`, `turma`, `mural_post`...), PKs `id_*`, anexos em 1FN apontando para `storage.objects(id)`, buckets privados e RLS restritiva (Turma/Professor_Turma só pelo master; Perfil exige `id_escola`). A SPA (`src/`) **não foi adaptada** e continua falando com o esquema legado (`supabase/001..006_*.sql`):
- cerca de 85 chamadas `.from()/.storage/.channel` em 19 arquivos, a maioria **direto nos hooks** (mapa em `graphify-out/`: só `EntregaAtividadeFacade` e `NotificacaoSubject` encapsulam o acesso);
- cliente `createClient()` **sem tipos**, então a troca de esquema não gera nenhum erro de compilação;
- tipos da UI copiados das linhas legadas (`anexo_url`, `prof_id`, `url_anexo`);
- lógica de upload + `getPublicUrl` + `JSON.stringify(urls)` duplicada em 4 lugares e incompatível com buckets privados.

Lacunas do próprio SQL detectadas na revisão: sem publicação Realtime, sem trigger `handle_new_user`, sem gerador de `Alerta_Calendario` e sem permissão para o professor remover arquivos de entrega da própria turma.

## 2. Decisão Arquitetural
1. **Singleton tipado:** `supabaseClient.ts` passa a `createClient<Database>()`, com `src/lib/database.types.ts` gerado pelo Supabase CLI (`supabase gen types typescript --local`). Nenhuma biblioteca nova. O `tsc` vira o inventário de quebras.
2. **Mappers (Data Mapper leve):** `src/lib/db/mappers.ts` com funções puras Row → Domínio que **preservam os contratos da UI**. Os IDs `SERIAL` são expostos como `string` no domínio, e os repositórios convertem de volta.
3. **Facade genérica de anexos:** `src/patterns/facade/AnexoStorageFacade.ts`, parametrizada por `{ bucket, tabela, colunaPai }` e reutilizada por `atividade_anexo`, `duvida_anexo` e `ticket_suporte_anexo`. Usa `upload().data.id` como `id_objeto_storage`, compensa o upload se o INSERT falhar, remove só pela Storage API e lê por `createSignedUrls`. A `EntregaAtividadeFacade` é adaptada às mesmas regras.
4. **Repository por agregado (padrão novo, aprovado):** `src/repositories/` com 6 repositórios (`Perfil`, `EscolaTurma`, `Atividade`, `Duvida`, `Mural`, `Comunicacao`). Cada um tem interface `I*Repository` e cliente injetável no construtor, no mesmo estilo da Facade. Os hooks passam a depender só dessas interfaces.
5. **Protection Proxy alinhado à RLS:** `src/lib/permissoes.ts` com funções puras que espelham as políticas. A UI esconde as ações que a RLS negaria.
6. **Observer:** os canais passam a usar as tabelas e colunas novas, definidos em uma configuração única em vez de blocos copiados.
7. **SQL complementar em arquivo próprio:** `docker/constructionsSQL/05_supabase_funcoes_realtime.sql` (o `04` continua só com RLS, conforme a ADR-008) com `handle_new_user`, `ALTER PUBLICATION supabase_realtime`, a policy de DELETE do professor no bucket `entregas_atividades` e o gerador de alertas via `pg_cron`.
8. **Ordem obrigatória Storage ↔ FK (`ON DELETE CASCADE`):**
   - *Reenvio:* upload novo → UPSERT apontando para o novo `id` → só então `remove()` do objeto antigo.
   - *Exclusão de atividade:* remover objetos de entregas → objetos de anexos → linha da atividade.

## 3. Alternativas Consideradas e Descartadas (Anti-Decisões)
| Alternativa | Motivo do descarte |
|:---|:---|
| Opção 4-B: só Facade + mappers, hooks chamando `supabase` direto | Mantém o acoplamento hook↔banco que causou a quebra em massa; os hooks precisam ser reescritos de qualquer forma |
| Repository por tabela (18 classes) | Overengineering; as regras de negócio vivem no agregado, não na tabela |
| Alertas de calendário calculados no navegador | O esquema (`minutos_antes IN (1,5)`, `UNIQUE`) foi desenhado para geração idempotente no servidor; cada aba recalcularia e precisaria deduplicar |
| Reescrever o `04_supabase_auth_rls.sql` | A ADR-008 exige que ele contenha só RLS |
| Manter `getPublicUrl` com buckets públicos | Os buckets privados são decisão de segurança da ADR-008 |
| Mudar os IDs do domínio para `number` | Propaga mudança para `Record<string, TurmaProps>` e componentes sem ganho funcional |

## 4. Mapeamento de Arquivos
- `docker/constructionsSQL/05_supabase_funcoes_realtime.sql` (novo)
- `src/lib/database.types.ts` (novo, gerado), `src/lib/supabaseClient.ts` (atualizado)
- `src/lib/db/mappers.ts`, `src/lib/permissoes.ts` (novos)
- `src/patterns/facade/AnexoStorageFacade.ts` (novo), `EntregaAtividadeFacade.ts` (atualizado)
- `src/repositories/*Repository.ts` (novos)
- `src/patterns/observer/NotificacaoSubject.ts` (atualizado)
- Hooks em `src/hooks/**` e componentes `Login.tsx`, `Navbar.tsx`, formulários de atividade/evento, denúncia (atualizados)
- `supabase/functions/deletar-conta/index.ts` (atualizado)

## 5. Antes vs. Depois
- **Antes:** hooks → `supabase` sem tipos → tabelas legadas; anexos como URLs públicas serializadas em JSON.
- **Depois:** hooks → `I*Repository` → mappers + `AnexoStorageFacade` → `supabase<Database>` → esquema normalizado + RLS; anexos como linhas 1FN com URL assinada.

## 6. Análise de Risco e Mitigação
- **Risco 1:** regressão funcional ampla (19 arquivos). **Mitigação:** migração por agregado em ordem de dependência, com `tsc` + `vitest` verdes a cada item.
- **Risco 2:** órfãos ou perda de entrega pela cascata da FK de Storage. **Mitigação:** ordem obrigatória (item 8) coberta por testes de borda.
- **Risco 3:** cadastro quebrado sem `handle_new_user`. **Mitigação:** trigger no `05_*.sql` + seletor de escola no `Login`.
- **Risco 4:** `pg_cron` indisponível fora do Supabase. **Mitigação:** fallback local `verificarLembretesLocais` mantido; o esquema já depende do Supabase.
- **Risco 5:** testes de RLS reais adiados para o final. **Mitigação:** `permissoes.spec.ts` espelha a matriz RLS desde já; a validação real fica no Passo 9-B.

## 7. Consequências (Trade-offs)
- **Positivas:** quebras detectadas em compilação; hooks testáveis com repositório falso; anexos unificados e seguros; UI coerente com a RLS.
- **Negativas / Atenção:** mais uma camada (`src/repositories/`); dependência do Supabase CLI para regenerar tipos sempre que o SQL mudar.

## 8. Comandos de Rollback
```powershell
git checkout -- src/ supabase/functions/
Remove-Item -Recurse src/repositories, src/lib/db
Remove-Item src/lib/database.types.ts, src/lib/permissoes.ts, src/patterns/facade/AnexoStorageFacade.ts, docker/constructionsSQL/05_supabase_funcoes_realtime.sql
```
