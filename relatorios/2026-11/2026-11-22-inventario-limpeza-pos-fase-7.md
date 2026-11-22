# Inventário e Recomendação de Limpeza Pós-Fase 7 (Pré-Deploy)

- **Data:** 2026-11-22
- **Autor:** Gianlucca Paiva (`GianluccaPaiva`)
- **Branch de trabalho:** `DesiningTeste` (pré-promoção para `deploy`)
- **Referências:** [`.docs/PLANEJAMENTO_REFATORACAO.md`](../../.docs/PLANEJAMENTO_REFATORACAO.md) (§3 — Limpeza Final pós-Fase 7) e [`.agents/PLANO_FECHAMENTO_GIANLUCCA.md`](../../.agents/PLANO_FECHAMENTO_GIANLUCCA.md) (Item 4)
- **Base auditada:** 382 arquivos rastreados no Git (`git ls-files`) + assets em `public/` + referências cruzadas em `src/`, `testes/`, `docker/`, `supabase/` e documentação.

---

## 1. Contexto Técnico: O que vai para a Vercel vs. o que fica no Git

Antes de decidir o que remover, é importante distinguir dois escopos:

1. **Bundle servido em produção na Vercel (`dist/`):** o Vite empacota apenas `index.html`, os módulos importados a partir de `src/` e **todos os arquivos dentro de `public/`** (copiados integralmente para `dist/`). Portanto, qualquer arquivo morto dentro de `public/` (como imagens não referenciadas) **aumenta o tamanho do deploy publicado**.
2. **Árvore visível no repositório Git (`DesiningTeste` / `deploy`):** pastas como `.agents/`, `.docs/`, `relatorios/`, `scripts/`, `docker/`, `out/` e `grupo24/` **não entram no bundle da Vercel**, mas ficam expostas no repositório GitHub (impactando clareza na avaliação acadêmica, organização do projeto e risco de exposição acidental de identificadores antigos).

---

## 2. Bloco 1 — Remoção / Sanitização Obrigatória (Segurança, Higiene e Bundle)

Estes itens têm **ganho objetivo imediato e zero risco funcional**, devendo ser corrigidos **antes** de subir para a branch `deploy`.

| Alvo | Ação Recomendada | Por que remover / ajustar | Links / Efeitos colaterais |
| :--- | :---: | :--- | :--- |
| [`src/lib/database.types.ts`](../../src/lib/database.types.ts) (linha 7) | **Sanitizar comentário** | O cabeçalho gerado contém o identificador real do projeto Supabase de teste (`--project-id <PROJECT_REF_TESTE>`). Substituir por `<PROJECT_ID>` elimina vazamento de identificador de ambiente no código-fonte. | Nenhum (apenas comentário; exige `npx tsc` e `vitest` após edição por ser `.ts`). |
| `out/casos_de_uso/SupabaseMakdown/` (`supabase-schema-<PROJECT_REF_LEGADO> (3).png` e `supabase.mk`) | **Remover diretório** | Artefatos obsoletos do esquema antigo do Supabase que carregam um `project-ref` legado diretamente no nome do arquivo `.png`. O esquema atual já está em `out/diagramas/modelo_er.puml` e `grupo24/modelo.drawio`. | Citado apenas historicamente em `.docs/AnaliseDePossiveisDP.md:75` (documento não-normativo). |
| `supabase/.temp/cli-latest` | **Remover + adicionar ao `.gitignore`** | Arquivo temporário de 8 bytes gerado pela CLI do Supabase, versionado acidentalmente. Incluir `supabase/.temp/` no `.gitignore` evita que volte a ser rastreado. | Nenhum. |
| `public/Logos/imgLivro.png` *(2,30 MB)* | **Remover** | **Não é referenciado em nenhum arquivo** de `src/`, `index.html` ou `README.md` (a tela `Login.tsx` usa exclusivamente `public/Logos/imgLivroCF.png`). Hoje é copiado sem uso para `dist/` no deploy da Vercel, desperdiçando 2,30 MB. | Nenhum (confirmado via `git grep`). |
| `public/sons/tigreso.mp3` *(59 KB)* | **Remover** | **Não é referenciado em nenhum arquivo** de `src/` ou `index.html` (confirmado via busca case-insensitive `tigreso.mp3` / `sons/` / `Howl`). Hoje vai sem uso para `dist/`. *(Obs.: a dependência `howler` em `package.json` não precisa ser mexida agora sem necessidade, para não alterar lockfile às vésperas do deploy.)* | Nenhum. |

---

## 3. Bloco 2 — Remoção Recomendada (Legado, Duplicações e Scripts Pontuais)

Estes itens são código/documentação **substituídos pela arquitetura atual** e hoje geram ruído ou risco de confusão para quem clonar ou avaliar o repositório.

| Alvo | Ação Recomendada | Por que remover / ajustar | Links / Efeitos colaterais |
| :--- | :---: | :--- | :--- |
| `supabase/001_eventos_calendario.sql` até `supabase/006_seguranca_calendario.sql` *(6 arquivos)* | **Remover** | Scripts SQL do **esquema legado** (pré-Fase 6-A: tabelas no plural `perfis`, `turmas_escolares`, `entregas_atividades`, `duvidasalunostoprofessor`). Foram integralmente substituídos por `docker/constructionsSQL/01..17` e `grupo24/sql/`. **Preservar** `supabase/functions/*`! | `src/lib/utils.ts` (linhas 142 e 146) ainda cita `supabase/001_eventos_calendario.sql` numa mensagem de erro legada coberta por teste. Não impede remover os `.sql`, mas se alterar a string em `utils.ts`, atualizar o teste correspondente em `testes/lib/utils.spec.ts`. |
| `docker/edge_function/` *(3 arquivos: `deletar-conta`, `resend-email`, `resend-suport`)* | **Remover diretório** | Cópia espelhada redundante das Edge Functions oficiais em [`supabase/functions/`](../../supabase/functions/). Verificado em [`docker/structure/docker-compose.yml`](../../docker/structure/docker-compose.yml): o Compose **não** monta `docker/edge_function/` (monta apenas `../constructionsSQL`). Manter duas cópias gera risco de dessincronização. | Relatórios históricos em `relatorios/2026-11/` e `.docs/PENTEST_E_SEGURANCA_NEXUSCLASS.md` mencionam o caminho antigo; basta atualizar a referência em `PENTEST_E_SEGURANCA_NEXUSCLASS.md` para `supabase/functions/`. |
| `scripts/` — **43 scripts pontuais da Fase 6** *(ver detalhamento no §3.1)* | **Remover (mantendo apenas os 3 validadores reutilizáveis)** | A pasta acumulou **46 arquivos** durante as rodadas de depuração de 19–21/11 (incluindo SQLs de diagnóstico único `auditar-*.sql`, `verificar-*.sql`, `inventariar-*.sql`, `preparar-*.sql`, `restaurar-*.sql`, `conferir-*.sql`, `diagnosticar-*.sql`, scripts de checagem pontual e duplicata `provisionar-contas-teste.mjs` vs `provisionar-contas-teste.node.mjs`). Em produção/deploy, manter 43 scripts avulsos polui o repositório sem utilidade contínua. | Alguns relatórios históricos de 20/11 citam nomes desses scripts como registro do que foi rodado; o histórico completo permanece preservado no Git. |
| `Testes de segurança.pdf` *(raiz do repo)* | **Remover do Git** *(guardar cópia externa se necessário)* | PDF de evidência solto na raiz do repositório. Embora já tenha sido redigido/sanitizado (`0` vazamentos), o padrão adotado pela dupla na Fase 7 é manter PDFs de entrega acadêmica fora do Git (como feito com os 3 PDFs da DCC061), mantendo o consolidado técnico em `.docs/PENTEST_E_SEGURANCA_NEXUSCLASS.md`. | Citado em `.docs/PENTEST_E_SEGURANCA_NEXUSCLASS.md` e em `InfoAplicacao` (apenas como menção textual, sem link de download quebrável). |
| [`README.md`](../../README.md) *(raiz)* | **Atualizar (não remover)** | Ainda descreve o esquema antigo (`escolas`, `turmas_escolares`, `perfis`, `trigger_verificar_prazo`, `trigger_deletar_anexos_duvida`, escala de nota `0.00 a 10.00`). Atualizar o `README.md` alinha a vitrine do repositório no GitHub à arquitetura real de 18 tabelas, 7 Design Patterns GoF, 19 suítes / 144 testes e Edge Functions atuais. | Melhora direta para a avaliação e apresentação do projeto. |

### 3.1 Detalhamento da pasta `scripts/` (46 arquivos)

- **Manter (3 validadores reutilizáveis e úteis pós-deploy):**
  1. `scripts/validar-exclusao-conta.mjs` — valida ponta a ponta a Edge Function `deletar-conta` + limpeza do Storage (RN09).
  2. `scripts/validar-codigo-publico-escola.mjs` — valida cadastro com `codigo_escola` (`ESC-XXXXXXXX`), isolamento de `codigo_publico` e RPC `obter_codigo_publico_minha_escola()` (ADR-010 + Migração 17).
  3. `scripts/validar-envio-resend.mjs` — valida os templates HTML do provedor Resend sem expor chaves.
- **Remover (43 scripts pontuais / duplicados de diagnóstico único da Fase 6):**
  - **22 arquivos `.sql` de diagnóstico único:** `auditar-colunas-avaliacao.sql`, `auditar-politicas-entrega.sql`, `auditar-visibilidade-alertas-calendario.sql`, `conferir-retorno-migracao-10.sql`, `diagnosticar-fuso-alerta-calendario.sql`, `inventariar-matriz-supabase-teste.sql`, `inventariar-vinculos-docentes-testador.sql`, `preparar-master-controle.sql`, `preparar-professor-controle-dcc000.sql`, `restaurar-professor-controle.sql`, `verificar-agendamento-alertas.sql`, `verificar-alertas-evento-reteste.sql`, `verificar-aluno-controle-dcc000.sql`, `verificar-cenarios-migracao-10.sql`, `verificar-conexao-supabase-teste.sql`, `verificar-configuracao-calendario-realtime.sql`, `verificar-fuso-funcao-alertas.sql`, `verificar-gatilho-avaliacao-docente.sql`, `verificar-perfis-controle-dcc000.sql`, `verificar-professor-controle-dcc000.sql`, `verificar-rn08.sql`.
  - **21 arquivos `.js`/`.mjs` pontuais ou duplicados:** `automacao-cadastro.js`, `provisionar-contas-teste.mjs`, `provisionar-contas-teste.node.mjs`, `renovar-sessoes-playwright.mjs`, `validar-acesso-dcc000.mjs`, `validar-acesso-dcc001.mjs`, `validar-alertas-calendario.mjs`, `validar-aluno-outra-escola.mjs`, `validar-anexo-duvida-denuncia.mjs`, `validar-cadastro-matricula.mjs`, `validar-calendario-comunicacao.mjs`, `validar-comunicacao-realtime.mjs`, `validar-imagens-turma.mjs`, `validar-lacunas-entrega-calendario.mjs`, `validar-leitura-e3.mjs`, `validar-leitura-rls-entrega.mjs`, `validar-master-turmas.mjs`, `validar-migracao-10.mjs`, `validar-ordem-mural.mjs`, `validar-primeira-entrega.mjs`, `validar-professor-sem-vinculo.mjs`, `validar-realtime-mural.mjs`.
  - *(Alternativa ainda mais enxuta para `deploy`: remover toda a pasta `scripts/` caso você não queira nenhum script auxiliar versionado.)*

---

## 4. Bloco 3 — Governança Interna pós-Fase 7 (Decisão Estratégica)

O [`.docs/PLANEJAMENTO_REFATORACAO.md`](../../.docs/PLANEJAMENTO_REFATORACAO.md) (§3, linhas 44–48) prevê explicitamente, ao concluir a Fase 7, retirar da árvore versionada do Git os arquivos internos de governança de IA/sessão (mantendo-os nos discos locais e no histórico de commits):

```bash
git rm -r --cached .agents .docs relatorios AGENTS.md
```

*(Adicionando `.agents/`, `.docs/`, `relatorios/`, `AGENTS.md` e `GEMINI.md` ao `.gitignore`.)*

| Item | Quantidade | Ação Prevista | Trade-off e Recomendação |
| :--- | :---: | :---: | :--- |
| `.agents/` *(regras, ADRs, specs, troubleshooting)* | 36 arquivos | **Ocultar via `--cached` + `.gitignore`** *(ou manter na `DesiningTeste`)* | **Atenção:** remover do Git agora faz com que Gabriel deixe de receber atualizações via `git pull` e oculta os 11 ADRs do GitHub. Só executar `git rm --cached` quando a dupla confirmar que todas as cópias finais de DCC061 estão fechadas e que não haverá mais handoff por essas pastas. |
| `.docs/` *(planejamentos, análises antigas, doc viva)* | 11 arquivos | **Ocultar via `--cached` + `.gitignore`** *(idem acima)* | Contém rascunhos históricos (`AnaliseDePossiveisDP.md`, `PLANO_CORRECAO_DELECAO_CONTA.md`, `RELATORIO_ESTADO_ATUAL_2026-11-19.md`) e a doc viva (`DOCUMENTACAO_APRESENTACAO.md`). |
| `relatorios/` *(35 relatórios de sessão)* | 35 arquivos | **Ocultar via `--cached` + `.gitignore`** *(idem acima)* | Útil durante o desenvolvimento em dupla; desnecessário na branch de produção `deploy`. |
| `AGENTS.md` (deletado localmente) e `GEMINI.md` (não rastreado) | 2 arquivos | **Definir padrão único** | Hoje `AGENTS.md` está marcado como `D` e `GEMINI.md` como `??`. **Recomendação:** se for aplicar o Bloco 3, remover `AGENTS.md` do índice Git e adicionar tanto `AGENTS.md` quanto `GEMINI.md` no `.gitignore` (mantendo `GEMINI.md` só no disco local para o agente). Se mantiver governança versionada, evitar deixar os dois em estado inconsistente. |

> **Recomendação prática (`best-practices-first`):**
> - **Fazer agora (antes de subir `deploy`):** **Bloco 1 (obrigatório)** + **Bloco 2 (recomendado)**. Isso já remove vazamentos de `project-ref`, 2,36 MB de assets mortos do bundle da Vercel, 6 SQLs legados, 3 Edge Functions duplicadas, 43 scripts pontuais e o PDF solto na raiz — **sem** quebrar a sincronização com o Gabriel.
> - **Sobre o Bloco 3 (`.agents/`, `.docs/`, `relatorios/`, `AGENTS.md`/`GEMINI.md`):** aplicar **apenas após alinhar com o Gabriel** que não precisam mais dessas pastas no remoto (ou aplicar somente na branch `deploy` se quiser manter o histórico de governança visível na `DesiningTeste`).

---

## 5. Bloco 4 — O que NÃO deve ser removido (Preservação Obrigatória)

| Diretório / Arquivo | Motivo da Preservação |
| :--- | :--- |
| `src/` *(143 arquivos, incluindo `src/patterns/` e `src/repositories/`)* | Código-fonte da aplicação em produção e implementação dos 7 Design Patterns (DCC061). |
| `testes/` *(19 suítes / 144 testes)* + `setupTests.ts` | Suíte automatizada de testes (98,16% Stmts / 100% Funcs & Lines em `src/lib` + `src/patterns`). |
| `public/Logos/Logo.png`, `public/Logos/imgLivroCF.png`, `public/perfilBot/perfilBot.jpg`, `public/perfilBot/perfilBot2.png` | Assets efetivamente renderizados em `index.html`, `Login.tsx`, `AppSidebar.tsx`, `BoasVindas.tsx`, `NotFound.tsx` e `configBot.ts`. |
| `supabase/functions/{deletar-conta,resend-email,resend-suport}/index.ts` | Código canônico das 3 Edge Functions ativas no Supabase (`verify_jwt: true`). |
| `docker/constructionsSQL/` (`000` + `01`..`17`) e `docker/structure/docker-compose.yml` | Trilha incremental homologada em Docker (`16/16` + Migração `17` `12/12` sob `ROLLBACK`). |
| `grupo24/` *(pacote reconciliado no padrão `modelo_trabalho_v3.pdf` + `sql_e4_historico/`)* | Entregável acadêmico ativo de DCC060 (E4 reconciliada e base direta para E5 em 27/11 e E6 em 11/12). |
| `out/diagramas/*.puml` *(4 diagramas PlantUML)* | Diagramas UML/ER atualizados (7 padrões GoF + 18 tabelas + estados). |
| `vercel.json`, `vite.config.ts`, `index.html`, `package.json`, `package-lock.json`, `tsconfig*.json`, `eslint.config.js`, `components.json`, `.env.example`, `.github/workflows/deploy.yml` | Configurações essenciais de build, lint, deploy na Vercel/GitHub Pages e variáveis de ambiente. |
| **4 Contas Reservadas no Supabase** (`prof@nexusclass.edu.br`, `descarte@nexus.com`, `testador@aluno.nexuclass.com`, `jae@nexus.com`) | Reservadas para avaliação ao vivo; nunca alterar, resetar ou excluir. |

---

## 6. Validação Obrigatória Após Executar a Limpeza

Caso os Blocos 1 e 2 sejam executados (especialmente por tocar em `src/lib/database.types.ts` e `public/`), rodar antes de commitar e promover para `deploy`:

1. `npx tsc -p tsconfig.app.json --noEmit --incremental false && npx tsc -p tsconfig.node.json --noEmit --incremental false` (`0` erros);
2. `npx vitest run` (**19 suítes / 144 testes** verdes);
3. `$env:VERCEL='1'; npx vite build` (confirmar redução de ~2,36 MB em `dist/` e `0` erros de build);
4. Varredura anti-vazamento em `src/`, `grupo24/`, `supabase/`, `docker/` e `out/` confirmando `0` ocorrências de `project-ref` real, chaves ou tokens.
