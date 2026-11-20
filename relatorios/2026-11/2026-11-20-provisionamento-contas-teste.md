# Provisionamento das contas de teste

**Autor** Gabriel Lineker (`GabrielLineker`)  
**Data** 20/11/2026

A carga acadêmica cria registros no Auth sem uma senha utilizável na aplicação. O [roteiro separado](../../scripts/provisionar-contas-teste.mjs) usa o cadastro administrativo com o metadado de escola que o gatilho exige. Ele resolve as turmas pelo código, ajusta papel e escola e configura as matrículas e o vínculo docente da matriz.

**Passou em simulação local.** A execução padrão listou os cinco cenários e uma referência de projeto incorreta foi recusada. O [teste automatizado](../../scripts/provisionar-contas-teste.test.mjs) confirmou retomada após falha na primeira matrícula, reexecução sem novas contas ou troca de senha, três vínculos e recusa de conta encontrada sem marcador administrativo.

**Pendente no ambiente remoto.** Aplicar numa instalação descartável e verificar login e vínculos. Nenhum SQL foi executado nesta rodada e nenhuma conta hospedada foi alterada. Os comandos e as variáveis locais estão no [plano da Fase 6](../../.docs/PLANO_VALIDACAO_FASE_6_E_9B.md#como-registrar-e-fechar).
