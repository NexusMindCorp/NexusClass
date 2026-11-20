# Invalidação de alertas após reagendamento

**Autor** Gabriel Lineker (`GabrielLineker`)  
**Data** 20/11/2026

O [caso reproduzido](2026-11-20-calendario-comunicacao.md) mostrou um alerta no horário antigo e nenhum no novo. A [migração 12](../../docker/constructionsSQL/12_invalida_alertas_ao_reagendar.sql) prepara a remoção transacional dos alertas do evento quando a data ou a hora mudam. A revisão do SQL conferiu a condição de mudança real, o filtro pelo ID do evento, o `search_path` vazio e a revogação de execução para os papéis públicos da API. O gatilho fica sujeito à autorização existente de atualização do evento.

O [roteiro](../../scripts/validar-calendario-comunicacao.mjs) aceita `--somente-calendario` e verifica a remoção imediata do alerta antigo antes de aguardar o cron. A validação JavaScript e a inspeção do diff passaram.

**Aplicação e reteste — Gabriel Lineker.** A [migração 12](../../docker/constructionsSQL/12_invalida_alertas_ao_reagendar.sql) foi aplicada no SQL Editor do Supabase de teste, conforme confirmação de Gabriel. O roteiro focado criou o evento descartável 13, confirmou a remoção imediata do lembrete antigo e encontrou zero alertas para o horário original e exatamente um alerta de cinco minutos para o horário novo. O evento foi excluído depois, e a consulta administrativa pela API confirmou zero alertas restantes. A execução encerrou com código 0.
