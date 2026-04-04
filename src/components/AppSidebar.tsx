import { Home, Inbox, Calendar, Search, ChevronDown } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarSeparator } from "./ui/sidebar"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@radix-ui/react-collapsible"
import { Configuracoes } from "./Configuracoes"
import type { OpcoesTela } from "@/hooks/useGerenciador"
import { listaEscolar } from "@/hooks/leituraJson"
import { getCorMateria } from "@/lib/utils"

const items = [
    {
        title: "Inicio",
        url: "/",
        icon: Home,
    },
    {
        title: "Pesquisar",
        url: "#",
        icon: Search,
    },
    {
        title: "Mensagens",
        url: "#",
        icon: Inbox,
    },
    {
        title: "Calendario",
        url: "#",
        icon: Calendar,
    },
]

type AppSidebarProps = {
    navegarPara: (tela: OpcoesTela) => void;
    inscricoes: Record<string, boolean>;
    marcarMural: (key: string) => void;
}

export function AppSidebar({ navegarPara, inscricoes, marcarMural }: AppSidebarProps) {
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
                                <img src="Logos/Logo.png" alt="Logo da Escola Nexus" width={22} height={22} />
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
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a
                                            href={item.url}
                                            onClick={(e) => {
                                                if (item.title === "Inicio") {
                                                    e.preventDefault();
                                                    navegarPara("principal");
                                                }
                                                if (item.title === "Calendario") {
                                                    e.preventDefault();
                                                    navegarPara("calendario");
                                                }
                                                if (item.title === "Pesquisar") {
                                                    e.preventDefault();
                                                    navegarPara("pesquisar");
                                                }
                                                if (item.title === "Mensagens") {
                                                    e.preventDefault();
                                                    navegarPara("mensagens");
                                                }
                                                if (item.title === "Suporte") {
                                                    e.preventDefault();
                                                    navegarPara("suporte");
                                                }
                                                // Os outros botões aqui
                                            }}
                                        >
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                    {item.title === "Mensagens" && (
                                        <SidebarMenuBadge>0</SidebarMenuBadge>
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
                                Minhas Aulas
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarContent>
                                <SidebarMenu>
                                    {/*Materias selecionadas*/}
                                    <SidebarMenu>
                                        {Object.entries(inscricoes).filter(([_, inscrito]) => inscrito).length === 0 ? (
                                            <div className="px-4 py-2 text-sm text-muted-foreground">
                                                Nenhuma aula inscrita
                                            </div>
                                        ) : (
                                            Object.entries(inscricoes)
                                                .filter(([_, inscrito]) => inscrito)
                                                .map(([key, _]) => {

                                                    const turma = listaEscolar.turmas[key];
                                                    if (!turma) return null;

                                                    return (
                                                        <SidebarMenuItem key={key}>
                                                            <SidebarMenuButton
                                                                onClick={() => marcarMural(key)}
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
                                </SidebarMenu>
                            </SidebarContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>
            </SidebarContent>

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