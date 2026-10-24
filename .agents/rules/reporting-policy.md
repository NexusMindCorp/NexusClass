---
name: reporting-policy
description: Relatórios de sessão e documentação viva de apresentação.
scope: universal
always_on: true
---

# Relatórios e Sincronização de Equipe (Handoff)
- **Versionamento Obrigatório:** As pastas `relatorios/` e `.docs/` são **públicas no repositório (rastreadas pelo Git)** para que a dupla de desenvolvedores compartilhe o histórico exato de execução e possa dividir/retomar etapas sem perda de contexto.
- **Leitura Prévia Obrigatória:** Ao iniciar uma sessão ou avançar de fase, sempre ler o último relatório em `relatorios/<mes-ano>/` e o bloco **Ponto de Retomada (Handoff)** em `.docs/DOCUMENTACAO_APRESENTACAO.md` para dar continuidade ao que foi feito no processo anterior, seguindo o `.docs/PLANEJAMENTO_REFATORACAO.md`.
- **Identificação de Autoria Obrigatória:** Toda atualização em relatórios, specs, ADRs e na documentação viva deve conter o nome do integrante responsável pela modificação (identificado automaticamente via `git config user.name`: **Gabriel Lineker** / `GabrielLineker` ou **Gianlucca Paiva** / `GianluccaPaiva`).
- **Relatório de Fim de Sessão:** Ao final de sessões com mudanças, gerar `relatorios/<mes-ano>/<AAAA-MM-DD>-<slug>.md` contendo no cabeçalho `- **Autor:** <Nome> (<git user.name>)` e as seções: (1) Resumo das entregas, (2) Arquivos tocados, (3) Validação/Testes executados e (4) **Handoff / Ponto de Retomada** (quem executou, o que ficou pronto, impactos para as próximas fases e próximo passo exato do planejamento).
- **Documentação viva + Slides na Aplicação:** atualizar `.docs/DOCUMENTACAO_APRESENTACAO.md` e `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts` a cada sessão (bloco de Handoff no topo com o campo `Última modificação por`, coluna `Responsável` no Painel de Progresso, coluna `Autor` no Diário de Sessões, snapshots de cobertura e status do padrão/teste). Sem excesso.
