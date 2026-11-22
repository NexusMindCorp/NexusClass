# Grupo 24 — DCC060 (Banco de Dados) — NexusClass

**Equipe:** Gabriel Lineker (`202476025`), Gianlucca Paiva (`202476026`), João Victor (`202265109AC`)  
**Última atualização:** 2026-11-22 por **Gianlucca Paiva (`GianluccaPaiva`)**

Esta pasta segue a estrutura exigida por [`modelo_trabalho_v3.pdf`](modelo_trabalho_v3.pdf) (execução dos `.sql` em **ordem numérica estrita**), preservando separadamente os artefatos históricos congelados da Entrega E4.

---

## 1. Pacote Reconciliado Vigente (Padrão `modelo_trabalho_v3.pdf`)

| Artefato | Descrição |
| :--- | :--- |
| [`RELATORIO_ATUALIZADO.md`](RELATORIO_ATUALIZADO.md) | Relatório completo alinhado às seções oficiais do `modelo_trabalho_v3.pdf` (Identificação, Seções 1–5, slots 6–7, Apêndice A e Apêndice B de evolução). |
| [`RELATORIO_ATUALIZADO.pdf`](RELATORIO_ATUALIZADO.pdf) | PDF exportado de `RELATORIO_ATUALIZADO.md` *(no `.zip` final de entrega, usar como `relatorio.pdf`)*. |
| [`modelo.drawio`](modelo.drawio) | DER editável reconciliado (`Pertence`, `Escola.codigo_publico`, `EntregaAtividade.atraso`, `id_objeto_storage` e `anexos_storage*`). |
| [`der.png`](der.png) | Exportação visual atualizada do DER reconciliado (já no nome padrão exigido pelo `modelo_trabalho_v3.pdf`). |
| [`algebra/consultas_ar.md`](algebra/consultas_ar.md) | Esquema lógico de referência reconciliado (Seção 4.1) + as 10 consultas em Álgebra Relacional. |
| [`sql/01_esquema.sql`](sql/01_esquema.sql) | **DDL consolidado** (18 tabelas, constraints `01`+`08`+`09`+`15`+`16`, 4 buckets com limite 10 MB, 94 políticas RLS `04`+`05`+`06`+`07`+`17`, Realtime, RPCs `14`/`15` e Hardening `17`). |
| [`sql/02_carga.sql`](sql/02_carga.sql) | **Carga de dados** (10.013 usuários em `auth.users`+`Perfil`, **200.006 linhas** em `Entrega_Atividade` + `storage.objects`, `setval` e `ANALYZE;`). |
| [`sql/03_verificacao.sql`](sql/03_verificacao.sql) | **13 testes declarativos do DDL** sob `BEGIN; ... ROLLBACK;` com transcrição literal das mensagens `ERROR:` do PostgreSQL. |
| *`sql/04_consultas.sql`* | *Slot reservado para a E5 (Seção 6 — ≥ 12 consultas SQL).* |
| [`sql/05_visoes.sql`](sql/05_visoes.sql) | **Visão 1 (`public.v_storage_objetos`, `security_invoker = true`)** pronta; acrescentar +1 visão na E5 (Seção 7.1). |
| [`sql/06_triggers.sql`](sql/06_triggers.sql) | **8 gatilhos reais + rotina `pg_cron` (`America/Sao_Paulo`) + 6 testes de verificação (Seção 7.3)** — executa **após `02_carga.sql`**, sem conflitar com a carga em lote! |
| *`sql/07_indices.sql` / `experimentos.md`* | *Slots reservados para a E6 (Seção 8 — índices secundários e `EXPLAIN ANALYZE` sobre as 200.006 entregas).* |

### Ordem Estrita de Execução (`grupo24/sql/`)

```text
01_esquema.sql -> 02_carga.sql -> 03_verificacao.sql -> (04_consultas.sql) -> 05_visoes.sql -> 06_triggers.sql -> (07_indices.sql)
```

> **Requisito de ambiente:** os scripts em `grupo24/sql/` integram-se aos schemas gerenciados do **Supabase** (`auth.users`, `storage.objects`, `storage.buckets`, roles `anon`/`authenticated`/`service_role`, `pg_cron` e `supabase_realtime`). A trilha incremental completa (`01`..`17`) continua intacta em [`../docker/constructionsSQL/`](../docker/constructionsSQL/).

---

## 2. Artefatos Históricos da Entrega E4 (Preservados Intactos)

| Artefato Histórico (E4) | Motivo da Preservação |
| :--- | :--- |
| [`relatorio.pdf`](relatorio.pdf) | Relatório original entregue na E4. |
| [`modelo_trabalho_v3.pdf`](modelo_trabalho_v3.pdf) | Enunciado oficial e modelo de relatório v3 da disciplina DCC060. |
| [`sql_e4_historico/`](sql_e4_historico/) (`01_esquema.sql`, `02_carga.sql`, `03_verificacao.sql`) | Scripts legados da E4 para PostgreSQL puro (`entrega_url`, IDs inteiros e 11 testes). |
