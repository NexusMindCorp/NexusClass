# Recursão de RLS ao entregar atividade

- **Autor:** Gabriel Lineker (`GabrielLineker`)
- **Sintoma confirmado:** o envio retorna `Infinite recursion detected in policy for relation "entrega_atividade"`.

A política de reenvio em `04_supabase_auth_rls.sql` lê `entrega_atividade` dentro da condição de atualização da própria tabela. O frontend grava a entrega com `upsert`, que inclui o caminho de atualização.

A [migração corretiva](../../docker/constructionsSQL/06_corrige_rls_reenvio_entrega.sql) transfere a comparação com o registro existente para uma função de escopo restrito. Ela verifica a propriedade da entrega e preserva nota e feedback. A política continua exigindo matrícula ativa no registro original e no destino do reenvio. A política de avaliação de professor e master permanece separada.

**Reteste manual registrado por Gabriel Lineker.** Após aplicar a migração no Supabase de teste, a conta de aluno repetiu o envio que falhava e recebeu a confirmação de entrega. Gabriel observou uma demora, sem medição de tempo.

Gabriel confirmou que o anexo continuou disponível ao voltar à atividade. Um envio em outra atividade também funcionou e foi percebido como mais rápido, sem medição de tempo.

Gabriel confirmou que o reenvio na mesma atividade funcionou dentro e fora do prazo. A matriz ainda inclui preservação de nota e feedback, avaliação pelo professor vinculado ou master e rejeição de aluno sem vínculo ou de outra escola. A RN07 da E4 pede um aviso automático no feedback em caso de atraso. Esse aviso ainda precisa ser conferido na visão do professor. O reenvio após avaliação é um cenário separado da RN08.
