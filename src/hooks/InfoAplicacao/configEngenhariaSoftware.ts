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
  faseAtual: "Fase 0 Concluída → Próxima: Fase 1 (Adapter + Factory)",
  ultimoAutor: "Gabriel Lineker (GabrielLineker)",
  data: "2026-10-24",
  branch: "DesiningTeste",
};

export const metricasEngenharia: MetricaProjeto[] = [
  {
    valor: "98.36%",
    rotulo: "cobertura em src/lib (era 4.27%)",
  },
  {
    valor: "29",
    rotulo: "testes automatizados passando (eram 3)",
  },
  {
    valor: "7",
    rotulo: "Design Patterns GoF catalogados",
  },
  {
    valor: "Fase 0",
    rotulo: "concluída (Fases 1 a 6 estruturadas)",
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
    status: "Planejado",
    responsavel: "A definir (Gabriel / Gianlucca)",
    ondeAplicado:
      "src/patterns/adapter/ + src/hooks/botsHooks/useChatBot.ts",
    problemaAntes:
      "O hook useChatBot instancia diretamente new GoogleGenerativeAI(__API_GEMINI_KEY__), misturando estado React, retry de erro 503 e Function Calling da biblioteca externa. Impossível testar o hook sem rede.",
    solucaoDepois:
      "Criação da interface de domínio IAssistenteIA e da classe GeminiAdapter encapsulando o SDK do Google. O hook passa a depender apenas do contrato abstrato.",
    codigoAntes: `// Antes: acoplamento direto no hook React
const genAI = new GoogleGenerativeAI(__API_GEMINI_KEY__);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const result = await chat.sendMessage(msg);`,
    codigoDepois: `// Depois: contrato desacoplado e injetável
export interface IAssistenteIA {
  enviarMensagem(historico: Msg[], texto: string): Promise<string>;
}
// Em testes: injeta FakeAssistenteIA sem gastar API`,
    beneficioQualidade:
      "Desacopla o fornecedor de IA (permite trocar Gemini ou simular erro 503 em milissegundos nos testes automatizados).",
  },
  {
    id: "factory",
    nome: "2. Factory Method / Simple Factory",
    categoria: "Criacional",
    fase: "Fase 1",
    status: "Planejado",
    responsavel: "A definir (Gabriel / Gianlucca)",
    ondeAplicado:
      "src/patterns/factory/ + src/hooks/botsHooks/configBot.ts",
    problemaAntes:
      "A aplicação possui dois assistentes distintos (Tigreso para dúvidas acadêmicas com Function Calling e Falcão Peregrino para suporte/termos), configurados manualmente por condicionais.",
    solucaoDepois:
      "Centralização da criação em BotFactory.create(tipoBot), retornando o adaptador configurado com prompt de sistema, ferramentas e identidade visual corretos.",
    codigoAntes: `// Antes: seleção manual espalhada
const config = tipo === "tigreso" ? configTigreso : configFalcao;
// Inicialização duplicada de modelo e tools`,
    codigoDepois: `// Depois: fábrica determinística e testável
const assistente = BotFactory.create(tipoBot);
// Teste unitário puro valida que cada tipo gera a config certa`,
    beneficioQualidade:
      "Aplica o Princípio Aberto-Fechado (OCP): adicionar um novo bot tutor não exige alterar o hook principal.",
  },
  {
    id: "facade",
    nome: "3. Facade (Fachada)",
    categoria: "Estrutural",
    fase: "Fase 2",
    status: "Planejado",
    responsavel: "A definir (Gabriel / Gianlucca)",
    ondeAplicado:
      "src/patterns/facade/ + src/hooks/AtividadesHooks/useEntregas.ts",
    problemaAntes:
      "Submeter uma atividade exige múltiplos passos coordenados: higienizar nome do arquivo, upload no bucket entregas_atividades/{atividade}/{aluno}/{arq}, obter URL pública e fazer UPSERT na tabela entregas.",
    solucaoDepois:
      "EntregaAtividadeFacade.submeter() expõe um único método de alto nível para o componente BoxEntregaAtividade, ocultando a orquestração entre Storage e Postgres.",
    codigoAntes: `// Antes: hook/componente conhece detalhes de Storage + SQL
await supabase.storage.from("entregas_atividades").upload(path, file);
const { data } = supabase.storage.from("entregas_atividades").getPublicUrl(path);
await supabase.from("entregas").upsert({ ... });`,
    codigoDepois: `// Depois: fachada única para o subsistema de entrega
const resultado = await entregaFacade.submeter({
  atividadeId, alunoId, arquivos, comentario
});`,
    beneficioQualidade:
      "Reduz o acoplamento entre a UI e o Supabase, permitindo testar toda a regra de negócio de envio/reenvio mockando apenas a borda.",
  },
  {
    id: "strategy",
    nome: "4. Strategy (Estratégia)",
    categoria: "Comportamental",
    fase: "Fase 3",
    status: "Planejado",
    responsavel: "A definir (Gabriel / Gianlucca)",
    ondeAplicado:
      "src/patterns/strategy/ + usePesquisa.ts e useDuvidas.ts",
    problemaAntes:
      "Os filtros de turmas (Inscritas, Disponíveis, Todas + termo de busca) e de dúvidas (Todos, Pendente, Resolvida) usam blocos condicionais acoplados dentro dos hooks.",
    solucaoDepois:
      "Interface FiltroStrategy<T> com estratégias concretas puras e intercambiáveis em tempo de execução conforme a aba selecionada pelo usuário.",
    codigoAntes: `// Antes: condicionais aninhadas no hook
if (filtro === "inscritas") return turmas.filter(...);
else if (filtro === "disponiveis") return turmas.filter(...);`,
    codigoDepois: `// Depois: estratégia pura injetada
export interface FiltroStrategy<T> {
  filtrar(itens: T[], contexto?: FiltroContexto): T[];
}
const filtradas = estrategias[abaAtiva].filtrar(turmas, { busca });`,
    beneficioQualidade:
      "Transforma regras de filtragem em classes/funções puras de Nível 2 RBT, 100% testáveis sem precisar renderizar componentes React.",
  },
  {
    id: "observer",
    nome: "5. Observer (Pub/Sub)",
    categoria: "Comportamental",
    fase: "Fase 4",
    status: "Planejado",
    responsavel: "A definir (Gabriel / Gianlucca)",
    ondeAplicado:
      "src/patterns/observer/ + canais Supabase Realtime",
    problemaAntes:
      "Cinco canais Realtime dispersos (mural, atividades, entregas, mensagens, alertas) disparam toasts e atualizações de estado cada um à sua maneira.",
    solucaoDepois:
      "NotificacaoSubject centraliza os eventos recebidos e notifica múltiplos Observers desacoplados (ToastObserver, BadgeCounterObserver, StateRefreshObserver).",
    codigoAntes: `// Antes: canal acoplado diretamente ao efeito visual
supabase.channel("mural").on("postgres_changes", ..., (payload) => {
  toast.info("Novo post!");
  setNaoLidos((n) => n + 1);
});`,
    codigoDepois: `// Depois: Subject notifica lista de Observers inscritos
notificacaoSubject.notify({ tipo: "NOVO_POST", payload });
// Observers reagem independentemente (toast, badge, som/estado)`,
    beneficioQualidade:
      "Permite testar a reação de múltiplos consumidores a um único evento em tempo real sem depender de WebSocket ativo.",
  },
  {
    id: "singleton-proxy",
    nome: "6 & 7. Singleton e Proxy (Documentados)",
    categoria: "Estrutural",
    fase: "Fase 5",
    status: "Planejado",
    responsavel: "A definir (Gabriel / Gianlucca)",
    ondeAplicado:
      "src/lib/supabaseClient.ts (Singleton) + ProtectedRoute / BoxRestrito (Protection Proxy)",
    problemaAntes:
      "Criar classes extras para Singleton ou Proxy quando o código já os implementa idiomaticamente em ES Modules e React Router seria duplicação desnecessária.",
    solucaoDepois:
      "Catalogação arquitetural formal em src/patterns/singleton e src/patterns/proxy + atualização do diagrama UML com estereótipos <<Singleton>> e <<Proxy>> + testes de rota protegida.",
    codigoAntes: `// Já existente no projeto (Singleton via ES Module cache)
export const supabase = createClient(__URL_SUPABASE__, __KEY_SUPABASE__);`,
    codigoDepois: `// Protection Proxy já existente em ProtectedRoute.tsx
if (!session) return <Navigate to="/login" replace />;
return <Outlet />; // + Testes automatizados de bloqueio/redirecionamento`,
    beneficioQualidade:
      "Demonstra maturidade de engenharia: reconhecer padrões nativos já presentes na arquitetura sem inflar o código.",
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
    status: "Planejado",
    responsavel: "A definir na retomada (Handoff)",
    entregas:
      "IAssistenteIA, GeminiAdapter e BotFactory em src/patterns/, desacoplando useChatBot do SDK externo.",
    evidenciaTeste: "Espaço reservado: testes unitários da Factory + testes do Adapter com SDK mockado",
  },
  {
    fase: "Fase 2",
    titulo: "Padrão Facade (Subsistema de Entrega de Atividades)",
    status: "Planejado",
    responsavel: "A definir na retomada (Handoff)",
    entregas:
      "EntregaAtividadeFacade unificando higienização de arquivo, Supabase Storage e UPSERT em entregas.",
    evidenciaTeste: "Espaço reservado: testes de integração da Facade com mock na borda do Supabase",
  },
  {
    fase: "Fase 3",
    titulo: "Padrão Strategy (Filtros de Pesquisa de Turmas e Dúvidas)",
    status: "Planejado",
    responsavel: "A definir na retomada (Handoff)",
    entregas:
      "Estratégias concretas de filtragem substituindo condicionais em usePesquisa e useDuvidas.",
    evidenciaTeste: "Espaço reservado: testes unitários determinísticos para cada estratégia",
  },
  {
    fase: "Fase 4",
    titulo: "Padrão Observer (Centralização de Notificações Realtime)",
    status: "Planejado",
    responsavel: "A definir na retomada (Handoff)",
    entregas:
      "NotificacaoSubject notificando observers de Toast e Badges a partir de eventos em tempo real.",
    evidenciaTeste: "Espaço reservado: testes unitários de inscrição, desinscrição e disparo do Subject",
  },
  {
    fase: "Fase 5",
    titulo: "Documentação Singleton & Proxy + Diagrama de Classes UML",
    status: "Planejado",
    responsavel: "A definir na retomada (Handoff)",
    entregas:
      "Documentação técnica dos padrões nativos existentes e atualização do diagrama PlantUML com estereótipos.",
    evidenciaTeste: "Espaço reservado: revisão arquitetural e validação de contratos",
  },
  {
    fase: "Fase 6",
    titulo: "Testes de Componente (Testing Library) + E2E (Playwright) + Relatório Final",
    status: "Planejado",
    responsavel: "A definir na retomada (Handoff)",
    entregas:
      "Testes de ProtectedRoute/BoxRestrito, fluxo E2E crítico (login → entrega) e consolidação final de cobertura.",
    evidenciaTeste: "Espaço reservado: suíte completa unitária + integração + componente + E2E",
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
    alvos: "src/lib/utils.ts (24 funções), futuras Strategies (Fase 3) e BotFactory (Fase 1)",
    tecnicas:
      "Padrão AAA, Particionamento de Equivalência, Análise de Valor Limite, Tabela de Decisão e vi.useFakeTimers()",
    status: "Concluído",
  },
  {
    nivelRbt: "Nível 3 — Fronteira / Integração",
    camada: "Testes com Fakes/Mocks na Borda",
    ferramenta: "Vitest + Testing Library",
    alvos: "GeminiAdapter (Fase 1), EntregaAtividadeFacade (Fase 2), NotificacaoSubject (Fase 4), ProtectedRoute (Fase 6)",
    tecnicas:
      "Injeção de dependência, Fakes em memória e Mocks restritos à fronteira externa (SDK Gemini / Supabase)",
    status: "Planejado",
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
    destaque: true,
  },
  {
    etapa: "Pós-Fase 1 (Adapter + Factory)",
    responsavel: "A atualizar na Fase 1",
    testes: "—",
    statements: "—",
    branches: "—",
    functions: "—",
    lines: "—",
  },
  {
    etapa: "Pós-Fase 2 (Facade de Entregas)",
    responsavel: "A atualizar na Fase 2",
    testes: "—",
    statements: "—",
    branches: "—",
    functions: "—",
    lines: "—",
  },
  {
    etapa: "Pós-Fase 3 (Strategy de Filtros)",
    responsavel: "A atualizar na Fase 3",
    testes: "—",
    statements: "—",
    branches: "—",
    functions: "—",
    lines: "—",
  },
  {
    etapa: "Pós-Fase 4 a 6 (Observer + Componentes + Final)",
    responsavel: "A atualizar nas Fases 4–6",
    testes: "—",
    statements: "—",
    branches: "—",
    functions: "—",
    lines: "—",
  },
];

export const destaquesFaseZero = [
  {
    titulo: "Determinismo Temporal (Fake Timers)",
    detalhe:
      "Funções como isDataEntregaFutura, comparaDataHj e formatarDataRelativa foram testadas congelando o relógio do sistema (vi.useFakeTimers), evitando testes instáveis (flaky tests) na virada de meia-noite.",
    icone: Sparkles,
  },
  {
    titulo: "Análise de Valor Limite (Boundary Value)",
    detalhe:
      "Validação exata nas fronteiras de prazo de entrega (ontem 23:59:59 = expirado, instante exato = expirado, amanhã = válido).",
    icone: Layers,
  },
  {
    titulo: "Resiliência e Tolerância a Falhas",
    detalhe:
      "Injeção proposital de JSON corrompido no localStorage e URIs malformadas (%E0%A4%A) para provar que os blocos try/catch retornam fallbacks seguros sem quebrar a tela.",
    icone: ShieldAlert,
  },
];
