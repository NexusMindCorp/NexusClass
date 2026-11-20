# Ordem 2 — Lacunas de entrega e calendário

**Autor** Gabriel Lineker (`GabrielLineker`)  
**Ambiente** Vitest local, Edge e Supabase de teste

| Cenário | Resultado |
|---|---|
| Falha de upload | **Passou com dublê.** O envio foi interrompido antes da gravação da entrega. |
| Falha de gravação após upload | **Passou com dublê.** A compensação removeu o arquivo recém-enviado. A suíte focada encerrou com 16 testes aprovados. |
| Arquivo após avaliação | **Passou no Storage.** A sessão do aluno teve a atualização recusada e removeu zero objetos. Duas leituras confirmaram o conteúdo original. A nota e o vínculo com o objeto continuaram iguais. |
| Data passada no calendário | **Passou no Edge.** Hoje abriu o formulário. Ontem deixou apenas a orientação de selecionar uma data. |
| Data passada pela API | **Divergência.** O Supabase aceitou um evento pessoal em 01/01/2000. A interface aplica a regra em `comparaDataHj`, enquanto a política de inserção valida autoria e tipo. |

O [roteiro](../../scripts/validar-lacunas-entrega-calendario.mjs) removeu a atividade, o arquivo e o evento descartáveis ao final. A execução pela API marcou código 1 pela divergência, e o reteste isolado no Edge encerrou com código 0.

**Correção preparada — Gabriel Lineker.** A [migração 13](../../docker/constructionsSQL/13_bloqueia_evento_em_data_passada.sql) verifica a data civil de São Paulo antes da inserção e de mudanças de data ou hora. A função roda com privilégios do invocador, usa `search_path` vazio e tem a execução direta revogada dos papéis públicos da API. As políticas RLS e os eventos históricos permanecem como estavam. A comparação permite qualquer horário na data de hoje, seguindo a granularidade em dias do formulário.

A revisão estática e a verificação de sintaxe JavaScript passaram.

**Reteste passou — Gabriel Lineker.** Gabriel aplicou a migração 13 no SQL Editor do Supabase de teste. O roteiro `node --env-file=.env --env-file=.env.contas-teste.local scripts/validar-lacunas-entrega-calendario.mjs REF_DO_PROJETO --somente-calendario-api` encerrou com código 0. O banco aceitou a criação para hoje e o reagendamento para amanhã, recusou ontem nas duas operações com o código `23514` da migração e preservou a data válida após a recusa. O evento descartável foi removido.
