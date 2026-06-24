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
  Info,
  ShieldCheck,
  Users,
  Workflow,
  ClipboardList,
  Presentation,
  MonitorSmartphone,
  MessageCircle,
  CalendarDays,
  BookOpenCheck,
  Search,
  Bell,
  Server,
  Lock,
  PlayCircle,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "./ui/button";

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
    cargo: "Full-stack e requisitos",
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
    nome: "Supabase Auth",
    icone: Lock,
    cor: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  {
    nome: "Realtime",
    icone: Bell,
    cor: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    nome: "shadcn/ui",
    icone: Info,
    cor: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
];

const atores: CardItem[] = [
  {
    titulo: "Aluno",
    descricao: "Inscreve-se em turmas, acompanha murais, envia atividades, tira duvidas, usa mensagens, calendario e o Tigreso.",
    icone: User,
  },
  {
    titulo: "Professor",
    descricao: "Gerencia turmas, publica avisos, cria atividades, acompanha entregas, atribui nota e responde duvidas.",
    icone: BookOpenCheck,
  },
  {
    titulo: "Gestao / Master",
    descricao: "Tem visao administrativa ampliada para apoiar a organizacao das turmas e a demonstracao do sistema.",
    icone: ShieldCheck,
  },
];

const topicosApresentacao: CardItem[] = [
  {
    titulo: "Ideia e escopo",
    descricao: "Apresentar o problema educacional, os atores do LMS e o que ficou dentro ou fora do sistema.",
    icone: Info,
  },
  {
    titulo: "Arquitetura",
    descricao: "Explicar a SPA React, o modelo cliente-servidor, as camadas e o papel do Supabase.",
    icone: Server,
  },
  {
    titulo: "Tecnologias",
    descricao: "Mostrar linguagens, frameworks, bibliotecas, banco, BaaS, IA, deploy e versionamento.",
    icone: Terminal,
  },
  {
    titulo: "Conexao com backend",
    descricao: "Detalhar como o front-end conversa com Auth, PostgreSQL, Storage, Realtime e Edge Functions.",
    icone: Database,
  },
  {
    titulo: "Funcionalidades",
    descricao: "Demonstrar o que esta implementado: turmas, mural, atividades, duvidas, mensagens, calendario e IA.",
    icone: ClipboardList,
  },
  {
    titulo: "Simulacao",
    descricao: "Executar um fluxo real em sala, mostrando a aplicacao funcionando com usuarios autenticados.",
    icone: PlayCircle,
  },
];

const funcionalidadesImplementadas: CardItem[] = [
  {
    titulo: "Autenticacao e sessoes",
    descricao: "Login, cadastro, logout, rotas protegidas e carregamento do perfil autenticado via Supabase Auth.",
    icone: Lock,
  },
  {
    titulo: "Turmas e inscricoes",
    descricao: "Listagem dinamica de turmas, pesquisa, entrada em turmas e controle de inscricao por usuario.",
    icone: Users,
  },
  {
    titulo: "Mural e atividades",
    descricao: "Avisos por turma, criacao de atividades, anexos, entregas de alunos e avaliacao com nota e feedback.",
    icone: ClipboardList,
  },
  {
    titulo: "Comunicacao",
    descricao: "Mensagens privadas em tempo real, duvidas aluno-professor, suporte, denuncias e indicadores visuais.",
    icone: MessageCircle,
  },
  {
    titulo: "Calendario e alertas",
    descricao: "Eventos pessoais e de turma, lembretes de compromissos e notificacoes para o usuario durante o uso.",
    icone: CalendarDays,
  },
  {
    titulo: "Assistente Tigreso",
    descricao: "Chatbot integrado ao Gemini que consulta contexto da plataforma, como eventos, atividades, posts e duvidas.",
    icone: Sparkles,
  },
];

const qualidadeUx: CardItem[] = [
  {
    titulo: "Responsividade",
    descricao: "Interface adaptada para desktop e mobile, com sidebar responsiva e componentes reutilizaveis.",
    icone: MonitorSmartphone,
  },
  {
    titulo: "Seguranca",
    descricao: "Acesso protegido por autenticacao, RLS no banco e operacoes sensiveis concentradas no Supabase.",
    icone: ShieldCheck,
  },
  {
    titulo: "Persistencia",
    descricao: "Dados dinamicos gravados em PostgreSQL na nuvem, substituindo a dependencia de arquivos locais.",
    icone: Database,
  },
  {
    titulo: "Manutenibilidade",
    descricao: "TypeScript, separacao por componentes e hooks customizados para organizar estado e regras de interface.",
    icone: Code2,
  },
  {
    titulo: "Desempenho",
    descricao: "SPA com Vite e React, transicoes internas rapidas e uso de localStorage para estados visuais nao criticos.",
    icone: Zap,
  },
  {
    titulo: "Usabilidade",
    descricao: "Temas claro/escuro, feedback por toasts, badges de notificacao e layout com navegacao lateral.",
    icone: CheckCircle2,
  },
];

const conexaoSistema: CardItem[] = [
  {
    titulo: "Frontend SPA",
    descricao: "A interface roda no navegador com React Router, componentes reutilizaveis e troca interna de telas.",
    icone: MonitorSmartphone,
  },
  {
    titulo: "Supabase SDK",
    descricao: "O cliente centraliza chamadas de login, consultas, inserts, updates, storage e realtime.",
    icone: Server,
  },
  {
    titulo: "Banco PostgreSQL",
    descricao: "As entidades principais ficam em tabelas como perfis, turmas, mural, atividades, entregas e mensagens.",
    icone: Database,
  },
  {
    titulo: "Seguranca e tempo real",
    descricao: "RLS, Auth, triggers, cron, canais WebSocket e Edge Function protegem e automatizam fluxos sensiveis.",
    icone: ShieldCheck,
  },
];

const demonstracao = [
  "Entrar com um usuario autenticado e apresentar a tela principal.",
  "Mostrar turmas, pesquisa e inscricao/desinscricao.",
  "Abrir uma turma, visualizar mural, atividades, entregas e duvidas.",
  "Demonstrar mensagens em tempo real e indicadores de nao lidas.",
  "Criar ou visualizar eventos no calendario e alertas.",
  "Abrir o Tigreso e perguntar sobre atividades ou eventos.",
];

const limitacoes = [
  "Nao realiza aulas ao vivo ou streaming interno.",
  "Nao processa pagamentos, mensalidades ou boletos.",
  "Nao substitui sistemas academicos oficiais da instituicao.",
  "Nao emite diplomas, historicos escolares ou diarios oficiais.",
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
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-center">
        <div>
          <span className="mb-2 inline-flex w-fit items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Presentation className="h-3.5 w-3.5" />
            Trabalho de Modelagem de Sistemas
          </span>
          <h1 className="text-gradient text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            NexusClass
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground md:text-base">
            LMS simplificado para aproximar alunos, professores e gestao em uma
            plataforma web com comunicacao, atividades, calendario e IA.
          </p>
        </div>

        <span className="w-fit rounded-md border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          v{__APP_VERSION__}
        </span>
      </div>

      <section className="info-slide-card">
        <SectionHeader
          icone={Presentation}
          titulo="Base da Apresentacao"
          descricao="Topicos exigidos no enunciado da Parte 2 e usados como roteiro desta tela."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {topicosApresentacao.map((item) => (
            <InfoCard key={item.titulo} item={item} />
          ))}
        </div>
      </section>

      <section className="info-slide-card info-slide-destaque">
        <SectionHeader
          icone={Info}
          titulo="Ideia e Escopo"
          descricao="O NexusClass evoluiu de um prototipo front-end para uma aplicacao full-stack voltada a gestao de aprendizagem."
        />
        <p className="text-sm leading-relaxed text-foreground/90">
          A aplicacao centraliza recursos de sala de aula que normalmente ficam
          espalhados: turmas, mural de avisos, atividades, entregas, duvidas,
          mensagens privadas, calendario e suporte. O diferencial do projeto e
          integrar esses fluxos a um assistente virtual, o Tigreso, capaz de
          orientar o usuario com base no contexto da plataforma.
        </p>
      </section>

      <section className="info-slide-card">
        <SectionHeader
          icone={Server}
          titulo="Arquitetura do Software"
          descricao="Cliente-servidor multi-camadas, com SPA em React e backend em nuvem via Supabase."
        />
        <div className="info-architecture-grid">
          <div className="info-architecture-step">
            <span>01</span>
            <strong>Apresentacao</strong>
            <p>React, TypeScript, Tailwind e shadcn/ui no navegador.</p>
          </div>
          <div className="info-architecture-step">
            <span>02</span>
            <strong>Controle</strong>
            <p>Hooks customizados organizam estado, navegacao e regras.</p>
          </div>
          <div className="info-architecture-step">
            <span>03</span>
            <strong>Backend</strong>
            <p>Supabase fornece Auth, Postgres, Storage e Realtime.</p>
          </div>
          <div className="info-architecture-step">
            <span>04</span>
            <strong>Servicos</strong>
            <p>Gemini AI, Vercel, GitHub e automacoes no banco.</p>
          </div>
        </div>
      </section>

      <section className="info-slide-card">
        <SectionHeader
          icone={Database}
          titulo="Conexao Front-end, Back-end e Banco"
          descricao="Como os dados saem da interface, passam pelo Supabase e retornam para o usuario."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {conexaoSistema.map((item) => (
            <InfoCard key={item.titulo} item={item} />
          ))}
        </div>
      </section>

      <section className="info-slide-card">
        <SectionHeader
          icone={Users}
          titulo="Atores do Sistema"
          descricao="A interface e os acessos mudam conforme o papel do usuario autenticado."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {atores.map((item) => (
            <InfoCard key={item.titulo} item={item} />
          ))}
        </div>
      </section>

      <section className="info-slide-card">
        <SectionHeader
          icone={ClipboardList}
          titulo="Funcionalidades Implementadas"
          descricao="Parte pratica que deve ser demonstrada ao professor durante a simulacao."
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
          titulo="Interface, UX e Qualidade Tecnica"
          descricao="Criterios de correcao ligados a experiencia do usuario, seguranca, desempenho e manutenibilidade."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {qualidadeUx.map((item) => (
            <InfoCard key={item.titulo} item={item} />
          ))}
        </div>
      </section>

      <section className="info-slide-card">
        <SectionHeader
          icone={Workflow}
          titulo="Como foi feito"
          descricao="Complemento do documento de requisitos: processo, modelagem, responsabilidades e deploy."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <InfoCard
            item={{
              titulo: "Processo",
              descricao: "Kanban para fluxo continuo, priorizacao visual e divisao de tarefas em equipe reduzida.",
              icone: Workflow,
            }}
          />
          <InfoCard
            item={{
              titulo: "Modelagem",
              descricao: "Requisitos, casos de uso, diagramas UML, modelo ER e validacao com a implementacao.",
              icone: ClipboardList,
            }}
          />
          <InfoCard
            item={{
              titulo: "Deploy",
              descricao: "Versionamento no GitHub e publicacao da SPA em ambiente web para demonstracao.",
              icone: Cloud,
            }}
          />
        </div>
      </section>

      <section className="info-slide-card">
        <SectionHeader
          icone={Terminal}
          titulo="Tecnologias Adotadas"
          descricao="Pilha principal usada para frontend, backend, persistencia, IA e deploy."
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

      <section className="info-slide-card">
        <SectionHeader
          icone={PlayCircle}
          titulo="Roteiro de Demonstracao"
          descricao="Sequencia sugerida para apresentar a aplicacao funcionando em sala."
        />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {demonstracao.map((item, index) => (
            <div key={item} className="info-demo-step">
              <span>{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="info-slide-card">
          <SectionHeader
            icone={XCircle}
            titulo="Limitacoes de Escopo"
            descricao="O sistema foca no LMS simplificado e deixa fora funcoes institucionais mais amplas."
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
            icone={Search}
            titulo="Conexao com a Disciplina"
            descricao="A apresentacao evidencia atores, requisitos, arquitetura, tecnologias e funcionamento."
          />
          <p className="text-sm leading-relaxed text-foreground/90">
            Para Modelagem de Sistemas, o NexusClass demonstra a ligacao entre
            requisitos, modelagem, banco de dados e produto final. A arquitetura
            escolhida permite explicar claramente as responsabilidades de cada
            camada e simular os principais casos de uso implementados.
          </p>
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
        <span>Desenvolvido para fins academicos.</span>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-2 border border-border shadow-sm transition-colors hover:bg-primary/10 hover:text-primary cursor-pointer"
        >
          <a
            href="https://github.com/NexusMindCorp/NexusClassWeb"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4" />
            Repositorio no GitHub
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </Button>
      </div>
    </div>
  );
}
