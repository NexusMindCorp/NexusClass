# Provisionamento das contas de teste

**Autor** Gabriel Lineker (`GabrielLineker`)  
**Data** 20/11/2026

A carga acadêmica cria registros no Auth sem uma senha utilizável na aplicação. O [roteiro separado](../../scripts/provisionar-contas-teste.mjs) usa o cadastro administrativo com o metadado de escola que o gatilho exige. Ele resolve as turmas pelo código, ajusta papel e escola e configura as matrículas e o vínculo docente da matriz.

**Passou em simulação local.** A execução padrão listou os cinco cenários e uma referência de projeto incorreta foi recusada. O [teste automatizado](../../scripts/provisionar-contas-teste.node.mjs) confirmou retomada após falha na primeira matrícula, reexecução sem novas contas ou troca de senha, três vínculos e recusa de conta encontrada sem marcador administrativo. Gabriel Lineker atualizou o nome do arquivo para evitar que o Vitest selecionasse o teste do Node.

**Passou no Supabase de teste — Gabriel Lineker.** A primeira tentativa parou antes do cadastro, na leitura das turmas. A reexecução com acesso de rede criou as cinco contas. Todas iniciaram sessão com a chave pública da aplicação e conseguiram ler o próprio perfil. As consultas administrativas pela API confirmaram os três vínculos e a ausência de vínculo do professor de controle.

| Conta | Papel e escola | Vínculo confirmado |
|---|---|---|
| ALUNO_DCC000 | Aluno, escola 1 | Matrícula ativa na DCC000 |
| PROFESSOR_DCC000 | Professor, escola 1 | Docente da DCC000 |
| PROFESSOR_SEM_VINCULO | Professor, escola 1 | Sem vínculo docente |
| ALUNO_MAT101 | Aluno, escola 3 | Matrícula ativa na MAT101 |
| MASTER | Master, sem escola | Sem vínculo exigido |

As sessões usadas na verificação foram encerradas. O provisionamento e as consultas usaram a API do Supabase. Nenhum SQL foi executado no editor. Os comandos e as variáveis locais estão no [plano da Fase 6](../../.docs/PLANO_VALIDACAO_FASE_6_E_9B.md#como-registrar-e-fechar).
