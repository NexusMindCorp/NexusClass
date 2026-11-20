# Plano de validação do NexusClass — Fase 6 e Passo 9-B

- **Autor:** Gabriel Lineker (`GabrielLineker`)
- **Data:** 2026-11-19
- **Status:** Planejado. A execução começa quando o ambiente e a sessão de testador estiverem disponíveis.

## Base de trabalho

Validar a SPA e o Supabase conforme estão implantados. O checkout `DesiningTeste` em `585c097` é a referência inicial de código, não uma confirmação da versão implantada. Antes de aplicar SQL, comparar os scripts e os contratos do repositório com a instância indicada por Gabriel. Registrar as mudanças posteriores de Gianlucca quando estiverem disponíveis. A entrega E4 em `grupo24/` serve para localizar diferenças de requisitos e aproveitar seus casos de verificação. A atualização do pacote fica para o fechamento, com base no banco e nos comportamentos efetivamente validados.

## Ordem de execução e responsabilidades

| Etapa | Gabriel | Codex | Critério para avançar |
|---|---|---|---|
| **1. Identificar o ambiente** | Indicar a URL e a instância permitida para testes, disponibilizar a sessão autenticada do testador e indicar onde estão os últimos ajustes do Gianlucca. | Registrar versão do frontend e versão do esquema quando verificáveis, papel e escola do testador, e os fluxos que o ambiente permite. Conferir se o SQL complementar, a função de exclusão e os serviços esperados estão disponíveis. | Ambiente confirmado, sessão funcional e diferenças de configuração registradas. |
| **2. Testar o site com a conta atual** | Autenticar quando houver interação de login ou código. Confirmar o comportamento esperado se houver dúvida de regra de negócio. | Rodar login → turma → atividade → entrega, quando permitido ao perfil. Verificar acesso às telas, mural por turma, dúvidas, calendário e funcionalidades que já estiverem disponíveis. Usar dados de teste identificáveis. Registrar banners e reenvio de e-mail como pendências conhecidas; conferir exclusão apenas até a confirmação. | Resultados registrados por fluxo, com bloqueios de acesso, erros e pendências conhecidas identificados. |
| **3. Preparar contas e carga** | Confirmar o destino autorizado para a atualização e viabilizar acesso administrativo quando o painel exigir. | Comparar a carga e as mudanças do Gianlucca. Preparar a criação de contas de teste em novas cargas e a habilitação das contas existentes como operações distintas. Preservar os IDs e vínculos de perfis existentes e evitar credenciais versionadas. Conferir login com aluno, professor e master, usando duas escolas para os cenários de isolamento. | Contas acessíveis, papéis e escolas conferidos, e carga testada de forma repetível em ambiente isolado. |
| **4. Validar sistema, RLS e integridade** | Resolver regras que divergirem entre o trabalho e a aplicação, como escala da nota ou visibilidade do catálogo de escolas. Autorizar separadamente a exclusão definitiva de uma conta descartável, se ela for testada. | Executar testes de componente e Playwright, a matriz por papel e escola, as verificações de integridade adaptadas e os testes ao vivo de Auth, Storage, Realtime e cron. Corrigir falhas reproduzidas dentro do escopo e repetir os cenários afetados. | Fluxos críticos aprovados no ambiente identificado. Divergências têm decisão, evidência e, quando aceitas como pendência, responsável. |
| **5. Fechar documentação e entrega** | Alinhar com Gianlucca as decisões finais e revisar o pacote acadêmico. | Consolidar resultados em `.docs`, atualizar o handoff e os slides com o estado confirmado e preparar as revisões de `grupo24/` que a etapa acadêmica exigir. | Documentação, SQL e diagramas correspondem ao comportamento validado. Pendências remanescentes estão explícitas. |

Alterações que recriem tabelas ou modifiquem dados já existentes exigem identificação do destino e tratamento compatível com esse ambiente. A carga volumosa da E4 serve aos experimentos de desempenho. Para testar autenticação e autorização, o conjunto menor de contas controladas é suficiente.

## O que verificar na rodada integrada

### Retomada — acesso de professor

**Registro de Gabriel Lineker (`GabrielLineker`).** Os testes com aluno já confirmaram envio, persistência do anexo e reenvio. O próximo marco é fechar o ciclo de avaliação com uma única conta docente da carga.

1. **Gabriel confirma a turma de teste.** Codex cruza a carga com o vínculo disponível no ambiente para identificar qual conta existente, Ana Paula ou Carlos Eduardo, é professora daquela turma. Se a turma anterior não tiver docente, usar uma turma com vínculo confirmado e gerar nela uma entrega atrasada de teste.
2. **Habilitar somente essa conta no Supabase Auth de teste.** Usar acesso administrativo para definir uma credencial da conta existente, preservando o UUID, o perfil e o vínculo. Gabriel usa o painel se o acesso administrativo estiver apenas com ele. Validar o login e a visualização da turma antes de prosseguir.
3. **Executar o ciclo de avaliação.** Professor abre a entrega atrasada, confere se há aviso no feedback (RN07), registra nota e feedback e confirma a persistência. Aluno volta à mesma entrega e tenta substituir o anexo após a avaliação (RN08). Codex registra cada resultado como aprovado ou falhou, com a evidência correspondente.
4. **Avançar para a matriz RLS.** Com o ciclo documentado, habilitar o master e preparar os perfis de outra escola. Uma falha no ciclo vira um achado para correção e reteste. A conta master não é um pré-requisito para a avaliação pelo professor.

| Área | Cenários mínimos |
|---|---|
| **Auth e cadastro — RF01, RN11** | Login por papel. Cadastro com escola válida e tentativa com escola inválida. Vínculo entre Auth e perfil, papel inicial de aluno e escola correta. Registrar a configuração de confirmação de e-mail e o estado do reenvio. |
| **Matrícula e mural — RF02–03, RN03 e RN12** | Inscrever, cancelar e tentar repetir o vínculo. Conferir mural da turma selecionada e recusa de vínculos entre escolas. Documentar separadamente a visibilidade do catálogo e a autorização sobre dados da turma. |
| **Atividade e entrega — RF04–05, RN01, RN07–08** | Professor publica, aluno envia e reenvia, professor avalia e aluno vê o resultado. Verificar nota e feedback no limite, envio atrasado e reenvio após avaliação. Conferir arquivo e registro após reenvio e após falha no upload ou na gravação. |
| **Dúvidas, mensagens, suporte e denúncias — RF06 e RF08–10, RN09** | Resposta do professor e anexos da dúvida, tentativa de leitura de anexo por perfil sem vínculo, exclusão de dúvida com verificação dos arquivos, chat entre participantes, abertura de ticket e registro de denúncia. |
| **Calendário — RF07, RN02 e RN04–06, RN10** | Eventos pessoais e de turma por papel, rejeição de data passada, lembretes de 1 e 5 minutos, reagendamento sem alertas duplicados e remoção por cascata. Confirmar que a execução veio do cron e que o evento é recebido pelo caminho Realtime quando aplicável. |
| **Banco e RLS — Passo 9-B** | Confirmar operações permitidas e negadas para aluno, professor e master, conferindo o estado dos registros após cada teste. Adaptar os 11 cenários da E4 ao esquema vigente, com dados de teste atuais, asserções sobre a restrição esperada e transações reversíveis em banco isolado. |
| **Automação — Fase 6** | Testes de componente para `ProtectedRoute`, `BoxRestrito` e filtro de dúvidas. Playwright para a jornada login → turma → entrega. Registrar execução, evidência e limites de cobertura. |

O **código público alfanumérico da escola** pode ser discutido após a primeira rodada. Se aprovado, registrar a decisão arquitetural aplicável em `.agents/decisions`, avaliar a manutenção do ID inteiro como chave interna e repetir cadastro, vínculo e autorização.

## Retomada — automação com Supabase e Playwright

**Autor:** Gabriel Lineker (`GabrielLineker`), 2026-11-20.

**Conexão verificada em 20/11 — Gabriel Lineker.** O MCP `supabase-nexusclass-teste` foi cadastrado no Codex CLI e autorizado por OAuth, restrito ao projeto do ambiente de teste e em modo somente leitura. Uma nova execução do CLI confirmou `public.entrega_atividade` existente e `transaction_read_only = on`. A sessão já aberta não expôs o servidor diretamente. A verificação foi realizada pelo CLI. A conexão atual serve para consultar catálogo, dados de teste e logs. Alterações continuam em um fluxo separado.

### Registro de SQL e critérios para avançar

**Controle master — Gabriel Lineker (20/11).** Reaproveitar a conta descartável do professor sem vínculo, cenário já registrado. O [SQL de preparação](../scripts/preparar-master-controle.sql) está pendente de execução no Supabase de teste e exige que a conta esteja sem vínculos docentes e de matrícula. A saída esperada é `master` com escola nula. No Playwright, autenticar a conta em sessão nova e conferir a visibilidade da DCC000 na escola 1 e de Cálculo Numérico na escola 3. Reverter o papel da conta descartável ao concluir a rodada administrativa.

- **Passou — preparação administrativa.** Gabriel executou o SQL no Supabase de teste e recebeu `master` com escola nula. O [roteiro Playwright](../scripts/validar-master-turmas.mjs) usa uma única sessão e registra cada escola separadamente.
- **Playwright — passou na escola 1 e falhou na escola 3.** O master abriu Banco de Dados pela pesquisa. Cálculo Numérico, confirmado na escola 3 pela rodada anterior, não apareceu para entrada. A inspeção do repositório mostra que `carregarDadosEscola` limita a busca a uma escola quando o perfil não tem escola e filtra as turmas pelo ID retornado. O resultado comprova um limite do catálogo da SPA. O [SQL de restauração](../scripts/restaurar-professor-controle.sql) está pendente e retorna a conta descartável ao papel professor na escola 1.
- **Passou — restauração administrativa.** O Supabase retornou `professor | 1` para a conta descartável. Gabriel Lineker registrou o resultado em 20/11.
- **Correção do catálogo — Gabriel Lineker (20/11).** Permitir que o master sem escola carregue as turmas visíveis para sua sessão em todas as escolas. Manter o filtro quando a chamada tem uma escola explícita ou quando o perfil é aluno ou professor. O teste de regressão deve cobrir o catálogo do master e o filtro dos demais papéis.
- **Passou — reteste Playwright do master.** Após a promoção temporária retornar `master | NULL`, o roteiro abriu **Banco de Dados** (escola 1) e **Cálculo Numérico** (escola 3) pela pesquisa. A execução terminou com código 0. A restauração do papel de professor após este reteste está pendente.
- **Passou — restauração após o reteste.** Gabriel Lineker executou o [SQL de restauração](../scripts/restaurar-professor-controle.sql) no Supabase de teste em 20/11. O retorno foi `professor | 1`. A rodada de navegação por papel está concluída. A cobertura direta de autorização no banco segue registrada separadamente.

**Professor de controle — Gabriel Lineker (20/11).** A [consulta de prontidão](../scripts/verificar-professor-controle-dcc000.sql) **passou** no Supabase de teste. A conta descartável está confirmada no Auth, tem papel aluno na escola 1 e não tem matrícula ativa nem vínculo docente com DCC000. O [SQL de preparação](../scripts/preparar-professor-controle-dcc000.sql) foi revisado e está pendente de execução administrativa. Ele altera só o papel dessa conta, sem criar vínculo. O resultado esperado é uma linha com `professor` e escola `1`. Depois, iniciar nova sessão no Playwright e registrar o comportamento da DCC000.

- **Passou — preparação administrativa.** Gabriel executou o SQL de preparação no Supabase de teste. A saída foi uma linha com papel `professor` e escola `1`. O roteiro Playwright confere a ausência da DCC000 na sidebar e na pesquisa docente. A estratégia de pesquisa do professor lista apenas turmas em que leciona.
- **Passou — Playwright.** O [roteiro do professor sem vínculo](../scripts/validar-professor-sem-vinculo.mjs) confirmou que a DCC000 não aparece na sidebar nem na pesquisa. A primeira tentativa esperava erroneamente um cartão visível sem a ação Entrar. A execução corrigida terminou com código 0.

**Aluno de outra escola — Gabriel Lineker (20/11).** Confirmar o perfil da conta de controle antes do login de teste. No navegador, verificar que a DCC000 não aparece na sidebar nem nas telas de pesquisa da escola 3. Comparar com a evidência já registrada do aluno vinculado. A visibilidade da interface fica registrada separadamente da autorização no banco.

- **Passou — Supabase de teste.** A [consulta da conta de controle](../scripts/verificar-aluno-controle-dcc000.sql) confirmou papel aluno, escola 3, DCC000 na escola 1 e ausência de matrícula ativa na DCC000.
- **Passou — Playwright.** O [roteiro da conta da escola 3](../scripts/validar-aluno-outra-escola.mjs) encerrou com código 0. A DCC000 ficou ausente na sidebar e na pesquisa, enquanto Cálculo Numérico apareceu como controle positivo.

**Acesso dos perfis de controle — Gabriel Lineker, 20/11/2026.** A [consulta de prontidão](../scripts/verificar-perfis-controle-dcc000.sql) **passou** no Supabase de teste. Existem no Auth três masters, um professor da escola 1 sem vínculo com DCC000 e um professor da escola 3. Todos esses perfis estão sem senha configurada e sem e-mail confirmado. A consulta não retornou aluno de outra escola. A rodada autenticada está bloqueada até haver uma conta de controle utilizável. A primeira conta necessária é um aluno da escola 3 cadastrado pelo NexusClass, que envia o código de escola exigido. Manter as duas contas da DCC000 para comparação.

**Lote de navegação e controles — Gabriel Lineker (20/11).** Abrir duas sessões temporárias e, após login, executar a navegação automaticamente. Verificar a entrada da DCC000 pela pesquisa como aluno, a abertura da turma pela sidebar como professor e as ações de dúvida e publicação exibidas por papel. O lote é de leitura e navegação. As ações abertas não são submetidas.

**Autor:** Gabriel Lineker (`GabrielLineker`), 2026-11-20.

- Antes de executar SQL pelo Codex, salvar a consulta em `scripts/` ou apontar para o arquivo de migração existente quando for esse o SQL executado. Registrar data, autor, ambiente, finalidade e arquivo no relatório da rodada. Depois registrar **passou**, **falhou** ou **bloqueado**, com o resultado esperado e o observado. Em caso de falha, registrar o erro relevante e manter a consulta original rastreável. Usar resultados resumidos e omitir credenciais, tokens e dados pessoais desnecessários.
- **Primeira execução registrada:** [verificação da conexão](../scripts/verificar-conexao-supabase-teste.sql), Supabase de teste, 20/11/2026. **Passou.** Retornou `entrega_atividade_existe = true` e `somente_leitura = on`.
- **Inventário da matriz:** [consulta executada](../scripts/inventariar-matriz-supabase-teste.sql), Supabase de teste, 20/11/2026, Gabriel Lineker. **Passou.** Retornou `transaction_read_only = on`. Aluno e professor atuais pertencem à escola da DCC000 e têm vínculo com ela. O banco tem três perfis master, um professor da mesma escola sem vínculo com DCC000, um professor de outra escola sem vínculo e 500 alunos da mesma escola sem matrícula ativa em DCC000. A consulta não encontrou aluno de outra escola. A presença de perfil não comprova acesso por login. Foram encontrados a função da 06, as quatro políticas da 07, a coluna e o gatilho ativo da 08 e a restrição da 09. A próxima ação é preparar a rodada com as duas contas conhecidas e selecionar as contas adicionais conforme a cobertura necessária.

| Ordem | Execução pelo Codex | Condição para avançar |
|---|---|---|
| 1. Inventário somente leitura | Conferir quais contas de teste, papéis, escolas e vínculos já existem e checar a presença dos objetos esperados das migrações 06–09. Reusar a evidência já registrada das políticas da 07. | Lista mínima de sessões já disponíveis e perfis realmente faltantes, com consultas e resultados registrados. |
| 2. Rodada em lote com as contas atuais | Automatizar navegação e verificações de leitura pela interface com Testador Noturno e professor vinculado. Separar a evidência da sessão da aplicação da consulta administrativa. | Um resultado por cenário novo. Reutilizar a E3 e as rodadas já confirmadas de nota, aviso, feedback e download. |
| 3. Completar perfis e isolamento | Se faltarem perfis, preparar apenas os dados de teste necessários. Executar os cenários de leitura por master, professor sem vínculo e perfil de outra escola. Usar dados descartáveis e o fluxo autorizado para cenários de escrita pendentes. | Resultados de acesso permitido ou negado por papel e escola, com limites de cobertura registrados. |
| 4. Fechar a fase | Automatizar os cenários restantes de maior impacto, consolidar achados e atualizar os artefatos acadêmicos após a validação. | Itens abertos têm evidência, correção ou decisão explícita da dupla. |

1. **Conectar o Supabase de teste.** Gabriel instala e autentica a integração Supabase, autorizando o projeto usado no ambiente local. Codex confirma o destino com uma consulta de leitura e confere as migrações 06–09 pelo catálogo e pelos objetos instalados. As quatro políticas da 07 já foram verificadas. Reaproveitar essa evidência enquanto a configuração permanecer a mesma.
2. **Preparar as sessões de teste.** Codex reaproveita o roteiro Playwright da E3 e agrupa os cenários por papel. Usar Testador Noturno e a conta de professor vinculada à DCC000. Habilitar master e perfis de outra escola quando forem necessários para a matriz. Gabriel autentica as contas quando solicitado. Se houver reutilização de sessão, guardar o estado apenas localmente, fora do Git.
3. **Executar a matriz de permissões em lote.** Conferir acesso a entregas e anexos por aluno, professor vinculado, perfil sem vínculo e master. Usar dados descartáveis nas verificações que exigirem mutação. Registrar separadamente os resultados pela interface, a inspeção do banco e as verificações com sessão de cada papel. O bloqueio efetivo de escrita após avaliação continua pendente.
4. **Cobrir as lacunas da Fase 6.** Automatizar os testes de componente e a jornada que efetivamente envia uma entrega. Priorizar os achados abertos em acesso à turma, vínculo docente, mural e denúncia. Depois cobrir cadastro, calendário, alertas e Realtime conforme a matriz acima.
5. **Fechar a documentação.** Consolidar evidências e atualizar `grupo24/` só no fechamento. Se a integração não estiver disponível, manter o Playwright em lote e reservar o SQL Editor manual às verificações administrativas que dependerem dele.

**Evidência reaproveitável.** A atividade E3 teve a leitura validada por Playwright como aluno e professor. Nas atividades descartáveis, passaram envio e reenvio antes da avaliação, leitura e download após a nota, aviso de atraso (RN07), escala de 0 a 100 e critérios de feedback (RN01). A RN08 passou pela interface e teve as políticas instaladas conferidas. Repetir apenas cenários afetados por uma mudança ou resultados ainda sem evidência.

## Como registrar e fechar

**Feedback RN01 — Gabriel Lineker (20/11).** Exigir feedback em avaliações com nota e ao menos 20 caracteres, descontados espaços nas extremidades, para nota abaixo de 60. Validar no formulário e no banco. Aplicar a restrição às inserções e atualizações futuras, preservando as avaliações antigas até sua revisão. Retestar apenas os limites de feedback que ainda não foram exercitados.

**Escala RN01 — Gabriel Lineker (20/11).** A escala confirmada é 0–100, como no DDL. Alinhar o formulário docente, a validação e a visualização da nota pelo aluno. Manter os dados existentes no valor gravado, pois a origem de cada nota não distingue a escala usada na entrada. A obrigatoriedade e a extensão do feedback na RN01 ficam como critérios separados.

**Reuso de evidências — Gabriel Lineker (20/11).** Aproveitar cenários já comprovados na mesma configuração. Pedir novo teste manual apenas quando uma alteração puder invalidar o resultado anterior ou quando houver uma diferença relevante ainda sem evidência. Ao solicitar o reteste, indicar a condição nova e o resultado que ela confirma.

**Correção RN07 — Gabriel Lineker (20/11).** Registrar o atraso no envio com o relógio do banco e exibir o aviso na área de avaliação. Guardar o indicador separado do parecer docente, pois a RLS da primeira entrega exige feedback nulo. Para entregas anteriores à migração, derivar o aviso das datas disponíveis. Retestar entrega no prazo e atrasada, reenvio antes da nota e edição do parecer.

**Correção RN08 — Gabriel Lineker (20/11).** Aplicar a migração 07 após a 06 no Supabase de teste. A nota registrada é o marco do bloqueio, como na interface, inclusive se o feedback estiver vazio. A proteção deve abranger o registro e o arquivo da entrega. Validar com uma entrega descartável o reenvio sem nota, a avaliação e sua edição pelo professor vinculado, a leitura pelo aluno e a preservação do anexo após avaliação.

**Primeira execução automatizada — Gabriel Lineker (20/11).** O roteiro `node scripts/validar-leitura-e3.mjs` abre duas sessões temporárias no Edge. Após autenticar cada conta e abrir a aba Atividades da DCC000 nas duas janelas, o roteiro abre e verifica a entrega da E3. Ele verifica leitura pela interface e ausência da opção de substituir o arquivo após avaliação. A verificação de permissões de escrita no banco fica para o cenário descartável.

- Em **`.agents/features/`**, manter o checklist da fase e a autoria. Usar **`.agents/troubleshooting/`** para falhas reproduzidas e **`.agents/decisions/`** quando houver alteração de contrato que justifique ADR.
- Em **`.docs/`** e **`relatorios/`**, registrar autor, commit ou versão do ambiente, papel/escola, cenário, resultado esperado e observado, evidência sem credenciais, correção e reteste. Marcar cada cenário como aprovado, falhou, bloqueado ou pendente. Preservar no handoff o ponto exato de retomada.
- Atualizar **`grupo24/`** só após o fechamento da validação. Reconciliar requisitos, DER, modelo, scripts e resultados com a versão validada e incorporar os entregáveis acadêmicos da etapa aplicável. Registrar o que mudou desde a E4 e por quê.

Fontes: [Handoff](DOCUMENTACAO_APRESENTACAO.md), [Plano DCC061](PLANEJAMENTO_REFATORACAO.md), [Remodelagem do banco](PLANEJAMENTO_REMODELAGEM_ACESSO_BANCO.md) e [Relatório da E4](../grupo24/relatorio.pdf).
