# Validação local da Fase 6 e do Passo 9-B

**Autor** Gabriel Lineker (`GabrielLineker`)  
**Data** 21/11/2026  
**Referência inicial** `465f3c2` (`DesiningTeste`)

1. Preparar Supabase local em Docker, com projeto e volume dedicados e configuração independente da produção. Conferir o destino antes da primeira escrita.
2. Aplicar `01 → 04 → 02 → 05 → 06…16 → 03` com parada no primeiro erro, usando o `02_carga.sql` atual. Registrar o resultado dos 16 casos, incluindo RN12. Adiar a revisão da carga.
3. Conferir os papéis, vínculos e isolamento com os scripts de diagnóstico. Provisionar as contas da matriz conforme necessário e retestar a migração 10 em entregas descartáveis, cobrindo avaliação docente e reenvio antes da nota.
4. Implementar fallback de banner no cartão e no mural com cor determinística por turma para URL ausente ou imagem indisponível. Validar URL válida, ausente e com falha. Executar Vitest e TypeScript após alterações de código.
5. Registrar resultados no handoff, nos slides e no relatório. Tratar o reenvio de confirmação junto à frente de e-mail e verificar os cabeçalhos após a publicação. Qualquer acesso necessário ao Supabase real será comunicado antes.

Referências [Plano da Fase 6 e do Passo 9-B](PLANO_VALIDACAO_FASE_6_E_9B.md) e [sequência consolidada](../relatorios/2026-11/2026-11-21-resumo-sessao-consolidado.md).

## Execução local

A sequência oficial rodou no projeto Docker `nexusclass-ordem4-465f3c2` com a carga versionada, 16/16 casos aprovados e `ROLLBACK` no fim da verificação. O reteste SQL da migração 10 passou com papel `authenticated`, dados descartáveis e `ROLLBACK`. A interface recebeu o fallback compartilhado. Ver [relatório da rodada](../relatorios/2026-11/2026-11-21-validacao-docker-banners.md).

**Fechamento técnico — Gabriel Lineker (`GabrielLineker`), 21/11/2026.** O reteste integrado da migração 10 passou no Edge contra o Supabase local. O relatório do Grupo 24 foi reconciliado com os resultados. Revisão da carga reservada a uma decisão futura. Publicação e reenvio de confirmação sob decisão de Gianlucca Paiva. [Evidência do reteste](../relatorios/2026-11/2026-11-21-reteste-integrado-migracao-10.md)
