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

## Como registrar e fechar

**Escala RN01 — Gabriel Lineker (20/11).** A escala confirmada é 0–100, como no DDL. Alinhar o formulário docente, a validação e a visualização da nota pelo aluno. Manter os dados existentes no valor gravado, pois a origem de cada nota não distingue a escala usada na entrada. A obrigatoriedade e a extensão do feedback na RN01 ficam como critérios separados.

**Reuso de evidências — Gabriel Lineker (20/11).** Aproveitar cenários já comprovados na mesma configuração. Pedir novo teste manual apenas quando uma alteração puder invalidar o resultado anterior ou quando houver uma diferença relevante ainda sem evidência. Ao solicitar o reteste, indicar a condição nova e o resultado que ela confirma.

**Correção RN07 — Gabriel Lineker (20/11).** Registrar o atraso no envio com o relógio do banco e exibir o aviso na área de avaliação. Guardar o indicador separado do parecer docente, pois a RLS da primeira entrega exige feedback nulo. Para entregas anteriores à migração, derivar o aviso das datas disponíveis. Retestar entrega no prazo e atrasada, reenvio antes da nota e edição do parecer.

**Correção RN08 — Gabriel Lineker (20/11).** Aplicar a migração 07 após a 06 no Supabase de teste. A nota registrada é o marco do bloqueio, como na interface, inclusive se o feedback estiver vazio. A proteção deve abranger o registro e o arquivo da entrega. Validar com uma entrega descartável o reenvio sem nota, a avaliação e sua edição pelo professor vinculado, a leitura pelo aluno e a preservação do anexo após avaliação.

**Primeira execução automatizada — Gabriel Lineker (20/11).** O roteiro `node scripts/validar-leitura-e3.mjs` abre duas sessões temporárias no Edge. Após autenticar cada conta e abrir a aba Atividades da DCC000 nas duas janelas, o roteiro abre e verifica a entrega da E3. Ele verifica leitura pela interface e ausência da opção de substituir o arquivo após avaliação. A verificação de permissões de escrita no banco fica para o cenário descartável.

- Em **`.agents/features/`**, manter o checklist da fase e a autoria. Usar **`.agents/troubleshooting/`** para falhas reproduzidas e **`.agents/decisions/`** quando houver alteração de contrato que justifique ADR.
- Em **`.docs/`** e **`relatorios/`**, registrar autor, commit ou versão do ambiente, papel/escola, cenário, resultado esperado e observado, evidência sem credenciais, correção e reteste. Marcar cada cenário como aprovado, falhou, bloqueado ou pendente. Preservar no handoff o ponto exato de retomada.
- Atualizar **`grupo24/`** só após o fechamento da validação. Reconciliar requisitos, DER, modelo, scripts e resultados com a versão validada e incorporar os entregáveis acadêmicos da etapa aplicável. Registrar o que mudou desde a E4 e por quê.

Fontes: [Handoff](DOCUMENTACAO_APRESENTACAO.md), [Plano DCC061](PLANEJAMENTO_REFATORACAO.md), [Remodelagem do banco](PLANEJAMENTO_REMODELAGEM_ACESSO_BANCO.md) e [Relatório da E4](../grupo24/relatorio.pdf).
