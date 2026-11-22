# Revisão da entrega DCC061

- **Autor:** Gabriel Lineker (`GabrielLineker`)
- **Data:** 21/11/2026
- **Base revisada:** `bd0d682` e os três PDFs fornecidos em `entrega dcc 061/`.

## Comparativo das fases

Os totais por fase são marcos cumulativos. Os 16 casos SQL e os roteiros em navegador são evidências complementares à contagem Vitest.

| Fase | Antes e problema | Depois, decisão e ferramentas | Evidência no marco |
|---|---|---|---|
| 0 — Base | Uma suíte com três testes. Regras de tempo e variáveis de build dificultavam a execução repetível. | `setupTests.ts`, Vitest, fake timers, casos de fronteira em `utils.ts` e `assetPath.ts`. A base permitiu testar as refatorações seguintes. | 2 suítes, 29 testes. Linha de base de instruções de 4,27% no recorte inicial. |
| 1 — Adapter e Factory | `useChatBot` reunia acesso ao SDK e configuração de assistentes. | `IAssistenteIA` e `GeminiAdapter` isolam o SDK. `BotFactory` concentra a configuração de Tigreso e Falcão. Dublês permitem testar contrato, function calling e retry 503. | 4 suítes, 51 testes. |
| 2 — Facade | A lógica de submissão misturava upload, persistência e tratamento de arquivos no fluxo da interface. | `EntregaAtividadeFacade` coordena as operações. Sob o esquema normalizado, atualizar a referência antes de remover o arquivo antigo preserva a entrega por causa da FK com cascata. | 5 suítes, 66 testes. A ordem e a compensação por falha são verificadas em testes da fachada. |
| 3 — Strategy | Filtros de turmas e dúvidas estavam espalhados em condicionais de hooks e componentes. | `FiltroStrategy` separa critérios de aplicação. Mais tarde, a Fase 6 aplicou Strategy para sanitização e validação contextual. | 6 suítes, 78 testes no marco dos filtros. |
| 4 — Observer | Hooks mantinham canais Realtime e lógica de alerta e atualização. | `NotificacaoSubject` centraliza a notificação e separa atualização de estado, avisos e contadores. A Fase 6-A adaptou os canais ao esquema normalizado. | 7 suítes, 89 testes. Validação posterior no Supabase de teste. |
| 5 — Singleton e Protection Proxy | O cliente compartilhado e as barreiras de acesso já existiam, mas seus papéis não estavam explicitados no catálogo. | ADR-007 e PlantUML documentam o cliente Supabase no módulo e as barreiras de sessão e papel na SPA. A RLS protege os dados no banco. | 7 suítes, 89 testes. Entrega da fase concentrada na documentação e no UML. |
| 6-A — Acesso a dados | Hooks e componentes consultavam o esquema anterior e os fluxos de anexos dependiam de URLs. | Cliente tipado, mapeadores, seis repositórios, facades, RLS e identificadores de Storage preservam o contrato da interface sobre a base normalizada. | 13 suítes, 113 testes no marco. A validação integrada veio no 9-B. |
| 6 — Validação | Os testes isolados ainda precisavam de evidência para papéis, persistência, anexos e regras do banco. | Testing Library, Playwright, Supabase no Docker, SQL reversível e revisão de entradas. A migração 10 delimita os campos de avaliação docente. | 19 suítes, 144 testes; 16/16 casos SQL; reenvio e avaliação confirmados na SPA e no banco. O ensaio do provedor de e-mail confirma etapa distinta da entrega pela aplicação publicada. |
| 7 — Apresentação | Evidências distribuídas em código, ADRs, diagramas e relatórios. | Aba Informações com catálogo antes/depois, técnicas, cobertura e roadmap. Documento, slides e roteiro usam a jornada de entrega como estudo de caso. | 7 páginas de texto, 12 slides e roteiro de 17 min 30 s. Submissão e limpeza final no handoff. |

## Conformidade dos artefatos

- **Enunciado.** A DCC061 exige documento-texto sobre dois temas, código-fonte e apresentação em PDF com parte teórica e prática. O tempo previsto é de 15 a 20 minutos. [Enunciado](../../.docs/DCC061_Trabalho.md)
- **Documento-texto.** Páginas 3–5 cobrem definição, histórico, importância, ferramentas, referências normativas, profissões, certificações e IA. As páginas 6–7 mostram a aplicação e as evidências. O histórico de testes é breve. A lacuna principal é a rastreabilidade do antes/depois ao longo das fases. Incluir um quadro compacto como o desta revisão e referenciar dois trechos reais de código e seus testes, por exemplo `GeminiAdapter` e `EntregaAtividadeFacade`.
- **Slides.** O 2 apresenta o problema, 4–6 explicam os padrões, 7 apresenta a estratégia de testes, 8–9 mostram a integração e 10 apresenta métricas com recorte. O slide 3 chama a segunda coluna de “Problema no NexusClass”, mas descreve principalmente a solução. Recomenda-se mudar para “Aplicação no NexusClass” e mostrar a evolução de 3 para 144 testes no slide 10. No slide 6 cabe uma frase de antes/depois para Strategy e Observer. O catálogo completo por fase cabe melhor no documento ou na aba.
- **Roteiro.** O tempo total e a numeração correspondem aos 12 slides. Há plano alternativo se a demonstração ao vivo falhar. Acrescentar uma fala curta diferenciando os conceitos dos dois temas, a base de três testes e os marcos Fase 6-A/9-B. Preparar uma referência rápida ao código e ao teste da Facade.
- **Aba Informações.** Já tem antes/depois por padrão, matriz por risco, histórico de métricas e evidências. Ajustados o recorte da cobertura no cartão, a linha de base, o 9-B concluído localmente e a Fase 7 no roadmap. Cartões acomodam os rótulos em telas estreitas. O texto de publicação fica explícito no roadmap.

## Ponto de retomada e escopo

**Validação desta revisão.** TypeScript aprovou `tsc -b --noEmit` e o Vitest passou em 19 suítes e 144 testes. A aba Informações foi renderizada em página isolada no Edge a 390 e 1280 px. As nove etapas foram exibidas, com a Fase 7 presente e o roadmap dentro da largura. O teste isolado não dependeu de autenticação ou de serviços externos.

Na primeira revisão, os PDFs permaneceram como fornecidos. Na rodada seguinte, Gabriel Lineker (`GabrielLineker`) incorporou o comparativo das fases ao documento, acrescentou aos slides comparativos de trechos reais do Git para Adapter e Facade e ampliou o roteiro com arquitetura, guia de código e perguntas de defesa. As versões finais têm dez páginas de documento, 14 slides e seis páginas de roteiro, com apresentação prevista de 18 minutos. Gabriel guardou os PDFs fora do repositório. As decisões de submissão e publicação seguem no [plano de fechamento](../../.agents/PLANO_FECHAMENTO_GIANLUCCA.md).
