import {
  Blocks,
  BugPlay,
  CheckCircle2,
  Code2,
  Cpu,
  FileCheck2,
  FlaskConical,
  GitBranch,
  Layers,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";
import type {
  BadgeItem,
  CamadaTesteItem,
  CardItem,
  FaseRoadmapItem,
  MetricaProjeto,
  PadraoCatalogoItem,
  SnapshotCoberturaItem,
} from "./type";

/**
 * ARQUIVO VIVO DE APRESENTAÇÃO — ENGENHARIA DE SOFTWARE (DCC061)
 * Deve ser atualizado ao final de cada Fase (junto com .docs/DOCUMENTACAO_APRESENTACAO.md)
 * registrando o autor da modificação, métricas de cobertura e status do padrão/teste.
 */

export const ultimaAtualizacaoEngenharia = {
  faseAtual: "Fase 6 em andamento · Componentes, Playwright e Passo 9-B",
  ultimoAutor: "Gianlucca Paiva (GianluccaPaiva)",
  data: "2026-11-17",
  branch: "DesiningTeste",
};

export const metricasEngenharia: MetricaProjeto[] = [
  {
    valor: "100%",
    rotulo: "linhas/funções (98% Stmts) em src/lib e src/patterns (era 4.27%)",
  },
  {
    valor: "113",
    rotulo: "testes passando em 13 suítes (eram 3)",
  },
  {
    valor: "7 + 1",
    rotulo: "padrões GoF + Repository (ADR-009) modelados em UML",
  },
  {
    valor: "Fase 6-A",
    rotulo: "concluída (acesso tipado ao esquema normalizado + RLS)",
  },
];

export const ferramentasEngenharia: BadgeItem[] = [
  {
    nome: "Vitest 5",
    icone: FlaskConical,
    cor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    nome: "Coverage V8",
    icone: FileCheck2,
    cor: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    nome: "Testing Library",
    icone: BugPlay,
    cor: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  {
    nome: "Playwright E2E",
    icone: Cpu,
    cor: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    nome: "GoF Patterns",
    icone: Blocks,
    cor: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    nome: "TypeScript Strict",
    icone: Code2,
    cor: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
  {
    nome: "Fake Timers & Mocks",
    icone: Wrench,
    cor: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    nome: "Git Handoff Dupla",
    icone: GitBranch,
    cor: "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20",
  },
];

export const pilaresEngenharia: CardItem[] = [
  {
    titulo: "Refatoração Guiada por Problemas Reais",
    descricao:
      "Cada padrão de projeto GoF foi selecionado exclusivamente onde havia dor real de acoplamento, repetição de condicionais ou dificuldade de teste no código do NexusClass.",
    icone: Blocks,
  },
  {
    titulo: "Combate ao Overengineering",
    descricao:
      "Padrões que forçariam herança artificial (como Template Method em formulários distintos) foram analisados e descartados documentadamente (ADR-001).",
    icone: ShieldAlert,
  },
  {
    titulo: "Pirâmide de Testes Baseada em Risco (RBT)",
    descricao:
      "Foco em lógica pura (Nível 2) e fronteiras externas críticas como Supabase e Gemini SDK (Nível 3), evitando testes frágeis de UI estática (Nível 1).",
    icone: FlaskConical,
  },
  {
    titulo: "Preservação de Comportamento",
    descricao:
      "Nenhuma funcionalidade visível ao aluno ou professor é quebrada: a suíte Vitest e o compilador TypeScript validam a não-regressão a cada fase.",
    icone: CheckCircle2,
  },
];

export const catalogoPadroes: PadraoCatalogoItem[] = [
  {
    id: "adapter",
    nome: "1. Adapter (Wrapper)",
    categoria: "Estrutural",
    fase: "Fase 1",
    status: "Concluído",
    responsavel: "Gianlucca Paiva (GianluccaPaiva)",
    ondeAplicado:
      "src/patterns/adapter/GeminiAdapter.ts + src/hooks/botsHooks/useChatBot.ts",
    problemaAntes:
      "O hook useChatBot instanciava diretamente new GoogleGenerativeAI(__API_GEMINI_KEY__), misturando estado React, retry de erro 503 e Function Calling da biblioteca externa. Impossível testar o hook sem rede.",
    solucaoDepois:
      "Criação da interface de domínio IAssistenteIA e da classe GeminiAdapter encapsulando o SDK do Google, o loop de Function Calling (4 tools) e o backoff exponencial 503. O hook depende apenas do contrato abstrato.",
    codigoAntes: `// Antes: acoplamento direto no hook React (useChatBot.ts)
const genAI = new GoogleGenerativeAI(__API_GEMINI_KEY__);
const model = genAI.getGenerativeModel({ model: ConfigBot.model, systemInstruction, tools });
const result = await chatRef.current!.sendMessage(content);`,
    codigoDepois: `// Depois: contrato desacoplado e injetável (GeminiAdapter.ts)
export interface IAssistenteIA {
  enviarMensagem(texto: string): Promise<string>;
}
const botText = await assistenteRef.current.enviarMensagem(input);`,
    beneficioQualidade:
      "Desacopla o fornecedor de IA: permite testar useGeminiChat com FakeAssistenteIA e validar retry 503 + Function Calling em milissegundos com vi.useFakeTimers().",
  },
  {
    id: "factory",
    nome: "2. Factory Method / Simple Factory",
    categoria: "Criacional",
    fase: "Fase 1",
    status: "Concluído",
    responsavel: "Gianlucca Paiva (GianluccaPaiva)",
    ondeAplicado:
      "src/patterns/factory/BotFactory.ts + src/hooks/botsHooks/useChatBot.ts",
    problemaAntes:
      "A aplicação possui dois assistentes distintos (Tigreso para dúvidas acadêmicas com Function Calling e Falcão Peregrino para suporte/termos), montados por condicionais extensas dentro do hook.",
    solucaoDepois:
      "Centralização da criação em BotFactory.criarConfig() e BotFactory.criarAssistente(tipoBot, contexto), entregando o GeminiAdapter configurado com prompt de sistema, ferramentas e identidade corretos.",
    codigoAntes: `// Antes: ternário gigante em useChatBot.ts
const instructionJson: JsonInstruction = isHelpMode
  ? { assistant: { name: ConfigBot.nome[1], ... } }
  : { assistant: { name: ConfigBot.nome[0], ... } };`,
    codigoDepois: `// Depois: fábrica determinística e testável (BotFactory.ts)
const tipoBot = BotFactory.resolverTipoBot(isHelpMode);
assistenteRef.current = BotFactory.criarAssistente(tipoBot, contexto);`,
    beneficioQualidade:
      "Aplica o Princípio Aberto-Fechado (OCP) e permite testar unitariamente (Nível 2 RBT) todas as regras de geração de prompt por papel (aluno, professor, master).",
  },
  {
    id: "facade",
    nome: "3. Facade (Fachada)",
    categoria: "Estrutural",
    fase: "Fase 2",
    status: "Concluído",
    responsavel: "Gabriel Lineker (GabrielLineker)",
    ondeAplicado:
      "src/patterns/facade/EntregaAtividadeFacade.ts + AnexoStorageFacade.ts + src/hooks/EntregasHooks/useEntregas.ts",
    problemaAntes:
      "Submeter, listar, avaliar e baixar uma atividade exigia coordenar Storage e SQL diretamente nos hooks, além de duplicar lógica de upload + URL pública em 4 pontos.",
    solucaoDepois:
      "EntregaAtividadeFacade e AnexoStorageFacade (1FN genérica) ocultam Storage privado (createSignedUrls + v_storage_objetos), id_objeto_storage, compensação em falha de INSERT e ordem segura no reenvio.",
    codigoAntes: `// Antes: hook conhece detalhes de Storage + SQL legado
await supabase.storage.from("entregas_atividades").upload(caminho, file, { upsert: true });
await supabase.from("entregas_atividades").upsert({ ... }, { onConflict: "atividade_id,aluno_id" });`,
    codigoDepois: `// Depois: Facade 1FN com ordem segura Storage <-> FK CASCADE
await facade.submeter({
  atividadeId,
  alunoId: perfil.id,
  arquivo: file,
});`,
    beneficioQualidade:
      "Reduz o acoplamento entre a UI/Hook e o par Storage+PostgreSQL, elimina usos de 'any' e permite testar upload, reenvio, avaliação e falhas parciais sem rede.",
  },
  {
    id: "strategy",
    nome: "4. Strategy (Estratégia)",
    categoria: "Comportamental",
    fase: "Fase 3",
    status: "Concluído",
    responsavel: "Gianlucca Paiva (GianluccaPaiva)",
    ondeAplicado:
      "src/patterns/strategy/FiltroStrategy.ts + usePesquisa.ts, Pesquisar.tsx, useDuvidas.ts, DuvidasBox.tsx e AppSidebar.tsx",
    problemaAntes:
      "Os filtros de turmas (Inscritas, Disponíveis, Todas + termo de busca) e da Central de Dúvidas (papel + Todos, Pendente, Resolvida) estavam fragmentados e duplicados em condicionais dentro dos componentes visuais.",
    solucaoDepois:
      "Contrato genérico FiltroStrategy<T, Contexto> com estratégias concretas puras e composições declarativas para turmas (filtrarEOrdenarTurmas) e dúvidas (filtrarDuvidasPorPerfilEStatus).",
    codigoAntes: `// Antes: condicionais espalhadas e duplicadas em Pesquisar.tsx / DuvidasBox.tsx
const turmasParaExibir = turmasBase.filter(([key]) => {
  if (isProfessor && !inscrito) return false;
  if (isAluno && abaAtiva === "minhas" && !inscrito) return false;
  if (isAluno && abaAtiva === "disponiveis" && inscrito) return false;
  return true;
});`,
    codigoDepois: `// Depois: estratégias puras selecionadas por papel/aba e compostas sem if/else na UI
export interface FiltroStrategy<T, Contexto = void> {
  filtrar(itens: readonly T[], contexto: Contexto): T[];
}
const estrategia = obterEstrategiaFiltroTurma(abaAtiva, role);
const filtradas = estrategia.filtrar(base, { estaInscrito });`,
    beneficioQualidade:
      "Transforma regras de filtragem em classes/funções puras de Nível 2 RBT, elimina duplicação entre DuvidasBox e AppSidebar e atinge 100% de cobertura unitária.",
  },
  {
    id: "observer",
    nome: "5. Observer (Pub/Sub)",
    categoria: "Comportamental",
    fase: "Fase 4",
    status: "Concluído",
    responsavel: "Gabriel Lineker (GabrielLineker)",
    ondeAplicado:
      "src/patterns/observer/NotificacaoSubject.ts + useMural.ts, useGerenciador.ts e useMensagens.ts",
    problemaAntes:
      "Cinco canais Realtime dispersos (mural_posts, atividades, entregas_atividades, alertas_calendario, mensagens) acoplavam WebSocket, regras de autoria/deduplicação e chamadas diretas de toast/estado.",
    solucaoDepois:
      "NotificacaoSubject centraliza a publicação de EventoNotificacaoRealtime e notifica Observers especializados (ToastNotificacaoObserver, StateRefreshObserver e BadgeCounterObserver) conectados por adaptadores de canal com cleanup seguro.",
    codigoAntes: `// Antes: canal acoplado diretamente ao efeito visual e deduplicação inline
supabase.channel("realtime:mural_post").on("postgres_changes", ..., (payload) => {
  if (payload.new.id_autor !== perfil.id) {
    toast("O mural foi atualizado!", { action: { label: "Carregar", onClick: carregarPosts } });
  }
}).subscribe();`,
    codigoDepois: `// Depois: Subject + Observers desacoplados e testáveis sem WebSocket ativo
const cancelarToast = muralSubject.inscrever(
  new ToastNotificacaoObserver({ usuarioIdAtual: perfil.id, toastFn: toast, aoCarregarPosts })
);
const desconectar = conectarCanaisMuralRealtime(supabase, muralSubject, { turmaId, alunoId: perfil.id });`,
    beneficioQualidade:
      "Desacopla a origem Realtime dos efeitos visuais/estado: permite testar broadcast 1-para-N, deduplicação de alertas e reconciliação de mensagens em 44ms com 100% de cobertura.",
  },
  {
    id: "singleton-proxy",
    nome: "6 & 7. Singleton e Proxy (Documentados)",
    categoria: "Estrutural",
    fase: "Fase 5",
    status: "Concluído",
    responsavel: "Gianlucca Paiva (GianluccaPaiva)",
    ondeAplicado:
      "src/lib/supabaseClient.ts (Singleton tipado) + permissoes.ts / ProtectedRoute.tsx / BoxRestrito.tsx (Protection Proxy) + out/diagramas/diagrama_classes_detalhado.puml",
    problemaAntes:
      "Criar classes extras para Singleton ou Proxy quando o código já os implementa idiomaticamente em ES Modules e React Router seria duplicação desnecessária (overengineering).",
    solucaoDepois:
      "Catalogação formal em src/patterns/, tipagem estática createClient<Database> e Protection Proxy puro em permissoes.ts espelhando as RLS de 04_supabase_auth_rls.sql.",
    codigoAntes: `// Já existente no projeto (Singleton via ES Module cache)
export const hasSupabaseConfig = Boolean(__URL_SUPABASE__ && __KEY_SUPABASE__);
export const supabase = createClient<Database>(__URL_SUPABASE__, __KEY_SUPABASE__);`,
    codigoDepois: `// Protection Proxy em permissoes.ts + ProtectedRoute.tsx
pode.inscreverEmTurma(perfil, turma); // aluno && mesma id_escola (RN12)
if (!session) return <Navigate to="/login" replace />;`,
    beneficioQualidade:
      "Demonstra maturidade de engenharia: reconhecer padrões nativos já presentes na arquitetura sem inflar o código e manter o diagrama UML sincronizado.",
  },
  {
    id: "repository-mapper",
    nome: "8. Repository + Data Mapper (ADR-009)",
    categoria: "Estrutural",
    fase: "Fase 6-A",
    status: "Concluído",
    responsavel: "Gianlucca Paiva (GianluccaPaiva)",
    ondeAplicado:
      "src/repositories/*Repository.ts + src/lib/db/mappers.ts + src/lib/database.types.ts",
    problemaAntes:
      "85 chamadas .from()/.storage soltas em 19 arquivos acoplavam hooks ao esquema legado sem tipagem estática, impedindo o TypeScript de detectar renomeações de tabelas/colunas.",
    solucaoDepois:
      "6 Repositories por agregado com cliente injetável (Perfil, EscolaTurma, Atividade, Duvida, Mural, Comunicacao) + Data Mappers puros convertendo Row -> Domínio e SERIAL -> string.",
    codigoAntes: `// Antes: consulta direta acoplada no hook sem tipo
const { data } = await supabase.from("turmas_escolares").select("*");`,
    codigoDepois: `// Depois: hook consome contrato do Repository + mappers tipados
const dados = await escolaTurmaRepository.carregarDadosEscola(
  perfil.id_escola,
  perfil.role,
);`,
    beneficioQualidade:
      "Zero erros tsc em toda a SPA, isolamento da borda de persistência para testes unitários sem rede e blindagem de UI contra mudanças de schema.",
  },
  {
    id: "template-method-descartado",
    nome: "Anti-Decisão: Template Method (Descartado)",
    categoria: "Anti-Decisão (Overengineering)",
    fase: "Análise Crítica",
    status: "Descartado",
    responsavel: "Gabriel Lineker (GabrielLineker)",
    ondeAplicado:
      "Descartado para formulários (Mural vs. Atividades vs. Dúvidas)",
    problemaAntes:
      "Cogitou-se criar uma classe abstrata FormularioBase com Template Method para todos os envios do sistema.",
    solucaoDepois:
      "Após inspeção cirúrgica do código, verificou-se que os formulários possuem fluxos muito distintos (anexos múltiplos, prazos, destinatários). Forçar herança violaria a simplicidade.",
    codigoAntes: `// Anti-padrão evitado: herança forçada entre domínios diferentes
abstract class SubmissaoTemplate {
  abstract validar(): boolean;
  abstract enviarBanco(): Promise<void>;
}`,
    codigoDepois: `// Decisão: manter hooks coesos por domínio e usar Facade
// apenas onde há subsistema real complexo (Entrega de Atividade).`,
    beneficioQualidade:
      "Evita acoplamento por herança (preferindo composição) e comprova senso crítico no uso de Design Patterns.",
  },
];

export const roadmapFases: FaseRoadmapItem[] = [
  {
    fase: "Fase 0",
    titulo: "Base de Testes Unitários (utils.ts) + Ambiente Vitest + Slides DCC061",
    status: "Concluído",
    responsavel: "Gabriel Lineker (GabrielLineker)",
    entregas:
      "Stubs seguros em setupTests.ts, 26 novos testes cobrindo 100% de src/lib/utils.ts (incluindo getBadgeStatusStyle) e src/lib/assetPath.ts, e seletor de apresentação DCC061 na aba Informações.",
    evidenciaTeste: "2 suítes / 29 testes passando · src/lib: 98.36% Stmts / 100% Funcs (utils.ts 100%)",
  },
  {
    fase: "Fase 1",
    titulo: "Padrões Adapter + Factory (Assistentes IA: Tigreso & Falcão)",
    status: "Concluído",
    responsavel: "Gianlucca Paiva (GianluccaPaiva)",
    entregas:
      "IAssistenteIA, GeminiAdapter e BotFactory em src/patterns/, desacoplando useChatBot.ts do SDK externo e cobrindo Function Calling + retry 503.",
    evidenciaTeste:
      "4 suítes / 51 testes passando · GeminiAdapter.ts e BotFactory.ts com 100% de cobertura",
  },
  {
    fase: "Fase 2",
    titulo: "Padrão Facade (Subsistema de Entrega de Atividades)",
    status: "Concluído",
    responsavel: "Gabriel Lineker (GabrielLineker)",
    entregas:
      "EntregaAtividadeFacade unificando higienização de arquivo, Supabase Storage (upload + createSignedUrl) e PostgreSQL (UPSERT em entregas_atividades, listagem por papel e avaliação docente).",
    evidenciaTeste:
      "5 suítes / 66 testes passando · EntregaAtividadeFacade.ts com 100% de cobertura",
  },
  {
    fase: "Fase 3",
    titulo: "Padrão Strategy (Filtros de Pesquisa de Turmas e Dúvidas)",
    status: "Concluído",
    responsavel: "Gianlucca Paiva (GianluccaPaiva)",
    entregas:
      "FiltroStrategy<T, Contexto> e estratégias concretas em src/patterns/strategy/FiltroStrategy.ts, desacoplando e unificando filtros em usePesquisa, Pesquisar, useDuvidas, DuvidasBox e AppSidebar.",
    evidenciaTeste:
      "6 suítes / 78 testes passando · FiltroStrategy.ts com 100% de cobertura",
  },
  {
    fase: "Fase 4",
    titulo: "Padrão Observer (Centralização de Notificações Realtime)",
    status: "Concluído",
    responsavel: "Gabriel Lineker (GabrielLineker)",
    entregas:
      "NotificacaoSubject, ToastNotificacaoObserver, StateRefreshObserver, BadgeCounterObserver e conectores Realtime em src/patterns/observer/NotificacaoSubject.ts, desacoplando os 5 canais em useMural, useGerenciador e useMensagens.",
    evidenciaTeste:
      "7 suítes / 89 testes passando · NotificacaoSubject.ts com 100% de cobertura",
  },
  {
    fase: "Fase 5",
    titulo: "Documentação Singleton & Proxy + Diagrama de Classes UML",
    status: "Concluído",
    responsavel: "Gianlucca Paiva (GianluccaPaiva)",
    entregas:
      "Catalogação formal de supabaseClient.ts (Singleton ES Module) e ProtectedRoute/BoxRestrito (Protection Proxy) em src/patterns/ + atualização de diagrama_classes_detalhado.puml com os 7 estereótipos GoF.",
    evidenciaTeste:
      "ADR-007 + Diagrama PlantUML atualizado + supabaseClient.ts com 100% de cobertura (7 suítes / 89 testes)",
  },
  {
    fase: "Fase 6-A",
    titulo: "Remodelagem de Acesso ao Banco + Repositories + Anexos 1FN (ADR-009)",
    status: "Concluído",
    responsavel: "Gianlucca Paiva (GianluccaPaiva)",
    entregas:
      "05_supabase_funcoes_realtime.sql, database.types.ts, mappers.ts, permissoes.ts, AnexoStorageFacade, 6 Repositories, migração dos hooks/Observer/Edge Function e 6 novas suítes (RLS reais ao final em 9-B).",
    evidenciaTeste:
      "13 suítes / 113 testes confirmados em 19/11 por Gabriel Lineker · 98% instruções / 92,87% ramificações / 100% funções e linhas em src/lib + src/patterns · Supabase ao vivo pendente",
  },
  {
    fase: "Fase 6",
    titulo: "Testes de Componente + E2E (Playwright) + RLS reais (Passo 9-B)",
    status: "Em Andamento",
    responsavel: "Gabriel Lineker",
    entregas:
      "Testes de ProtectedRoute/BoxRestrito, fluxo E2E crítico (login → entrega), suíte de integração RLS no Supabase e consolidação final.",
    evidenciaTeste: "Jornadas de entrega e avaliação, chat Realtime, dúvidas, suporte e calendário verificados. A denúncia passou no Edge. O cadastro público e o ciclo de matrícula passaram pela API do Supabase de teste.",
  },
];

export const matrizTestesRbt: CamadaTesteItem[] = [
  {
    nivelRbt: "Nível 1 — Visual / UI Estática",
    camada: "Estilos Tailwind, textos fixos, ícones",
    ferramenta: "TypeScript (tsc -b --noEmit)",
    alvos: "Componentes puramente visuais e slides",
    tecnicas: "Tipagem estática estrita (sem testes de snapshot frágeis)",
    status: "Concluído",
  },
  {
    nivelRbt: "Nível 2 — Lógica Pura (Determinística)",
    camada: "Testes Unitários Puros (Zero I/O)",
    ferramenta: "Vitest + Fake Timers",
    alvos: "src/lib/utils.ts (25 funções), BotFactory (Fase 1 - Concluído), EntregaAtividadeFacade estáticos (Fase 2 - Concluído), FiltroStrategy (Fase 3 - Concluído) e helpers puros de NotificacaoSubject (Fase 4 - Concluído)",
    tecnicas:
      "Padrão AAA, Particionamento de Equivalência, Análise de Valor Limite, Tabela de Decisão e vi.useFakeTimers()",
    status: "Concluído",
  },
  {
    nivelRbt: "Nível 3 — Fronteira / Integração",
    camada: "Testes com Fakes/Mocks na Borda",
    ferramenta: "Vitest + Testing Library",
    alvos: "GeminiAdapter + useGeminiChat (Fase 1 - Concluído), EntregaAtividadeFacade + useEntregas (Fase 2 - Concluído), NotificacaoSubject + 5 canais Realtime (Fase 4 - Concluído), ProtectedRoute (Fase 6)",
    tecnicas:
      "Injeção de dependência, Fakes em memória e Mocks restritos à fronteira externa (SDK Gemini / Supabase)",
    status: "Em Andamento",
  },
  {
    nivelRbt: "Nível 3 — Fluxo Crítico Ponta a Ponta",
    camada: "Teste End-to-End (E2E)",
    ferramenta: "Playwright",
    alvos: "Jornada crítica: Login → Acessar Turma → Submeter Atividade (Fase 6)",
    tecnicas: "Automação de navegador real em ambiente isolado de teste",
    status: "Planejado",
  },
];

export const evolucaoCobertura: SnapshotCoberturaItem[] = [
  {
    etapa: "Baseline Inicial (Antes da Fase 0)",
    responsavel: "Gabriel Lineker",
    testes: "1 suíte (3 testes)",
    statements: "4.27%",
    branches: "0.00%",
    functions: "4.00%",
    lines: "4.42%",
  },
  {
    etapa: "Pós-Fase 0 (Suíte utils.spec.ts)",
    responsavel: "Gabriel Lineker",
    testes: "2 suítes (29 testes)",
    statements: "98.36% (100% em utils.ts)",
    branches: "96.15% (100% em utils.ts)",
    functions: "100.00%",
    lines: "98.30% (100% em utils.ts)",
  },
  {
    etapa: "Pós-Fase 1 (Adapter + Factory)",
    responsavel: "Gianlucca Paiva",
    testes: "4 suítes (51 testes)",
    statements: "100.00% (lib + patterns)",
    branches: "100.00% (lib + patterns)",
    functions: "100.00% (lib + patterns)",
    lines: "100.00% (lib + patterns)",
  },
  {
    etapa: "Pós-Fase 2 (Facade de Entregas)",
    responsavel: "Gabriel Lineker",
    testes: "5 suítes (66 testes)",
    statements: "100.00% (lib + patterns)",
    branches: "100.00% (lib + patterns)",
    functions: "100.00% (lib + patterns)",
    lines: "100.00% (lib + patterns)",
  },
  {
    etapa: "Pós-Fase 3 (Strategy de Filtros)",
    responsavel: "Gianlucca Paiva",
    testes: "6 suítes (78 testes)",
    statements: "100.00% (lib + patterns)",
    branches: "100.00% (lib + patterns)",
    functions: "100.00% (lib + patterns)",
    lines: "100.00% (lib + patterns)",
  },
  {
    etapa: "Pós-Fase 4 (Observer Realtime)",
    responsavel: "Gabriel Lineker",
    testes: "7 suítes (89 testes)",
    statements: "100.00% (lib + patterns)",
    branches: "100.00% (lib + patterns)",
    functions: "100.00% (lib + patterns)",
    lines: "100.00% (lib + patterns)",
  },
  {
    etapa: "Pós-Fase 5 (Singleton/Proxy + Diagrama UML)",
    responsavel: "Gianlucca Paiva",
    testes: "7 suítes (89 testes)",
    statements: "100.00% (lib + patterns)",
    branches: "100.00% (lib + patterns)",
    functions: "100.00% (lib + patterns)",
    lines: "100.00% (lib + patterns)",
  },
  {
    etapa: "Pós-Fase 6-A (Esquema Normalizado + Repositories)",
    responsavel: "Gianlucca Paiva",
    testes: "13 suítes (113 testes)",
    statements: "98.00% (lib + patterns)",
    branches: "92.87% (lib + patterns)",
    functions: "100.00% (lib + patterns)",
    lines: "100.00% (lib + patterns)",
    destaque: true,
  },
  {
    etapa: "Fase 6 em andamento (20/11)",
    responsavel: "Gabriel Lineker",
    testes: "16 suítes (125 testes)",
    statements: "98% (lib + patterns)",
    branches: "92,9% (lib + patterns)",
    functions: "100% (lib + patterns)",
    lines: "100% (lib + patterns)",
  },
];

export const destaquesFaseZero = [
  {
    titulo: "Determinismo Temporal (Fake Timers)",
    detalhe:
      "Funções como isDataEntregaFutura, comparaDataHj e formatarDataRelativa (Fase 0), backoff 503 do GeminiAdapter (Fase 1) e timestamps da EntregaAtividadeFacade (Fase 2) foram testados congelando o relógio (vi.useFakeTimers), sem flaky tests.",
    icone: Sparkles,
  },
  {
    titulo: "Análise de Valor Limite (Boundary Value)",
    detalhe:
      "Validação exata nas fronteiras de prazo de entrega (ontem 23:59:59 = expirado, instante exato = expirado, amanhã = válido) e no limite máximo de retries (MAX_RETRIES = 2).",
    icone: Layers,
  },
  {
    titulo: "Resiliência e Desacoplamento (Adapter, Factory, Facade & Observer)",
    detalhe:
      "Injeção de FakeAssistenteIA, FakeEntregaFacade e ClienteRealtimeFake nos módulos, simulando Function Calling, Storage + PostgreSQL e WebSocket Realtime sem gastar franquia de API nem depender de rede.",
    icone: ShieldAlert,
  },
];
