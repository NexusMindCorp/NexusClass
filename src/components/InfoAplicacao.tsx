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
  Info
} from "lucide-react";
import { Button } from "./ui/button";

export function InfoAplicacao() {
    const devs = [
        {
            nome: "Gianlucca Paiva",
            iniciais: "GP",
            cargo: "Desenvolvedor de Software",
            github: "https://github.com/gianluccapaiva",
            corGradiente: "from-blue-500 to-indigo-600"
        },
        {
            nome: "Gabriel Lineker",
            iniciais: "GL",
            cargo: "Desenvolvedor de Software",
            github: "https://github.com/gabriellineker",
            corGradiente: "from-purple-500 to-pink-600"
        }
    ];

    const tecnologias = [
        { nome: "Vite React", icone: Zap, cor: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
        { nome: "TypeScript", icone: Code2, cor: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
        { nome: "Tailwind CSS", icone: Layers, cor: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
        { nome: "Supabase", icone: Database, cor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
        { nome: "Vercel", icone: Cloud, cor: "text-neutral-400 bg-neutral-500/10 border-neutral-500/20" },
        { nome: "Resend", icone: Mail, cor: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
        { nome: "API Gemini", icone: Sparkles, cor: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
        { nome: "Lucide Icons", icone: Layers, cor: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
        { nome: "Shadcn UI", icone: Info, cor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
    ];

    return (
        <div className="w-full max-w-3xl space-y-8 p-6 bg-card text-card-foreground border border-border rounded-2xl shadow-xl backdrop-blur-sm relative overflow-hidden transition-all duration-300">
     

            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border relative z-10">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                        NexusClass
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Ambiente de auxílio ao estudo de modelagem de sistemas
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start md:self-center">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm animate-pulse">
                        v{__APP_VERSION__}
                    </span>
                </div>
            </div>

     
            <div className="flex gap-4 p-5 rounded-xl bg-muted/30 border border-border/50 relative z-10 hover:bg-muted/40 transition-colors duration-200">
                <Info className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Sobre o Projeto</h2>
                    <p className="text-sm leading-relaxed text-foreground/90">
                        Esta aplicação foi desenvolvida com o objetivo de auxiliar no estudo de modelagem de sistemas, fornecendo um ambiente interativo para a administração de turmas, atividades, fóruns de dúvidas e integração de inteligência artificial com chat inteligente.
                    </p>
                </div>
            </div>


            <div className="space-y-4 relative z-10">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <User className="h-5 w-5 text-indigo-500" />
                    Desenvolvedores
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {devs.map((dev, i) => (
                        <div 
                            key={i} 
                            className="flex items-center gap-4 p-4 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/35 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 group"
                        >
                            <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${dev.corGradiente} flex items-center justify-center text-white font-bold text-lg shadow-inner group-hover:scale-105 transition-transform duration-300`}>
                                {dev.iniciais}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">{dev.nome}</h4>
                                <p className="text-xs text-muted-foreground">{dev.cargo}</p>
                            </div>
                            <a 
                                href={dev.github} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="p-2 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-all duration-200 self-center"
                                title="Ver perfil no GitHub"
                            >
                                <Github className="h-4 w-4" />
                            </a>
                        </div>
                    ))}
                </div>
            </div>


            <div className="space-y-4 relative z-10">
                <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <Terminal className="h-5 w-5 text-emerald-500" />
                    Tecnologias Adotadas
                </h3>
                <div className="flex flex-wrap gap-2.5">
                    {tecnologias.map((tech, i) => {
                        const Icone = tech.icone;
                        return (
                            <div 
                                key={i} 
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-300 hover:scale-105 cursor-default ${tech.cor}`}
                            >
                                <Icone className="h-4 w-4 shrink-0" />
                                <span>{tech.nome}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <span>Desenvolvido para fins acadêmicos.</span>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    asChild 
                    className="gap-2 hover:bg-primary/5 hover:text-primary transition-all duration-200 shadow-sm border border-border"
                >
                    <a href="https://github.com/NexusMindCorp/NexusClassWeb" target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4" />
                        Repositório no GitHub
                        <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                </Button>
            </div>
        </div>
    );
}