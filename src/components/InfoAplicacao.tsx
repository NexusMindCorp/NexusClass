import {
  Github,
  ExternalLink,
  Code2,
  Sparkles,
  Layers,
  Database,
  Mail,
  User,
  Zap,
  Cloud,
  Terminal,
  Info,
} from "lucide-react";
import { Button } from "./ui/button";

export function InfoAplicacao() {
  const devs = [
    {
      nome: "Gianlucca Paiva",
      iniciais: "GP",
      cargo: "Desenvolvedor de Software",
      github: "https://github.com/gianluccapaiva",
      corGradiente: "bg-gradient-to-br from-purple-600 to-pink-500",
    },
    {
      nome: "Gabriel Lineker",
      iniciais: "GL",
      cargo: "Desenvolvedor de Software",
      github: "https://github.com/gabriellineker",
      corGradiente: "bg-gradient-to-br from-indigo-600 to-purple-500",
    },
  ];

  const tecnologias = [
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
      nome: "Resend",
      icone: Mail,
      cor: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      nome: "API Gemini",
      icone: Sparkles,
      cor: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      nome: "Lucide Icons",
      icone: Layers,
      cor: "text-pink-600 dark:text-pink-400 bg-pink-500/10 border-pink-500/20",
    },
    {
      nome: "Shadcn UI",
      icone: Info,
      cor: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
  ];

  return (
    <div className="w-full max-w-3xl space-y-6 rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm md:p-6 transition-colors">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-center">
        <div>
          <h1 className="text-gradient text-3xl font-extrabold tracking-tight text-foreground">
            NexusClass
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Ambiente de auxílio ao estudo de modelagem de sistemas
          </p>
        </div>

        <span className="w-fit rounded-md border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          v{__APP_VERSION__}
        </span>
      </div>

      <div className="flex gap-4 rounded-lg border border-border bg-muted/50 p-4 transition-colors hover:bg-muted/80">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
          <Info className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Sobre o Projeto
          </h2>
          <p className="text-sm leading-relaxed text-foreground/90">
            Esta aplicação foi desenvolvida com o objetivo de auxiliar no estudo
            de modelagem de sistemas, fornecendo um ambiente interativo para a
            administração de turmas, atividades, fóruns de dúvidas e integração
            de inteligência artificial com chat inteligente.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <User className="h-5 w-5 text-primary" />
          Desenvolvedores
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {devs.map((dev) => (
            <div
              key={dev.github}
              className="group flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4 transition-all hover:border-primary/50 hover:bg-muted/50"
            >
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
      </div>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Terminal className="h-5 w-5 text-primary" />
          Tecnologias Adotadas
        </h3>

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
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row">
        <span>Desenvolvido para fins acadêmicos.</span>

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
            Repositório no GitHub
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </Button>
      </div>
    </div>
  );
}
