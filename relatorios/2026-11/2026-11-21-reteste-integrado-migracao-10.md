# Reteste integrado da migração 10

**Autor** Gabriel Lineker (`GabrielLineker`)  
**Data** 21/11/2026  
**Referência** `414533e` na `DesiningTeste`  
**Ambiente** Edge/Playwright, SPA local e Supabase do Docker dedicado `nexusclass-ordem4-465f3c2`

| Cenário | Resultado |
|---|---|
| Aluno da DCC000 reenvia entrega sem nota | Interface confirmou o envio. A entrega passou a apontar para outro objeto do Storage, com nota nula. |
| Professor vinculado avalia a entrega | A ação **Avaliar Trabalho** gravou com HTTP 204. A leitura posterior confirmou nota 70 e o feedback informado. |
| Integridade na avaliação | IDs, arquivo, horário da entrega e atraso preservados. O teste SQL da rodada anterior já havia confirmado a recusa de alteração de campo proibido. |

O primeiro reteste parou no controle docente porque procurava **Editar Nota/Feedback** em uma entrega sem nota. O seletor foi ajustado ao estado da entrega e a execução seguinte passou. As atividades descartáveis e os dois arquivos remanescentes foram removidos. A rodada ocorreu no Docker local.

O relatório do Grupo 24 registra a instalação limpa e a evidência da SPA. A exportação de PDF e PNG depende do formato exigido para a submissão. Gianlucca Paiva decide a publicação e o reenvio de confirmação. A carga versionada foi preservada.
