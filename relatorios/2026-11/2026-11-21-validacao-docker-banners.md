# Validação local da instalação e dos banners

**Autor** Gabriel Lineker (`GabrielLineker`)  
**Data** 21/11/2026  
**Ambiente** Supabase local no Docker, projeto `nexusclass-ordem4-465f3c2`, a partir de `465f3c2`.

- Instalação `01 → 04 → 02 → 05 → 06…16 → 03` com a carga existente. A verificação confirmou 16/16, incluindo RN12, com código 0 e `ROLLBACK`.
- Consultas de conexão, matriz de perfis, gatilhos de avaliação, configuração de Realtime e fuso dos alertas executadas com código 0 no container dedicado.
- Migração 10 validada no banco com sessão simulada de papel `authenticated`: reenvio antes da nota, avaliação docente, recusa da alteração de horário pelo professor e preservação do estado esperado. Transação revertida. O roteiro completo pela SPA ainda requer reteste.
- Provisionamento de cinco contas descartáveis com modo explícito `--aplicar-local`, limitado ao endereço loopback previsto. As cinco contas autenticaram com o papel e a escola esperados. O aluno da MAT101 recebeu zero entregas na atividade de controle da DCC000 e o master recebeu a entrega de controle. A leitura do catálogo de turmas é pública pela política vigente. Upload, download e remoção do arquivo descartável passaram pela API do Storage.
- Fallback compartilhado entre cartão e mural. O Edge em página isolada confirmou URL nula e vazia, diferença de cor entre duas turmas, imagem válida, falha de imagem e área preservada em viewport estreito. Na SPA apontada para o Docker, passou o fluxo login → pesquisa → mural, com a mesma cor calculada no cartão e no mural para a DCC000 com URL nula. A URL original foi restaurada no Docker. A revisão do delta confirmou o uso do sanitizador existente antes de atribuir `src`.
- Vitest 140/140, TypeScript sem erros e teste independente do provisionador 1/1.

A revisão da carga, a publicação e a decisão de reenvio de confirmação foram adiadas. A rodada utilizou somente o Supabase local.
