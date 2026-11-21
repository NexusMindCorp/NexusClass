# Atualização do Pacote Grupo 24 e Correção de `03_verificacao.sql`

- **Autor:** Gianlucca Paiva (`GianluccaPaiva`)
- **Data:** 2026-11-21
- **Frente:** Fase 6 / Passo 9-B — Ordem 4 (Preparação de verificação SQL e reconciliação de `grupo24/`)
- **Ambiente:** Supabase de teste (`REF_DO_PROJETO`)

---

## 1. Resumo das Entregas
Execução em paralelo (via swarm com dois workers especializados) das duas frentes de preparação da Ordem 4:

1. **Correção e ampliação de [`docker/constructionsSQL/03_verificacao.sql`](../../docker/constructionsSQL/03_verificacao.sql):**
   - Envolvido em `BEGIN; ... ROLLBACK;` (100% reversível, zero alteração persistida).
   - Todos os IDs inteiros legados migrados para os UUIDs determinísticos de `02_carga.sql` (`00000000-0000-0000-0000-000000000004`, `...000000000008`, etc.) e datas fixas substituídas por datas relativas em `America/Sao_Paulo`.
   - Adicionadas asserções estritas (`GET STACKED DIAGNOSTICS` + `RAISE EXCEPTION` quando uma violação esperada não ocorre).
   - Cobertura ampliada de 8 para **16 testes**: os 11 testes do relatório da E4 + 5 testes das regras vigentes (**Teste 12 — RN11**, **Teste 13 — RN12**, **Teste 14 — RN01 feedback / Migração 09**, **Teste 15 — RN04 data passada / Migração 13** e **Teste 16 — invalidação de alertas ao reagendar / Migração 12**).
2. **Reconciliação do pacote acadêmico em `grupo24/`:**
   - [`grupo24/modelo.drawio`](../../grupo24/modelo.drawio) atualizado (preservando paleta visual e XML válido): adicionado relacionamento `Pertence` (`Perfil` ↔ `Escola` para RN11/RN12), `EntregaAtividade` atualizada com `id_objeto_storage` + `atraso` (removido atributo derivado `no_prazo`) e anexos multivalorados alinhados ao Storage (`anexos_storage*`).
   - [`grupo24/RELATORIO_ATUALIZADO.md`](../../grupo24/RELATORIO_ATUALIZADO.md) criado preservando integralmente as Seções 1–5 (incluindo as 10 consultas de Álgebra Relacional e cobertura de operadores) + Apêndice A de `relatorio.pdf`, reconciliando RN01–RN12, as 18 tabelas do Modelo Lógico, `v_storage_objetos`, RLS (`04`), Realtime/`pg_cron` (`05`), migrações `06`–`14`, sequência de instalação limpa (`01 → 04 → 02 → 05 → 06..14 → 03`) e a Seção 6 (evolução desde a E4 e pendências explícitas).
   - PDFs binários originais (`grupo24/relatorio.pdf`, `grupo24/modelo_trabalho_v3.pdf`) e `grupo24/der.png` preservados intactos (prontos para reexportação após revisão da dupla).

---

## 2. Arquivos Tocados

| Arquivo | Ação | Finalidade |
|:---|:---|:---|
| [`docker/constructionsSQL/03_verificacao.sql`](../../docker/constructionsSQL/03_verificacao.sql) | Reescrito | 16 testes de integridade reversíveis com UUIDs, datas relativas e asserções estritas |
| [`grupo24/modelo.drawio`](../../grupo24/modelo.drawio) | Atualizado | DER reconciliado com RN11/RN12 (`Pertence`), `id_objeto_storage` e `atraso` |
| [`grupo24/RELATORIO_ATUALIZADO.md`](../../grupo24/RELATORIO_ATUALIZADO.md) | Criado | Relatório acadêmico completo reconciliado com `01`–`14` e evidências da Fase 6 |
| [`.docs/DOCUMENTACAO_APRESENTACAO.md`](../../.docs/DOCUMENTACAO_APRESENTACAO.md) | Atualizado | Handoff e Diário de Sessões |

---

## 3. Validação Executada

| Verificação | Resultado observado | Status |
|:---|:---|:---|
| Execução ao vivo de `03_verificacao.sql` no Supabase de teste (`BEGIN ... ROLLBACK`) | **15/16 testes passaram** (Testes 1–12 e 14–16 aprovados, sem alteração persistida). **Achado real no Teste 13 (RN12):** a instância de teste atual foi criada antes do commit `bd0994c` e não tem `trg_aluno_turma_escola` / `trg_professor_turma_escola` instalados (e `DCC002` ainda tem `id_escola = 2`), confirmando que a validação completa dos 16/16 depende da instalação limpa da Ordem 4. | **15/16 ao vivo + achado documentado** |
| Parse XML de `grupo24/modelo.drawio` | Parse limpo (`167` células `mxCell`) | **Passou** |
| Varredura de identificadores sensíveis | `0` ocorrências em `03_verificacao.sql` e `grupo24/` | **Passou** |

---

## 4. Handoff / Ponto de Retomada
- **Executado por:** Gianlucca Paiva (`GianluccaPaiva`) em 2026-11-21.
- **O que ficou pronto:** `03_verificacao.sql` (16 testes) corrigido e testado ao vivo sob `ROLLBACK`; `grupo24/modelo.drawio` e `grupo24/RELATORIO_ATUALIZADO.md` atualizados.
- **Impactos para a Ordem 4:** Na instalação isolada limpa (`01 → 04 → 02 → 05 → 06..14 → 03`), os triggers RN12 de `01_esquema.sql` estarão presentes e todos os **16/16 testes** de `03_verificacao.sql` devem passar. Reexportar `grupo24/der.png` a partir de `grupo24/modelo.drawio` e gerar o PDF final a partir de `grupo24/RELATORIO_ATUALIZADO.md` após fechar as decisões pendentes da Ordem 3 e a validação da instalação isolada.
- **Próximo passo exato:** Fechar decisões restantes da Ordem 3 (código público da escola, banners reais, reenvio de confirmação), tornar `09_valida_feedback_avaliacao.sql` idempotente e executar a carga isolada do zero na Ordem 4.
