import { Home, Inbox, Calendar, Search, ChevronDown } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarSeparator } from "./ui/sidebar"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@radix-ui/react-collapsible"
import { Configuracoes } from "./Configuracoes"
import type { OpcoesTela } from "@/hooks/useGerenciador"
import { Card } from "./ui/card"

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

const AppSidebar = ({ navegarPara, inscricoes, marcarMural }: AppSidebarProps & { inscricoes: Record<string, boolean>, marcarMural: (key: string) => void }) => {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <a href="/">
                                <img src="Logos/Logo3.png" alt="Logo da Escola Nexus" width={22} height={22} />
                                <span>NexusClass</span>
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
                                                {/*Os outros botões aqui*/ }
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
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarContent>
                                <SidebarMenu>
                                    {/*Aqui vão entrar as materias selecionadas*/}
                                    <SidebarMenuItem>
                                        {Object.entries(inscricoes).filter(([_, inscrito]) => inscrito).length === 0 ? (
                                            <span className="text-sm text-muted-foreground">Nenhuma aula inscrita</span>
                                        ) : (
                                            Object.entries(inscricoes).filter(([_, inscrito]) => inscrito).map(([key, _]) => (
                                                <Card key={key} className="p-2 mb-2 cursor-pointer" onClick={() => marcarMural(key)}>
                                                    {key}
                                                </Card>
                                            ))
                                        )}
                                    </SidebarMenuItem>
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
        </Sidebar>
    )
}

export default AppSidebar