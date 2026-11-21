# Fase 6 — Validação de sistema e Passo 9-B

- **Autor:** Gabriel Lineker (`GabrielLineker`) · Atualizado por Gianlucca Paiva (`GianluccaPaiva`)
- **Data:** 2026-11-19 (revisado em 2026-11-21)
- **Status:** Em andamento (Ordens 1, 2 e Exclusão de conta da Ordem 3 concluídas).

O [plano de execução](../../.docs/PLANO_VALIDACAO_FASE_6_E_9B.md) contém responsabilidades, cenários, critérios de passagem e roteiro para atualizar o pacote acadêmico após a validação.

- [x] Identificar a versão do frontend e do Supabase e confirmar a sessão do testador.
- [x] Registrar a [primeira rodada manual de teste de sistema](../../relatorios/2026-11/2026-11-19-primeira-rodada-sistema.md). Gabriel Lineker registrou os resultados e os pontos que dependem de confirmação no ambiente.
- [x] Validar a navegação com aluno vinculado, aluno de outra escola, professor vinculado, professor sem vínculo e master. Gabriel Lineker registrou os resultados e confirmou a restauração do papel da conta descartável após o reteste master.
- [x] Padronizar a preparação de credenciais da carga (`scripts/provisionar-contas-teste.mjs`) — validada no Supabase de teste em 20/11 (reprodução em instalação isolada prevista na Ordem 4).
- [x] Executar testes de componente (`16` suítes / `125` testes), E2E críticos, RLS ao vivo das Ordens 1 e 2 e exclusão de conta ponta a ponta (Ordem 3 — migração `14`, Edge Function `deletar-conta`, `BoxAlertaDeletaConta.tsx` e `scripts/validar-exclusao-conta.mjs`, por Gianlucca Paiva em 21/11). Ver [plano da exclusão de conta](../../.docs/PLANO_CORRECAO_DELECAO_CONTA.md) e [relatório](../../relatorios/2026-11/2026-11-21-correcao-validacao-exclusao-conta.md).
- [ ] Decidir e fechar os itens restantes da Ordem 3 (código público da escola, banners reais e reenvio de confirmação), validar a carga em instalação isolada e atualizar o pacote `grupo24/` (Ordem 4).
