# Comunicação Realtime, dúvidas e suporte

**Autor** Gabriel Lineker (`GabrielLineker`)  
**Ambiente** Supabase de teste, 20/11/2026

O [roteiro](../../scripts/validar-comunicacao-realtime.mjs) executou com a chave pública e sessões autenticadas das contas de teste. Nenhum SQL foi executado no editor.

| Cenário | Evidência da execução final |
|---|---|
| Chat em tempo real | **Passou.** A sessão do professor recebeu o evento `INSERT` da mensagem 8 pelo canal Realtime e confirmou o ID retornado ao aluno. |
| Resposta a dúvida | **Passou.** O aluno abriu a dúvida 7 na DCC000. O professor vinculado respondeu, e o aluno leu a resposta com o estado resolvido. |
| Abertura de chamado | **Passou.** O aluno abriu o chamado 5 como pendente, e o master conseguiu consultá-lo. |

A primeira execução também confirmou os três cenários, mas manteve a conexão aberta. O roteiro passou a desconectar explicitamente o Realtime, e a segunda execução encerrou com código 0. Os registros das duas execuções ficaram identificados como descartáveis. A rodada cobre API e assinatura Realtime. Interface, anexos e exclusão de dúvidas exigem evidência própria.
