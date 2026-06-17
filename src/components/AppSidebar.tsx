import { Home, Calendar, Search, ChevronDown, MessageCircle, Compass, MessageCircleQuestionMark, } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarSeparator } from "./ui/sidebar"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@radix-ui/react-collapsible"
import { Configuracoes } from "./Configuracoes"
import { Button } from "./ui/button"
import type { OpcoesTela } from "@/hooks/useGerenciador"
import type { EscolaProps } from "@/hooks/LeituraDataHooks/leituraJson"
import type { PerfilUsuario } from "@/hooks/AuthHooks/type"
import { getAssetPath } from "@/lib/assetPath"
import { getCorMateria } from "@/lib/utils"
import { useDuvidas } from "@/hooks/DuvidaHooks/useDuvidas"

let itensMenu = [
    { title: "Inicio", id: "principal", icon: Home },
    { title: "Pesquisar", id: "pesquisar", icon: Search },
    { title: "Mensagens", id: "mensagens", icon: MessageCircle },
    { title: "Calendario", id: "calendario", icon: Calendar },
    { title: "Dúvidas", id: "duvidas", icon: MessageCircleQuestionMark }
];

type AppSidebarProps = {
    navegarPara: (tela: OpcoesTela) => void;
    inscricoes: Record<string, boolean>;
    marcarMural: (key: string) => void;
    listaEscolar: EscolaProps;
    perfil: PerfilUsuario;
}

export function AppSidebar({ navegarPara, inscricoes, marcarMural, listaEscolar, perfil }: AppSidebarProps) {
    const { duvidas } = useDuvidas(perfil);
    const isMaster = perfil?.role === "master";
    const tituloTurmas = isMaster ? "Todas as Turmas" : "Minhas Turmas";
    const turmasParaExibir = isMaster
        ? Object.entries(listaEscolar?.turmas || {})
        : Object.entries(listaEscolar?.turmas || {}).filter(([id]) => inscricoes[id]);

    const isNovoAluno = perfil?.role === "aluno" && turmasParaExibir.length === 0;

    // Calcular quantidade de dúvidas pendentes
    const duvidasPendentes = duvidas.filter((d) => {
        if (!perfil) return false;
        if (d.resolvido) return false;
        if (perfil.role === "master") return true;
        if (perfil.role === "professor") return d.prof_id === perfil.id;
        return d.aluno_id === perfil.id;
    });
    const totalDuvidasPendentes = duvidasPendentes.length;

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <a href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    navegarPara("principal");
                                }} className="flex items-center gap-2">
                                <img src={getAssetPath("Logos/Logo.png")} alt="Logo da Escola Nexus" width={22} height={22} />
                                <span className="text-gradient text-lg tracking-tight">NexusClass</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarSeparator className="mx-0 w-full" />

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
                    <SidebarContent>
                        <SidebarMenu>
                            {itensMenu.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navegarPara(item.id as OpcoesTela);
                                            }}
                                        >
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                    {item.title === "Mensagens" && (
                                        <SidebarMenuBadge>0</SidebarMenuBadge>
                                    )}
                                    {item.id === "duvidas" && totalDuvidasPendentes > 0 && (
                                        <SidebarMenuBadge className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20">
                                            {totalDuvidasPendentes}
                                        </SidebarMenuBadge>
                                    )}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarContent>
                </SidebarGroup>

                <SidebarSeparator className="mx-0 w-full" />

                <Collapsible defaultOpen={false} className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger>
                                {tituloTurmas}
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180 cursor-pointer" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarContent>
                                <SidebarMenu>
                                    {isNovoAluno ? (
                                        <div className="px-4 py-4 flex flex-col items-center gap-3 text-center">
                                            <span className="text-sm text-muted-foreground">Você ainda não está em nenhuma turma.</span>
                                            <Button variant="secondary" size="sm" className="w-full cursor-pointer" onClick={() => navegarPara("pesquisar")}>
                                                <Compass className="w-4 h-4 mr-2" /> Explorar Turmas
                                            </Button>
                                        </div>
                                    ) : turmasParaExibir.length === 0 ? (
                                        <div className="px-4 py-2 text-sm text-muted-foreground">
                                            Nenhuma turma alocada.
                                        </div>
                                    ) : (
                                        turmasParaExibir.map(([id, turma]) => {
                                            if (!turma) return null;

                                            return (
                                                <SidebarMenuItem key={id}>
                                                    <SidebarMenuButton
                                                        onClick={() => marcarMural(id)}
                                                        className="cursor-pointer h-9 px-2 rounded-md hover:bg-secondary data-[state=open]:bg-secondary"
                                                    >
                                                        <div className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full ${getCorMateria(turma.materia)}`}>
                                                            {turma.materia.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="truncate">{turma.materia} - {turma.turma}</span>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            );
                                        })
                                    )}
                                </SidebarMenu>
                            </SidebarContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>
            </SidebarContent >

            <SidebarSeparator className="mx-0 w-full" />

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Configuracoes navegarPara={navegarPara} />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar >
    )
}