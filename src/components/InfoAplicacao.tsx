import {
  CheckCircle2,
  Cloud,
  Database,
  ExternalLink,
  FileWarning,
  Github,
  Lightbulb,
  Server,
  ShieldCheck,
  Terminal,
  User,
  Users,
  Workflow,
  XCircle,
  ClipboardList,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { InfoCard, SectionHeader } from "./InfoAplicacao/InfoElementos";
import {
  atores,
  conexaoSistema,
  devs,
  fluxoProduto,
  funcionalidadesImplementadas,
  implantacaoEtapas,
  limitacoes,
  metricasProjeto,
  qualidadeUx,
  tecnologias,
} from "./InfoAplicacao/config";

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
            <p className="mt-3 max-w-4xl text-base leading-relaxed text-muted-foreground md:text-lg">
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
          <div className="space-y-3 text-base leading-relaxed text-foreground/90">
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
            <div className="info-process-list">
              <div>
                <span>01</span>
                <strong>Organização</strong>
                <p>Kanban e fluxo de tarefas.</p>
              </div>
              <div>
                <span>02</span>
                <strong>Modelagem</strong>
                <p>Requisitos, casos de uso e UML.</p>
              </div>
              <div>
                <span>03</span>
                <strong>Validação</strong>
                <p>Testes na aplicação funcionando.</p>
              </div>
            </div>
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
              A interface fica hospedada na Vercel; autenticação, banco, Storage
              e tempo real ficam concentrados no Supabase.
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
            <p>Gemini AI, Vercel, Resend, GitHub e automações no banco.</p>
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
        <SectionHeader
          icone={Workflow}
          titulo="Fluxo Principal do Produto"
          descricao="Como a experiência se organiza, do acesso inicial até a persistência dos dados."
        />
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
        <div className="info-tech-grid">
          {tecnologias.map((tech) => {
            const Icone = tech.icone;

            return (
              <div key={tech.nome} className={`info-tech-chip ${tech.cor}`}>
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
