import {
  Github,
  ExternalLink,
  Code2,
  Sparkles,
  Layers,
  Database,
  User,
  Zap,
  Cloud,
  Terminal,
  ShieldCheck,
  Users,
  Workflow,
  ClipboardList,
  MonitorSmartphone,
  MessageCircle,
  CalendarDays,
  BookOpenCheck,
  Bell,
  Server,
  Lock,
  CheckCircle2,
  XCircle,
  FileWarning,
  Lightbulb,
  Bot,
  Component,
  MousePointerClick,
  PlugZap,
  RadioTower,
  type LucideIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

type CardItem = {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
};

type BadgeItem = {
  nome: string;
  icone: LucideIcon;
  cor: string;
};

const devs = [
  {
    nome: "Gianlucca Paiva",
    iniciais: "GP",
    cargo: "Full-stack, requisitos e segurança",
    github: "https://github.com/gianluccapaiva",
    corGradiente: "bg-gradient-to-br from-purple-600 to-pink-500",
  },
  {
    nome: "Gabriel Lineker",
    iniciais: "GL",
    cargo: "Full-stack, UI/UX e arquitetura",
    github: "https://github.com/gabriellineker",
    corGradiente: "bg-gradient-to-br from-indigo-600 to-purple-500",
  },
];

const tecnologias: BadgeItem[] = [
  {
    nome: "Vite React",
    icone: Zap,
    cor: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    nome: "TypeScript",
    icone: Code2,
    cor: "text-blue-700 dark:text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    nome: "Tailwind CSS",
    icone: Layers,
    cor: "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20",
  },
  {
    nome: "Supabase",
    icone: Database,
    cor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    nome: "Vercel",
    icone: Cloud,
    cor: "text-neutral-700 dark:text-neutral-400 bg-neutral-500/10 border-neutral-500/20",
  },
  {
    nome: "Gemini AI",
    icone: Sparkles,
    cor: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    nome: "Realtime",
    icone: Bell,
    cor: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    nome: "shadcn/ui",
    icone: Component,
    cor: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
];

const atores: CardItem[] = [
  {
    titulo: "Aluno",
    descricao:
      "Inscreve-se em turmas, acompanha murais, envia atividades, tira dúvidas, usa mensagens, calendário e o Tigreso.",
    icone: User,
  },
  {
    titulo: "Professor",
    descricao:
      "Gerencia turmas, publica avisos, cria atividades, acompanha entregas, atribui notas e responde dúvidas.",
    icone: BookOpenCheck,
  },
  {
    titulo: "Gestão / Master",
    descricao:
      "Tem visão administrativa ampliada para apoiar a organização das turmas e a demonstração do sistema.",
    icone: ShieldCheck,
  },
];

const metricasProjeto = [
  {
    valor: "+300",
    rotulo: "commits no GitHub",
  },
  {
    valor: "+130h",
    rotulo: "estimadas pelo Git",
  },
  {
    valor: "+30",
    rotulo: "dias com atividade",
  },
  {
    valor: "2",
    rotulo: "desenvolvedores",
  },
];

const fluxoProduto = [
  {
    etapa: "Login",
    detalhe: "O Supabase Auth valida a sessão e carrega o perfil.",
  },
  {
    etapa: "Turmas",
    detalhe: "O usuário encontra disciplinas e controla inscrições.",
  },
  {
    etapa: "Interação",
    detalhe:
      "Mural, atividades, dúvidas, chat e calendário concentram o uso diário.",
  },
  {
    etapa: "Persistência",
    detalhe:
      "PostgreSQL, Storage e Realtime mantêm os dados sincronizados.",
  },
];

const implantacaoEtapas = [
  {
    titulo: "Protótipo",
    plataforma: "GitHub Pages",
    detalhe:
      "Publicação inicial da SPA enquanto o projeto ainda era majoritariamente front-end.",
  },
  {
    titulo: "Versão final",
    plataforma: "Vercel",
    detalhe:
      "Build automatizado do Vite, variáveis de ambiente e deploy integrado ao GitHub.",
  },
  {
    titulo: "Backend",
    plataforma: "Supabase",
    detalhe:
      "Auth, PostgreSQL, Storage, Realtime, triggers e Edge Function fora da camada de hospedagem.",
  },
];

const funcionalidadesImplementadas: CardItem[] = [
  {
    titulo: "Autenticação e sessões",
    descricao:
      "Login, cadastro, logout, rotas protegidas e carregamento do perfil autenticado via Supabase Auth.",
    icone: Lock,
  },
  {
    titulo: "Turmas e inscrições",
    descricao:
      "Listagem dinâmica de turmas, pesquisa, entrada em turmas e controle de inscrição por usuário.",
    icone: Users,
  },
  {
    titulo: "Mural e atividades",
    descricao:
      "Avisos por turma, criação de atividades, anexos, entregas de alunos e avaliação com nota e feedback.",
    icone: ClipboardList,
  },
  {
    titulo: "Comunicação",
    descricao:
      "Mensagens privadas em tempo real, dúvidas entre aluno e professor, suporte, denúncias e indicadores visuais.",
    icone: MessageCircle,
  },
  {
    titulo: "Calendário e alertas",
    descricao:
      "Eventos pessoais e de turma, lembretes de compromissos e notificações para o usuário durante o uso.",
    icone: CalendarDays,
  },
  {
    titulo: "Assistente Tigreso",
    descricao:
      "Chatbot integrado ao Gemini que consulta o contexto da plataforma, como eventos, atividades, posts e dúvidas.",
    icone: Bot,
  },
];

const qualidadeUx: CardItem[] = [
  {
    titulo: "Responsividade",
    descricao:
      "Interface adaptada para desktop e mobile, com sidebar responsiva e componentes reutilizáveis.",
    icone: MonitorSmartphone,
  },
  {
    titulo: "Segurança",
    descricao:
      "Acesso protegido por autenticação, RLS no banco e operações sensíveis concentradas no Supabase.",
    icone: ShieldCheck,
  },
  {
    titulo: "Persistência",
    descricao:
      "Dados dinâmicos gravados em PostgreSQL na nuvem, substituindo a dependência de arquivos locais.",
    icone: Database,
  },
  {
    titulo: "Manutenibilidade",
    descricao:
      "TypeScript, separação por componentes e hooks customizados para organizar o estado e as regras de interface.",
    icone: Code2,
  },
  {
    titulo: "Desempenho",
    descricao:
      "SPA com Vite e React, transições internas rápidas e uso de localStorage para estados visuais não críticos.",
    icone: Zap,
  },
  {
    titulo: "Usabilidade",
    descricao:
      "Temas claro/escuro, feedback por toasts, badges de notificação e layout com navegação lateral.",
    icone: MousePointerClick,
  },
];

const conexaoSistema: CardItem[] = [
  {
    titulo: "Frontend SPA",
    descricao:
      "A interface roda no navegador, com React Router, componentes reutilizáveis e troca interna de telas.",
    icone: MonitorSmartphone,
  },
  {
    titulo: "Supabase SDK",
    descricao:
      "O cliente centraliza chamadas de login, consultas, inserts, updates, Storage e Realtime.",
    icone: PlugZap,
  },
  {
    titulo: "Banco PostgreSQL",
    descricao:
      "As entidades principais ficam em tabelas como perfis, turmas, mural, atividades, entregas e mensagens.",
    icone: Database,
  },
  {
    titulo: "Segurança e tempo real",
    descricao:
      "RLS, Auth, triggers, cron, canais WebSocket e Edge Function protegem e automatizam fluxos sensíveis.",
    icone: RadioTower,
  },
];

const limitacoes = [
  "Não realiza aulas ao vivo ou streaming interno.",
  "Não processa pagamentos, mensalidades ou boletos.",
  "Não substitui sistemas acadêmicos oficiais da instituição.",
  "Não emite diplomas, históricos escolares ou diários oficiais.",
];

function SectionHeader({
  icone: Icone,
  titulo,
  descricao,
}: {
  icone: LucideIcon;
  titulo: string;
  descricao?: string;
}) {
  return (
    <div className="info-section-header">
      <div className="info-section-icon">
        <Icone className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">{titulo}</h2>
        {descricao && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {descricao}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoCard({ item }: { item: CardItem }) {
  const Icone = item.icone;

  return (
    <div className="info-mini-card">
      <div className="info-mini-icon">
        <Icone className="h-4 w-4" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{item.titulo}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {item.descricao}
        </p>
      </div>
    </div>
  );
}

export function InfoAplicacao() {
  return (
    <div className="info-apresentacao">
      <section className="info-hero">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="info-hero-badge">
              Modelagem de Sistemas
            </Badge>
            <Badge variant="outline" className="info-hero-badge">
              GitHub + Vercel
            </Badge>
            <Badge variant="outline" className="info-hero-badge">
              Supabase
            </Badge>
          </div>

          <div>
            <h1 className="text-gradient text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
              NexusClass
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Plataforma educacional web para aproximar alunos, professores e
              gestão, reunindo comunicação, atividades, calendário, suporte e
              inteligência artificial em uma experiência única.
            </p>
          </div>

          <div className="info-hero-actions">
            <Badge className="rounded-md px-3 py-1">v{__APP_VERSION__}</Badge>
            <span>React SPA + Supabase + Gemini AI</span>
          </div>
        </div>

        <div className="info-metrics-grid">
          {metricasProjeto.map((metrica) => (
            <div key={metrica.rotulo} className="info-metric-card">
              <strong>{metrica.valor}</strong>
              <span>{metrica.rotulo}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="info-slide-card info-slide-destaque">
        <SectionHeader
          icone={Lightbulb}
          titulo="Ideia e Escopo"
          descricao="O NexusClass nasceu como uma forma de aplicar, em um sistema próprio, as tecnologias aprendidas em um projeto externo."
        />
        <div className="info-story-grid">
          <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
            <p>
              A ideia surgiu a partir da participação dos desenvolvedores no
              projeto externo <strong>GET SI</strong>, no qual a equipe atua no
              desenvolvimento de uma aplicação mobile para o Jardim Botânico. Ao
              entrarem nesse projeto, o monitor <strong>Igor Knop</strong>{" "}
              auxiliou no aprendizado das tecnologias usadas na aplicação,
              preparando a dupla para operar melhor com React, TypeScript,
              componentes, integração com serviços externos e organização de
              projeto.
            </p>
            <p>
              Como forma de demonstrar esse aprendizado de maneira prática, o
              NexusClass começou como uma tentativa de emular um ambiente no
              estilo Google Classroom, inicialmente mais simples e focado em
              gerenciamento de estado. Depois, a disciplina de Modelagem de
              Sistemas abriu espaço para transformar esse protótipo em uma
              aplicação full-stack mais completa.
            </p>
          </div>

          <div className="info-story-highlight">
            <strong>Principais evoluções</strong>
            <span>
              Autenticação real, banco em nuvem, turmas dinâmicas, mural,
              atividades com entregas, chat interno, calendário, suporte,
              dúvidas e assistente de IA integrado.
            </span>
          </div>
        </div>
      </section>

      <section className="info-slide-card">
        <SectionHeader
          icone={Workflow}
          titulo="Como foi feito"
          descricao="O projeto saiu de um protótipo simples e evoluiu até se tornar uma aplicação hospedada, persistente e integrada."
        />
        <div className="info-build-grid">
          <div className="info-build-panel">
            <div className="info-build-panel-header">
              <Workflow className="h-4 w-4" />
              <strong>Processo e modelagem</strong>
            </div>
            <p>
              A equipe usou Kanban para organizar o fluxo de tarefas e evoluiu o
              sistema a partir dos requisitos, casos de uso, diagramas UML e
              validação constante com a aplicação funcionando.
            </p>
          </div>

          <div className="info-build-panel">
            <div className="info-build-panel-header">
              <Cloud className="h-4 w-4" />
              <strong>Deploy e implantação</strong>
            </div>
            <div className="info-deploy-timeline">
              {implantacaoEtapas.map((etapa) => (
                <div key={etapa.titulo} className="info-deploy-step">
                  <div>
                    <strong>{etapa.plataforma}</strong>
                    <em>{etapa.titulo}</em>
                  </div>
                  <p>{etapa.detalhe}</p>
                </div>
              ))}
            </div>
            <p className="info-build-note">
              A interface fica hospedada na Vercel; autenticação, banco,
              Storage e tempo real ficam concentrados no Supabase.
            </p>
          </div>
        </div>
      </section>

      <section className="info-slide-card">
        <SectionHeader
          icone={Users}
          titulo="Atores do Sistema"
          descricao="A interface e os acessos mudam conforme o papel do usuário autenticado."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {atores.map((item) => (
            <InfoCard key={item.titulo} item={item} />
          ))}
        </div>
      </section>

      <section className="info-slide-card">
        <SectionHeader
          icone={Server}
          titulo="Arquitetura do Software"
          descricao="Cliente-servidor multicamadas, com SPA em React e backend em nuvem via Supabase."
        />
        <div className="info-architecture-grid">
          <div className="info-architecture-step">
            <span>01</span>
            <strong>Apresentação</strong>
            <p>React, TypeScript, Tailwind e shadcn/ui no navegador.</p>
          </div>
          <div className="info-architecture-step">
            <span>02</span>
            <strong>Controle</strong>
            <p>Hooks customizados organizam estado, navegação e regras.</p>
          </div>
          <div className="info-architecture-step">
            <span>03</span>
            <strong>Backend</strong>
            <p>Supabase fornece Auth, Postgres, Storage e Realtime.</p>
          </div>
          <div className="info-architecture-step">
            <span>04</span>
            <strong>Serviços</strong>
            <p>Gemini AI, Vercel, GitHub e automações no banco.</p>
          </div>
        </div>
      </section>

      <section className="info-slide-card">
        <SectionHeader
          icone={Database}
          titulo="Conexão entre Front-end, Back-end e Banco de Dados"
          descricao="Como os dados saem da interface, passam pelo Supabase e retornam para o usuário."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {conexaoSistema.map((item) => (
            <InfoCard key={item.titulo} item={item} />
          ))}
        </div>
      </section>

      <section className="info-flow-card">
        <div>
          <SectionHeader
            icone={Workflow}
            titulo="Fluxo Principal do Produto"
            descricao="Como a experiência se organiza, do acesso inicial até a persistência dos dados."
          />
        </div>
        <div className="info-flow-grid">
          {fluxoProduto.map((item, index) => (
            <div key={item.etapa} className="info-flow-step">
              <span>{index + 1}</span>
              <strong>{item.etapa}</strong>
              <p>{item.detalhe}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="info-slide-card">
        <SectionHeader
          icone={ClipboardList}
          titulo="Funcionalidades Implementadas"
          descricao="Parte prática que deve ser demonstrada ao professor durante a simulação."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {funcionalidadesImplementadas.map((item) => (
            <InfoCard key={item.titulo} item={item} />
          ))}
        </div>
      </section>

      <section className="info-slide-card">
        <SectionHeader
          icone={ShieldCheck}
          titulo="Interface, UX e Qualidade Técnica"
          descricao="Critérios de correção ligados à experiência do usuário, segurança, desempenho e manutenibilidade."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {qualidadeUx.map((item) => (
            <InfoCard key={item.titulo} item={item} />
          ))}
        </div>
      </section>

      <section className="info-slide-card">
        <SectionHeader
          icone={Terminal}
          titulo="Tecnologias Adotadas"
          descricao="Pilha principal usada para front-end, back-end, persistência, IA e deploy."
        />

        <div className="flex flex-wrap gap-2.5">
          {tecnologias.map((tech) => {
            const Icone = tech.icone;

            return (
              <div
                key={tech.nome}
                className={`flex cursor-default items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-transform hover:scale-[1.03] ${tech.cor}`}
              >
                <Icone className="h-4 w-4 shrink-0" />
                <span>{tech.nome}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="info-slide-card">
          <SectionHeader
            icone={XCircle}
            titulo="Limitações de Escopo"
            descricao="O sistema foca em um LMS simplificado e deixa de fora funções institucionais mais amplas."
          />
          <div className="space-y-2">
            {limitacoes.map((item) => (
              <div key={item} className="info-limit-item">
                <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="info-slide-card">
          <SectionHeader
            icone={FileWarning}
            titulo="Disclaimer dos Dados"
            descricao="Os dados exibidos na demonstração existem apenas para fins acadêmicos e de teste."
          />
          <div className="info-disclaimer-grid">
            <div className="info-disclaimer-item">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Usuários, turmas, mensagens e exemplos foram criados apenas para
                demonstrar o funcionamento do sistema.
              </span>
            </div>
            <div className="info-disclaimer-item">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Alguns nomes e imagens usam personagens, referências de filmes e
                séries ou dados inventados para ilustração.
              </span>
            </div>
            <div className="info-disclaimer-item">
              <XCircle className="h-4 w-4" />
              <span>
                Nenhuma conta representa uma pessoa real, cadastro institucional
                ou informação oficial de ensino.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="info-slide-card">
        <SectionHeader
          icone={User}
          titulo="Desenvolvedores"
          descricao="Responsabilidades divididas entre requisitos, full-stack, UI/UX, arquitetura e deploy."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {devs.map((dev) => (
            <div key={dev.github} className="info-dev-card group">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${dev.corGradiente} text-lg font-bold text-white shadow-sm ring-2 ring-background transition-transform group-hover:scale-105`}
              >
                {dev.iniciais}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                  {dev.nome}
                </h4>
                <p className="text-xs text-muted-foreground">{dev.cargo}</p>
              </div>

              <a
                href={dev.github}
                target="_blank"
                rel="noopener noreferrer"
                className="self-center rounded-md border border-transparent p-2 text-muted-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground cursor-pointer"
                title="Ver perfil no GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row">
        <span>Desenvolvido para fins acadêmicos.</span>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-2 border border-border shadow-sm transition-colors hover:bg-primary/10 hover:text-primary cursor-pointer"
        >
          <a
            href="https://github.com/NexusMindCorp/NexusClass"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4" />
            Repositório no GitHub
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </Button>
      </div>
    </div>
  );
}