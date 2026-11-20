# Validação de calendário e comunicação

**Autor** Gabriel Lineker (`GabrielLineker`)  
**Data** 20/11/2026  
**Ambiente** Supabase de teste

O [roteiro automatizado](../../scripts/validar-calendario-comunicacao.mjs) usou sessões com a chave pública da aplicação. A conferência física da cascata usou uma consulta administrativa pela API. Nenhum SQL foi executado no editor.

| Cenário | Resultado observado |
|---|---|
| Chat | **Passou.** O professor destinatário leu a mensagem descartável 6. O aluno da outra escola recebeu zero registros. |
| Denúncia | **Passou.** A denúncia descartável 5 foi registrada como pendente e apareceu para o master. O professor denunciado e o aluno de outra escola receberam zero registros. |
| Reagendamento | **Falhou.** O cron gerou o primeiro lembrete de cinco minutos do evento 12. Após alterar o horário, permaneceu um lembrete antigo e nenhum apareceu para o novo horário na janela esperada. |
| Cascata | **Passou.** O professor excluiu o evento descartável 12. A consulta administrativa mostrou zero alertas restantes, após um alerta ter sido verificado antes da exclusão. |

O [agendador](../../docker/constructionsSQL/05_supabase_funcoes_realtime.sql:151) descarta candidatos se já existe um alerta para o mesmo evento e a mesma antecedência, sem comparar o instante do lembrete. Como a alteração da data e do horário não invalida o alerta antigo, ele pode ocupar toda a janela de criação do novo. A interface atual expõe criação e remoção de evento. O reagendamento foi exercitado pela API de propósito, como teste de integridade do backend.

Mensagem e denúncia ficaram identificadas como registros descartáveis. Esta rodada confirma persistência e leitura pela API. Toast de denúncia no navegador, entrega de mensagem por Realtime, resposta a dúvidas e suporte seguem como cenários distintos.
