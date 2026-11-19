# NexusClass — estado atual do projeto

- **Data de corte:** 19/11/2026
- **Autor:** Gabriel Lineker (`GabrielLineker`)
- **Base analisada:** `DesiningTeste` em `2dca412`, coincidente com a referência local `origin/DesiningTeste`. A árvore de trabalho estava limpa no início da análise.

## Resumo

O NexusClass é uma aplicação web escolar com autenticação, turmas, atividades, comunicação e assistência por IA. A principal mudança recente foi a adaptação da SPA ao modelo relacional normalizado. Gianlucca concluiu essa etapa no código em 17/11. A execução desta revisão confirmou os **113 testes em 13 suítes**. A evidência disponível para a aplicação do esquema no Supabase, migração de dados existentes e comportamento integrado ainda depende da Fase 6 e do Passo 9-B.

O progresso acadêmico está em duas frentes. Em **DCC060**, o banco ganhou um modelo relacional, regras de integridade e uma adaptação ao Supabase. Em **DCC061**, os sete padrões GoF do plano aparecem em fluxos concretos, com testes e material de apresentação. A Fase 6-A conectou as duas frentes por meio de tipagem, mapeamento de dados e repositórios.

## 1. Evolução no Git

A ponta analisada tinha 397 commits alcançáveis e 248 arquivos versionados. As referências locais de `origin/main` e `DesiningTeste` tinham, respectivamente, 28 e 289 commits exclusivos. `deploy` e `frontComBack` apontavam para `ce69de1` (24/06, versão 1.2.02). Esses dados descrevem o checkout e suas referências locais. A revisão não confirmou o commit publicado em cada hospedagem.

| Período | Evolução registrada |
|---|---|
| Fevereiro a maio | Base React/Vite, componentes, navegação, organização de turmas e evolução dos fluxos iniciais. |
| Junho | Autenticação e rotas protegidas, mural, atividades, calendário, mensagens e integração dos assistentes com dados escolares. A versão 1.2.02 ficou em `ce69de1`. |
| Setembro e outubro | Preparação do ambiente de testes (`c98a0a5`), cobertura e catálogo de padrões (`22bf21a`), apresentação DCC061 e base de testes com Gabriel. Gianlucca implementou Adapter e Factory (`25c997c`, `3d9a858`, `91e9098`). |
| 5 de novembro | Gabriel implementou Facade para entregas (`3c40bad`) e Observer para notificações (`14aaaeb`). Gianlucca implementou Strategy (`ef93f30`, `7873ff6`) e documentou Singleton e Protection Proxy no catálogo, no UML e no handoff (`0c327af`, `9268271`, `6e56197`). |
| 9 a 16 de novembro | Gianlucca estruturou o ambiente PostgreSQL e o esquema (`da631aa`), depois integrou Auth, Storage, RLS e Edge Functions (`9c9f042` e ADR-008). |
| 17 de novembro | Gianlucca ajustou os vínculos com escolas (`bd0994c`), criou o SQL complementar (`01d7edb`), tipou o cliente e introduziu mapeadores e seis repositórios (`a09e8c4`, `82aea79`, `7730ec7`). Migrou hooks, Realtime, permissões e exclusão de conta (`eb11183`, `d517016`, `dd5aff7`, `6a0dd61`). Atualizou testes e encerrou a implementação (`618db71`, `b193442`). O commit `2dca412` registrou os diagnósticos de cadastro e sandbox. |

O relatório anterior mencionava `D AGENTS.md` e `?? GEMINI.md` na máquina daquela sessão. No checkout desta análise, `AGENTS.md` estava versionado e essas alterações não apareciam no status.

## 2. O que a aplicação contém

O React entrega a SPA com Vite, TypeScript, Tailwind, Shadcn/Radix e React Router. `App.tsx` usa `BrowserRouter`, rota pública de login, layout protegido e tratamento de rota desconhecida. A navegação interna combina sidebar, navbar e gerenciador de telas. Supabase fornece autenticação, Postgres, Storage e Realtime. A integração Gemini roda pelo adaptador consumido pelo hook dos assistentes.

| Domínio | Fluxo e pontos de entrada |
|---|---|
| Identidade | Login, cadastro com código de escola, sessão, perfil, avatar e configurações. `useAuth`, `PerfilRepository`, `ProtectedRoute` e `BoxRestrito` ligam sessão, perfil e interface. |
| Escola e turmas | Pesquisa, turmas inscritas, matrícula, desinscrição e participantes. `EscolaTurmaRepository` concentra consultas e vínculos. A aplicação restringe matrícula ao aluno da mesma escola e evita o fallback de escola para perfis comuns. |
| Mural e atividades | Mural, comentários, tarefas, anexos, entrega/reenvio e avaliação. `MuralRepository` e `AtividadeRepository` concentram persistência, com fachadas para operações que combinam banco e Storage. |
| Dúvidas | Canal aluno–professor com anexos, resposta e filtros por perfil e situação. `DuvidaRepository`, `useDuvidas` e `FiltroStrategy` sustentam o fluxo. |
| Comunicação | Mensagens privadas, calendário pessoal e de turma e notificações. `ComunicacaoRepository` concentra consultas e gravações. `NotificacaoSubject` conecta os eventos Realtime a ações da interface. |
| Serviços auxiliares | Suporte, sugestões, denúncias, preferências, exclusão de conta e aba Informações. O diretório `supabase/functions` contém a função de exclusão voltada ao esquema novo. Há outros fontes Edge em `docker/edge_function`, cuja publicação depende do ambiente. |
| IA | Tigreso e Falcão compartilham o contrato de assistente. A Factory escolhe a configuração e o Adapter encapsula o SDK, as chamadas de funções e o tratamento de indisponibilidade. |

Fontes: [Mapa funcional](AnaliseMaisAtualDoSistema.md), [App](../src/App.tsx), [Repositórios](../src/repositories/index.ts) e [Relatório da Fase 6-A](../relatorios/2026-11/2026-11-17-fase-6a-remodelagem-acesso-banco.md).

## 3. Modelo relacional e camada de acesso

`supabase/001…006` documenta a evolução do modelo anterior. O contrato consumido pelo TypeScript nesta branch é o modelo em `docker/constructionsSQL`. Ele tem 18 tabelas, FKs e constraints. `Perfil.id_perfil` usa o UUID de `auth.users`. Escola e turma conservam IDs inteiros, convertidos nos pontos em que o domínio da SPA usa texto. Os vínculos de matrícula e docência são tabelas próprias, com validação de escola para os participantes.

Atividades, dúvidas e suporte usam relações de anexo que referenciam o UUID de `storage.objects`. As entregas também referenciam o objeto. A view `v_storage_objetos` resolve o caminho sob as permissões do usuário, e a SPA usa URLs assinadas. No reenvio, a fachada faz upload do novo arquivo, atualiza o vínculo no banco e só então remove o arquivo anterior. Essa ordem evita excluir a entrega por cascata ao remover o objeto antigo.

| Script | Papel na implantação |
|---|---|
| `01_esquema.sql` | Cria o modelo de domínio com chaves, vínculos e regras. Começa com `DROP TABLE … CASCADE` e depende de estruturas Auth e Storage. Serve para reconstrução em ambiente controlado. |
| `04_supabase_auth_rls.sql` | Habilita RLS, define políticas por papel e vínculo e configura buckets. A segurança efetiva depende das políticas instaladas na instância. |
| `02_carga.sql` | Insere dados de exemplo, incluindo usuários com papéis diferentes. A carga de referência tem finalidade de teste e demonstração. |
| `05_supabase_funcoes_realtime.sql` | Cria o gatilho de cadastro com papel fixo de aluno, configura as cinco tabelas Realtime quando a publicação existe, adiciona política de remoção ao professor vinculado, agenda alertas com `pg_cron` e cria a view segura do Storage. |
| `03_verificacao.sql` | Exercícios DCC060 escritos para o modelo anterior. Há IDs inteiros usados em condições que agora envolvem UUID. Requer revisão para voltar a servir como evidência do esquema atual. |

A sequência documentada para uma **instância Supabase de teste**, com carga de exemplo, é `01 → 04 → 02 → 05`. A carga precede o gatilho de cadastro porque cria usuários de diferentes papéis e não fornece os metadados esperados pelo gatilho. O Compose atual sobe apenas PostgreSQL 17 e monta toda a pasta SQL no diretório de inicialização. Num volume novo, essa configuração oferece os arquivos em ordem nominal e não provisiona `auth.users`, `storage.objects` ou a publicação do Supabase. Portanto, há uma diferença concreta entre iniciar o contêiner e ter o ambiente exigido pelo teste integrado. A análise não executou os scripts no banco.

A arquitetura de acesso pode ser lida como **componente → hook → repositório ou fachada → cliente Supabase tipado**. `database.types.ts` descreve o contrato SQL. `mappers.ts` converte linhas, resultados de junções, campos de armazenamento e identificadores para os tipos consumidos pela SPA. Os seis repositórios cobrem **Perfil, EscolaTurma, Atividade, Duvida, Mural e Comunicacao**. Auth e Realtime ainda têm pontos de integração direta com o SDK. A separação já reduz SQL e detalhes de Storage nos hooks, embora alguns repositórios importem tipos definidos em pastas de hooks e ainda existam `any` em componentes e contratos. A remoção dessa dependência reversa não é pré-requisito para a Fase 6.

Fontes: [ADR-008](../.agents/decisions/adr-008-esquema-sql-supabase-auth-storage-rls.md), [ADR-009](../.agents/decisions/adr-009-camada-acesso-dados-esquema-normalizado.md), [Plano 6-A](PLANEJAMENTO_REMODELAGEM_ACESSO_BANCO.md), [Scripts](../docker/constructionsSQL/) e [Compose](../docker/structure/docker-compose.yml).

## 4. Engenharia de software e testes

| Fase | Entrega e efeito |
|---|---|
| 0 | Setup de testes, globais simuladas e baseline. A suite passou a reportar cobertura dos módulos selecionados. |
| 1 | **Adapter** isola Gemini. **Factory** concentra a configuração de Tigreso e Falcão. |
| 2 | **Facade** organiza envio, reenvio, listagem e avaliação. A Fase 6-A também criou `AnexoStorageFacade` para os três domínios que usam relações de anexo. |
| 3 | **Strategy** concentra critérios de pesquisa de turmas e filtros da central de dúvidas. |
| 4 | **Observer** separa os eventos Realtime das reações da interface, como atualização de estado, toast e contadores. |
| 5 | **Singleton** documenta a instância de Supabase compartilhada via módulo. **Protection Proxy** documenta a proteção na navegação e na apresentação de ações. A RLS continua sendo a barreira de autorização dos dados. |
| 6-A | **Repository** e **Data Mapper** adaptam a SPA ao modelo novo. São complementares aos sete GoF. A implementação está fechada e a validação ao vivo foi transferida para 9-B. |
| 6 e 9-B | Em aberto. Testes de componente, E2E login → turma → entrega e integração real de RLS, cadastro e alertas. |
| 7 | Fechamento da apresentação, refinamento visual da aba Informações e decisão sobre o versionamento final dos artefatos de trabalho da dupla. |

Template Method foi avaliado e descartado por falta de uma repetição de fluxo que justificasse o padrão. O catálogo e o UML registram os padrões adotados.

Em 19/11, `npm.cmd run test:coverage` concluiu com **13 arquivos de teste e 113 testes aprovados**. Em `src/lib` e `src/patterns`, o V8 registrou **98% de instruções** (589/601), **92,87% de ramificações** (430/463), **100% de funções** (151/151) e **100% de linhas** (546/546). Há testes de três repositórios executados na suíte, mas os arquivos de `src/repositories` ficam fora do escopo do indicador de cobertura. O mesmo vale para a maior parte dos componentes e hooks.

O primeiro comando via PowerShell selecionou `npm.ps1` e foi bloqueado pela política de execução. `npm.cmd` alcançou o Vite, cujo carregador encontrou acesso negado ao ler caminhos ancestrais no sandbox. O mesmo comando concluiu fora do sandbox com a autorização solicitada. A suíte usa jsdom e dublês, portanto as 113 aprovações validam a lógica nesses cenários. O checkout contém a dependência Playwright, porém a análise não encontrou os cenários de Fase 6 e 9-B rodando como suíte instalada no repositório. A última validação estática da implementação com zero erros está registrada no relatório de 17/11.

Fontes: [Plano DCC061](PLANEJAMENTO_REFATORACAO.md), [Catálogo dos padrões](../src/patterns/README.md), [UML](../out/diagramas/diagrama_classes_detalhado.puml), [Configuração de cobertura](../vite.config.ts) e [Testes](../testes/).

## 5. Pontos que afetam a próxima fase

| Prioridade | Evidência e consequência |
|---|---|
| Antes de implantar | **Dados existentes.** Os scripts observados descrevem reconstrução, políticas e carga de exemplo. Não encontrei um procedimento versionado de transição do banco legado com preservação verificada de usuários, matrículas, entregas, notas e arquivos. Se já houver dados a manter no destino, preparar e ensaiar essa transição com cópia e plano de retorno antes de trocar a SPA de ambiente. |
| Antes de validar 9-B | **Ambiente reproduzível.** Usar uma instância Supabase isolada para conferir esquema, buckets, Edge Function, RLS, trigger de cadastro, cron e publicação Realtime. O relatório de 17/11 deixa explicitamente pendente a aplicação do `05` na instância alvo. |
| Na definição do teste de autorização | **Isolamento de escolas.** O cliente restringe escola e matrícula, mas `04` declara leitura de `Escola` e `Turma` para `anon` e `authenticated` com `USING (true)`. Confirmar a intenção de manter o catálogo público e testar as permissões do restante dos dados com dois estabelecimentos e os três papéis. |
| Na jornada de atividade | **Escala de nota.** `BoxEntregaAtividade.tsx` valida e exibe 0–10. O SQL aceita 0–100, a fachada grava a nota recebida e o mapper devolve o valor do banco. Se a base contiver notas acima de 10, a interface pode exibi-las sobre um denominador de 10. Unificar o contrato ou definir conversão antes de aceitar os cenários E2E de avaliação. |
| No teste de exclusão | **Limpeza parcial.** A Edge Function tenta remover objetos antes de remover a conta. O retorno da chamada de remoção de objetos não é inspecionado naquele trecho e há tratamento que permite a operação de Auth prosseguir após erro de limpeza. Verificar contagem e propriedade dos objetos após exclusão e o comportamento em falhas parciais. |
| Antes de publicar o frontend | **Configuração e credencial Gemini.** Vite injeta `VITE_GEMINI_KEY` no bundle consumido pelo adaptador. Tratar qualquer valor embutido como visível a quem recebe o bundle e revisar configuração de ambiente e credenciais antes da publicação. O workflow de Pages observado dispara em `main`, usa Node 22 e não executa a suíte Vitest como etapa explícita. Há configuração de roteamento para Vercel no checkout. |
| No teste de cadastro | **Confirmação de e-mail.** O último troubleshooting registra bloqueio 429 no Supabase. A interface traduz o erro e conserva os dados do cadastro. A confirmação da configuração de e-mail e o teste real de criação do perfil continuam dependentes da instância. |

Evidências: [DDL](../docker/constructionsSQL/01_esquema.sql), [RLS](../docker/constructionsSQL/04_supabase_auth_rls.sql), [Avaliação na interface](../src/components/BoxEntregaAtividade.tsx), [Mapper](../src/lib/db/mappers.ts), [Edge Function](../supabase/functions/deletar-conta/index.ts), [Vite](../vite.config.ts), [Workflow Pages](../.github/workflows/deploy.yml) e [Troubleshooting do cadastro](../.agents/troubleshooting/supabase-signup-429-rate-limit.md).

## 6. Como ler a documentação do projeto

- [Documentação viva](DOCUMENTACAO_APRESENTACAO.md), [índice de governança](../.agents/INICIALIZACAO.md) e [relatório de 17/11](../relatorios/2026-11/2026-11-17-fase-6a-remodelagem-acesso-banco.md) dão o ponto de retomada. As tabelas de fases e cobertura são históricas e precisam ser lidas com o escopo de cada medição.
- [Mapa funcional](AnaliseMaisAtualDoSistema.md) continua útil para entender telas, ações e papéis. Detalhes de implementação, como a menção a React Router v6 e as referências ao armazenamento anterior, precisam ser confrontados com `package.json`, código e DDL atuais.
- [README](../README.md) ainda apresenta o ERD e automações do modelo legado. Por exemplo, cita `turmas_escolares`, `perfis` e a rotina mensal de dúvidas. A rotina e o gatilho de limpeza que ele descreve pertencem aos artefatos anteriores e sua equivalência operacional no modelo novo precisa ser demonstrada.
- [Análise de possíveis padrões](AnaliseDePossiveisDP.md) guarda hipóteses e exemplos anteriores à implementação. Os ADRs, specs, commits e testes mostram as decisões finais e os nomes efetivamente usados.
- Foram consultados o inventário e os trechos pertinentes dos seis documentos em `.docs`, os dez relatórios existentes nas pastas de outubro e novembro, as regras, specs, ADRs e registros de troubleshooting, além dos READMEs, diagramas, histórico Git e código por domínio. A análise tem como limite o material disponível no checkout e a suíte local. Estado de hospedagem, dados reais, cron em execução, SMTP e configuração de projeto Supabase exigem evidência do ambiente.

## 7. Ponto de retomada

O último marco de implementação é a **Fase 6-A de Gianlucca**. O próximo marco verificável é executar a **Fase 6 + Passo 9-B** contra o Supabase de teste. A ordem de dependência é validar o ambiente e o contrato de dados, confirmar acesso e isolamento por papel, validar cadastro e alertas, e executar a jornada de login, turma e entrega. O conjunto evidencia que Auth, Postgres, Storage e Realtime trabalham juntos pelo caminho real da SPA. A Fase 7 fecha a apresentação após reunir esses resultados.
