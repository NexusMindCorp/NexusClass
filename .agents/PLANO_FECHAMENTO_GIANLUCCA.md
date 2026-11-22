# Plano de fechamento do NexusClass

**Autor do encaminhamento** Gabriel Lineker (`GabrielLineker`), 21/11/2026  
**Responsável por todas as pendências** Gianlucca Paiva (`GianluccaPaiva`)  
**Referência de retomada** `DesiningTeste`, commit `60517fa`

## Estado que pode ser aproveitado

- **DCC061.** Gabriel confirmou que guardou o documento-texto, os slides e o roteiro fora do repositório. A remoção dos PDFs no commit `60517fa` foi intencional e antecipa a limpeza. Para ensaio e submissão, usar as cópias externas guardadas por Gabriel e manter os PDFs fora do Git. A parte prática tem 19 suítes e 144 testes, cobertura V8 de 98,16% de instruções, 93,35% de ramificações e 100% de funções e linhas no recorte `src/lib` e `src/patterns`.
- **DCC060 e dependência da refatoração.** A instalação limpa usou a carga atual e passou 16/16, incluindo RN12. O reteste da migração 10 passou no navegador e no banco, com reenvio antes da nota e avaliação preservando o arquivo. Ver [instalação](../relatorios/2026-11/2026-11-21-validacao-docker-banners.md) e [reteste](../relatorios/2026-11/2026-11-21-reteste-integrado-migracao-10.md). O fallback do banner já foi validado. A revisão da carga saiu do escopo.
- **Último commit do Gianlucca.** `a4ffaaf` atualiza métricas, slides e registros do Resend. O commit anterior `f912116` adicionou o roteiro manual e as versões das funções. O [consolidado](../relatorios/2026-11/2026-11-21-resumo-sessao-consolidado.md) registra HTTP 200 para os dois templates no ensaio Resend. O aceite no ambiente alvo ainda envolve confirmar a versão publicada e a entrega efetiva por denúncia e suporte. O painel e a spec da Fase 6 voltaram a listar a carga limpa e os banners como pendentes em alguns trechos. Usar as evidências locais acima para reconciliá-los.

## Ordem recomendada

### Contas reservadas para a apresentação

**Registro:** Gabriel Lineker (`GabrielLineker`), 21/11/2026. Preservar estas contas para o acesso do professor avaliador à aplicação:

- `prof@nexusclass.edu.br`
- `descarte@nexus.com`
- `testador@aluno.nexuclass.com`
- `jae@nexus.com`

Excluir as quatro contas de qualquer limpeza, exclusão em lote, reset da base ou teste de exclusão. Preservar Auth, perfil, papel, escola, vínculos, anexos e credenciais durante a janela da apresentação. A conta `descarte@nexus.com` fica reservada para a apresentação apesar do nome. Antes de executar um roteiro com escrita ou remoção, conferir o projeto e a lista de alvos. Se alguma das quatro contas estiver no escopo, interromper a operação e alinhar com Gabriel. Para testes destrutivos, criar contas descartáveis próprias no Docker local. Conferir a disponibilidade das contas antes da entrega, mantendo senhas e tokens fora do Git.

1. **Fechar DCC061.** Combinar com Gabriel o acesso às cópias externas, conferir autores e formato conforme o [enunciado](../.docs/DCC061_Trabalho.md) e confirmar a submissão do documento, slides e código pelo canal da disciplina. Ensaiar 15 a 20 minutos com a aba Informações e o PDF. Priorizar Adapter/Factory e Facade e demonstrar reenvio e avaliação com contas de teste. Ao atualizar material acadêmico, distinguir os testes com dublês, o ensaio do provedor e a validação do ambiente publicado.
2. **Fechar E4/DCC060 com o Grupo 24.** Confirmar se a entrega histórica encerra a E4 ou se deve sair um pacote reconciliado. Se for reconciliado, exportar o relatório de [RELATORIO_ATUALIZADO.md](../grupo24/RELATORIO_ATUALIZADO.md) para PDF e o [modelo.drawio](../grupo24/modelo.drawio) para PNG. Marcar os PDFs, o DER e os SQL antigos como artefatos da E4. Indicar [docker/constructionsSQL](../docker/constructionsSQL/) e a ordem `01 → 04 → 02 → 05 → 06…16 → 03` como referência homologada em Docker. A pasta `grupo24/sql` ainda usa `entrega_url` e contém 11 casos. Manter a carga versionada.
3. **Decidir e verificar a publicação.**
   - **Concluído em 22/11 por Gianlucca Paiva (`GianluccaPaiva`):**
     - **Supabase Edge Functions:** `resend-email` (`v2`, `ACTIVE`) e `resend-suport` (`v1`, `ACTIVE`) publicadas com `verify_jwt: true` no Supabase de teste, secrets `RESEND_API_KEY` e `DESTINATARIO_EMAIL` configurados no Dashboard e fluxo ponta a ponta validado ao vivo (`401` sem JWT, `HTTP 200` em denúncia e suporte com 1 anexo 1FN assinado, limpeza automática via `deletar-conta` sem tocar nas 4 contas reservadas). Ver [relatório](../relatorios/2026-11/2026-11-22-publicacao-validacao-resend-edge.md).
     - **Hardening Supabase (`17_hardening_supabase_seguranca.sql`):** auditoria completa (`S-01`..`S-06`), 12/12 asserções sob `ROLLBACK` e aplicação no Supabase de teste zerando os alertas `0028`/`0029` de `rls_auto_enable`. Ver [auditoria](../relatorios/2026-11/2026-11-22-auditoria-seguranca-supabase.md).
     - **Auditoria Vercel (`vercel.json` — V-03):** confirmada a *Production Branch* da Vercel como **`deploy`** (atualmente em `ce69de1` com `vercel.json` legado sem `headers`). O [`vercel.json`](../vercel.json) da `DesiningTeste` foi auditado contra `index.html`, `vite.config.ts` (`process.env.VERCEL ? '/'`) e todas as URLs externas de `src/` (Google Fonts, Pixabay, Supabase `https:`/`wss:`, Gemini), acrescido de `Strict-Transport-Security` (6 cabeçalhos HTTP de segurança) e validado em build local `VERCEL=1 npm run build`.
   - **Pendente na janela de publicação (sem commit/merge ainda):** ao promover `DesiningTeste` → `deploy`, confirmar na Vercel que `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_GEMINI_KEY` apontam para o banco normalizado de 18 tabelas, conferir os 6 cabeçalhos HTTP na URL publicada e decidir separadamente se o reenvio de confirmação entra na entrega (ou fica adiado). Antes de qualquer operação em produção, alinhar o destino e os efeitos com Gabriel.
4. **Consolidar e limpar o repositório depois de preservar a entrega.** Inventariar os arquivos com a ação **manter, atualizar, fundir, arquivar ou remover**, considerando quem os usa e quais links apontam para eles. Usar o handoff como entrada e os relatórios de instalação e reteste como evidência primária. Consolidar resumos redundantes de status, mantendo datas, autoria, commits e links de evidência. Atualizar o painel, a spec da Fase 6 e a da Fase 6-A para refletirem o 9-B aprovado, os banners validados e a publicação pendente. Sinalizar a análise antiga de padrões e os SQL da E4 como históricos quando permanecerem na árvore. Preservar enunciados, ADRs vigentes, artefatos exigidos e a sequência SQL validada. Antes de remover ou mover arquivos, revisar o diff e as referências do README, do índice, dos ADRs e dos relatórios. Aplicar a limpeza pós-Fase 7 do [plano original](../.docs/PLANEJAMENTO_REFATORACAO.md) somente após definir onde o grupo vai manter o histórico e a documentação de entrega.
5. **Registrar o fechamento.** Anotar as decisões acadêmicas, a evidência de publicação ou o adiamento, o local dos arquivos consolidados e a revisão Git usada. Conferir juntos os links, PDFs, fontes do modelo e estado da branch antes da entrega final.

**E5/DCC060.** Iniciar após o fechamento da E4 e da DCC061. Usar como ponto de partida o modelo reconciliado, a carga vigente e a sequência SQL validada.
