# Limpeza pré-deploy e pacote acadêmico local

- Autor: Gabriel Lineker (`GabrielLineker`)
- Data: 2026-11-22

Escopo aprovado a partir do inventário de 22/11: aplicar o Bloco 1, retirar a cópia das Edge Functions em `docker/edge_function/` e os seis SQLs legados de `supabase/`. Corrigir as orientações do calendário e suas expectativas nos testes. Retirar `grupo24/` da árvore versionada e preservar a cópia de trabalho da DCC060 em `atualizacoes/`, ignorada pelo Git. Manter scripts, governança, evidências e a trilha vigente de banco.

## Validação

- Checagem de tipos com `tsc -b --noEmit` concluída com sucesso.
- Vitest: 19 suítes e 144 testes passaram. No escopo de cobertura configurado: 98,16% statements, 93,35% branches e 100% funções e linhas.
- Os 16 arquivos de `grupo24/` foram conferidos contra a cópia local antes da remoção. `git check-ignore` confirmou que `atualizacoes/` está fora do versionamento.
- O build foi excluído da validação final a pedido de Gabriel. A publicação na Vercel permanece pendente.
