import { useState } from "react";
import {
  Blocks,
  CheckCircle2,
  ClipboardList,
  Cloud,
  Code2,
  Database,
  ExternalLink,
  FileCheck2,
  FileWarning,
  FlaskConical,
  GitBranch,
  Github,
  Layers,
  Lightbulb,
  Server,
  ShieldCheck,
  Terminal,
  User,
  Users,
  Workflow,
  XCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { InfoCard, SectionHeader } from "../hooks/InfoAplicacao/InfoElementos";
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
} from "../hooks/InfoAplicacao/config";
import {
  catalogoPadroes,
  destaquesFaseZero,
  evolucaoCobertura,
  ferramentasEngenharia,
  matrizTestesRbt,
  metricasEngenharia,
  pilaresEngenharia,
  roadmapFases,
  ultimaAtualizacaoEngenharia,
} from "../hooks/InfoAplicacao/configEngenhariaSoftware";
import type { TipoApresentacao } from "../hooks/InfoAplicacao/type";
import { getBadgeStatusStyle } from "@/lib/utils";

export function InfoAplicacao() {
  const [apresentacaoAtiva, setApresentacaoAtiva] =
    useState<TipoApresentacao>("engenharia");
  const [padraoSelecionadoId, setPadraoSelecionadoId] = useState<string>(
    catalogoPadroes[0].id
  );

  const padraoAtivo =
    catalogoPadroes.find((p) => p.id === padraoSelecionadoId) ??
    catalogoPadroes[0];

  return (
    <div className="info-apresentacao">
      {/* Seletor de Apresentação: Engenharia de Software (DCC061) vs Modelagem de Sistemas */}
      <section className="info-slide-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Modo de Apresentação Acadêmica
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            alterne entre os slides de{" "}
            <strong className="text-foreground">
              Engenharia de Software (Design Patterns & Testes)
            </strong>{" "}
            e a documentação arquitetural original de{" "}
            <strong className="text-foreground">Modelagem de Sistemas</strong>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={apresentacaoAtiva === "engenharia" ? "default" : "outline"}
            size="sm"
            onClick={() => setApresentacaoAtiva("engenharia")}
            className="gap-2 cursor-pointer"
          >
            <FlaskConical className="h-4 w-4" />
            Engenharia de Software (DCC061)
          </Button>
          <Button
            type="button"
            variant={apresentacaoAtiva === "modelagem" ? "default" : "outline"}
            size="sm"
            onClick={() => setApresentacaoAtiva("modelagem")}
            className="gap-2 cursor-pointer"
          >
            <Workflow className="h-4 w-4" />
            Modelagem de Sistemas
          </Button>
        </div>
      </section>

      {apresentacaoAtiva === "engenharia" ? (
        <>
          {/* HERO — ENGENHARIA DE SOFTWARE (DCC061) */}
          <section className="info-hero">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="info-hero-badge">
                  Engenharia de Software (DCC061)
                </Badge>
                <Badge variant="outline" className="info-hero-badge">
                  Design Patterns GoF
                </Badge>
                <Badge variant="outline" className="info-hero-badge">
                  Testes Automatizados (Vitest + V8)
                </Badge>
                <Badge variant="outline" className="info-hero-badge">
                  Branch: {ultimaAtualizacaoEngenharia.branch}
                </Badge>
              </div>

              <div>
                <h1 className="text-gradient text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                  NexusClass — Padrões & Testes
                </h1>
                <p className="mt-3 max-w-4xl text-base leading-relaxed text-muted-foreground md:text-lg">
                  Evolução arquitetural do NexusClass aplicando{" "}
                  <strong className="text-foreground">
                    Design Patterns (GoF)
                  </strong>{" "}
                  para desacoplamento real e uma{" "}
                  <strong className="text-foreground">
                    Pirâmide de Testes Baseada em Risco (RBT)
                  </strong>{" "}
                  para garantir qualidade, manutenibilidade e zero regressão.
                </p>
              </div>

              <div className="info-hero-actions">
                <Badge className="rounded-md px-3 py-1">
                  {ultimaAtualizacaoEngenharia.faseAtual}
                </Badge>
                <span>
                  Última atualização: {ultimaAtualizacaoEngenharia.ultimoAutor}{" "}
                  em {ultimaAtualizacaoEngenharia.data}
                </span>
              </div>
            </div>

            <div className="info-metrics-grid">
              {metricasEngenharia.map((metrica) => (
                <div key={metrica.rotulo} className="info-metric-card">
                  <strong>{metrica.valor}</strong>
                  <span>{metrica.rotulo}</span>
                </div>
              ))}
            </div>
          </section>

          {/* SLIDE 1 — PILARES E DIRETRIZES */}
          <section className="info-slide-card info-slide-destaque">
            <SectionHeader
              icone={Lightbulb}
              titulo="Motivação e Diretrizes de Engenharia"
              descricao="Como evitamos o overengineering e garantimos que cada padrão e cada teste resolvam um problema concreto do sistema."
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {pilaresEngenharia.map((item) => (
                <InfoCard key={item.titulo} item={item} />
              ))}
            </div>
          </section>

          {/* SLIDE 2 — CATÁLOGO INTERATIVO DE DESIGN PATTERNS (ANTES VS DEPOIS) */}
          <section className="info-slide-card">
            <SectionHeader
              icone={Blocks}
              titulo="Catálogo Interativo de Design Patterns (Antes vs. Depois)"
              descricao="Selecione cada padrão abaixo para inspecionar o problema real no código original, a solução planejada/aplicada em src/patterns/ e os benefícios para manutenção e testes."
            />

            <div className="flex flex-wrap gap-2 pb-2">
              {catalogoPadroes.map((padrao) => {
                const ativo = padrao.id === padraoAtivo.id;
                return (
                  <Button
                    key={padrao.id}
                    type="button"
                    size="sm"
                    variant={ativo ? "default" : "outline"}
                    onClick={() => setPadraoSelecionadoId(padrao.id)}
                    className="gap-2 cursor-pointer"
                  >
                    <span>{padrao.nome}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${getBadgeStatusStyle(
                        padrao.status
                      )}`}
                    >
                      {padrao.status}
                    </span>
                  </Button>
                );
              })}
            </div>

            <div className="info-build-grid mt-2">
              <div className="info-build-panel space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="info-build-panel-header">
                    <Code2 className="h-4 w-4" />
                    <strong>{padraoAtivo.nome}</strong>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{padraoAtivo.categoria}</Badge>
                    <Badge variant="outline">{padraoAtivo.fase}</Badge>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${getBadgeStatusStyle(
                        padraoAtivo.status
                      )}`}
                    >
                      {padraoAtivo.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p>
                    <strong className="text-foreground">Onde atua: </strong>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {padraoAtivo.ondeAplicado}
                    </code>
                  </p>
                  <p>
                    <strong className="text-foreground">Responsável: </strong>
                    <span className="text-muted-foreground">
                      {padraoAtivo.responsavel}
                    </span>
                  </p>
                </div>

                <div className="info-process-list">
                  <div>
                    <span>ANTES</span>
                    <strong>Problema no Código Original</strong>
                    <p>{padraoAtivo.problemaAntes}</p>
                  </div>
                  <div>
                    <span>DEPOIS</span>
                    <strong>Solução Arquitetural</strong>
                    <p>{padraoAtivo.solucaoDepois}</p>
                  </div>
                  <div>
                    <span>GANHO</span>
                    <strong>Impacto em Testes & Manutenção</strong>
                    <p>{padraoAtivo.beneficioQualidade}</p>
                  </div>
                </div>
              </div>

              <div className="info-build-panel space-y-3">
                <div className="info-build-panel-header">
                  <Terminal className="h-4 w-4" />
                  <strong>Comparativo de Código (Antes vs. Depois)</strong>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Antes da Refatoração
                  </span>
                  <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 text-xs leading-relaxed text-foreground">
                    <code>{padraoAtivo.codigoAntes}</code>
                  </pre>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Depois (Padrão Aplicado / Contrato)
                  </span>
                  <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 text-xs leading-relaxed text-foreground">
                    <code>{padraoAtivo.codigoDepois}</code>
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* SLIDE 3 — ESTRATÉGIA DE TESTES E DESTAQUES DA FASE 0 */}
          <section className="info-slide-card">
            <SectionHeader
              icone={FlaskConical}
              titulo="Estratégia de Testes de Software & Entregas da Fase 0"
              descricao="Aplicação prática de Testes Baseados em Risco (RBT), Determinismo Temporal (Fake Timers), Valor Limite e Particionamento de Equivalência."
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {destaquesFaseZero.map((item) => (
                <InfoCard
                  key={item.titulo}
                  item={{
                    titulo: item.titulo,
                    descricao: item.detalhe,
                    icone: item.icone,
                  }}
                />
              ))}
            </div>

            <div className="info-architecture-grid mt-4">
              {matrizTestesRbt.map((item, idx) => (
                <div key={item.camada} className="info-architecture-step">
                  <div className="flex items-center justify-between gap-2">
                    <span>0{idx + 1}</span>
                    <em
                      className={`rounded border px-2 py-0.5 text-[11px] font-semibold not-italic ${getBadgeStatusStyle(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </em>
                  </div>
                  <strong>{item.camada}</strong>
                  <p className="mt-1 text-xs font-medium text-primary">
                    {item.nivelRbt} · {item.ferramenta}
                  </p>
                  <p className="mt-1">{item.alvos}</p>
                  <p className="mt-2 border-t border-border/60 pt-2 text-xs text-muted-foreground">
                    <strong>Técnicas:</strong> {item.tecnicas}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* SLIDE 4 — EVOLUÇÃO QUANTITATIVA DE COBERTURA (V8) */}
          <section className="info-slide-card">
            <SectionHeader
              icone={FileCheck2}
              titulo="Evolução da Cobertura de Código (@vitest/coverage-v8)"
              descricao="Medição contínua por fase no escopo de lógica e padrões (src/lib e src/patterns). Cada fase concluída registra seu snapshot abaixo."
            />

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Etapa / Fase</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Suítes / Testes</th>
                    <th className="px-4 py-3">Statements</th>
                    <th className="px-4 py-3">Branches</th>
                    <th className="px-4 py-3">Functions</th>
                    <th className="px-4 py-3">Lines</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {evolucaoCobertura.map((snap) => (
                    <tr
                      key={snap.etapa}
                      className={
                        snap.destaque
                          ? "bg-emerald-500/10 font-medium text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      <td className="px-4 py-3 text-foreground">{snap.etapa}</td>
                      <td className="px-4 py-3">{snap.responsavel}</td>
                      <td className="px-4 py-3">{snap.testes}</td>
                      <td className="px-4 py-3 font-mono">{snap.statements}</td>
                      <td className="px-4 py-3 font-mono">{snap.branches}</td>
                      <td className="px-4 py-3 font-mono">{snap.functions}</td>
                      <td className="px-4 py-3 font-mono">{snap.lines}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SLIDE 5 — ROADMAP DE FASES E PASSAGEM DE BASTÃO (HANDOFF DA DUPLA) */}
          <section className="info-flow-card">
            <SectionHeader
              icone={GitBranch}
              titulo="Roadmap de Fases & Handoff entre a Dupla (Fases 0 a 6)"
              descricao="Registro vivo de cada etapa do planejamento. Conforme cada membro conclui uma fase, este painel é atualizado junto com a documentação."
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {roadmapFases.map((item) => (
                <div key={item.fase} className="info-flow-step space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span>{item.fase}</span>
                    <em
                      className={`rounded border px-2 py-0.5 text-xs font-semibold not-italic ${getBadgeStatusStyle(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </em>
                  </div>
                  <strong>{item.titulo}</strong>
                  <p className="text-xs text-primary">
                    <strong>Responsável:</strong> {item.responsavel}
                  </p>
                  <p>{item.entregas}</p>
                  <p className="border-t border-border/60 pt-2 text-xs text-muted-foreground">
                    <strong>Validação:</strong> {item.evidenciaTeste}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* SLIDE 6 — FERRAMENTAS E ECOSSISTEMA DE QUALIDADE */}
          <section className="info-slide-card">
            <SectionHeader
              icone={Terminal}
              titulo="Ferramentas de Qualidade, Testes e Arquitetura"
              descricao="Stack utilizada para testes automatizados, cobertura, tipagem e governança em dupla."
            />
            <div className="info-tech-grid">
              {ferramentasEngenharia.map((tech) => {
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
        </>
      ) : (
        <>
          {/* APRESENTAÇÃO ORIGINAL DE MODELAGEM DE SISTEMAS (100% PRESERVADA) */}
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
                <Badge className="rounded-md px-3 py-1">
                  v{__APP_VERSION__}
                </Badge>
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
                  projeto externo <strong>GET SI</strong>, no qual a equipe atua
                  no desenvolvimento de uma aplicação mobile para o Jardim
                  Botânico. Ao entrarem nesse projeto, o monitor{" "}
                  <strong>Igor Knop</strong> auxiliou no aprendizado das
                  tecnologias usadas na aplicação, preparando a dupla para operar
                  melhor com React, TypeScript, componentes, integração com
                  serviços externos e organização de projeto.
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
                  A equipe usou Kanban para organizar o fluxo de tarefas e
                  evoluiu o sistema a partir dos requisitos, casos de uso,
                  diagramas UML e validação constante com a aplicação
                  funcionando.
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
                    Usuários, turmas, mensagens e exemplos foram criados apenas
                    para demonstrar o funcionamento do sistema.
                  </span>
                </div>
                <div className="info-disclaimer-item">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Alguns nomes e imagens usam personagens, referências de
                    filmes e séries ou dados inventados para ilustração.
                  </span>
                </div>
                <div className="info-disclaimer-item">
                  <XCircle className="h-4 w-4" />
                  <span>
                    Nenhuma conta representa uma pessoa real, cadastro
                    institucional ou informação oficial de ensino.
                  </span>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* SEÇÃO DE DESENVOLVEDORES E RODAPÉ (COMUM A AMBAS AS APRESENTAÇÕES) */}
      <section className="info-slide-card">
        <SectionHeader
          icone={User}
          titulo="Desenvolvedores"
          descricao="Responsabilidades divididas entre requisitos, full-stack, UI/UX, arquitetura, Design Patterns e Testes de Software."
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
