import{ useState } from "react"
import { useNavigate } from "react-router-dom"
import { LogOutIcon, Moon, Edit, Sun, User, Mail, Bell, AlertCircle } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "./ui/button"
import { useTheme } from "./provedores/ThemeProvider"
import { SidebarTrigger } from "./ui/sidebar"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import type { PerfilUsuario } from "@/hooks/useAuth"
import { PerfilAvatar } from "./PerfilAvatar"

type NavbarProps = {
    perfil: PerfilUsuario;
    atualizarPerfilLocal: (perfilAtualizado: PerfilUsuario) => void;
}

export function Navbar({ perfil, atualizarPerfilLocal }: NavbarProps) {
    const { setTheme } = useTheme()
    const navigate = useNavigate()
    const [notifications, setNotifications] =useState({ email: true, alert: true, })
    const [saindo, setSaindo] =useState(false)
    const [salvando, setSalvando] = useState(false)
    const [modalVisualizar, setModalVisualizar] = useState(false)
    const [modalEditar, setModalEditar] = useState(false)
    const [fotoInput, setFotoInput] = useState(perfil?.foto_url || "")
    const [bioInput, setBioInput] = useState(perfil?.bio || "")

    const abrirModalEditar = () => {
        setFotoInput(perfil?.foto_url || "")
        setBioInput(perfil?.bio || "")
        setModalEditar(true)
    }

    const handleSair = async () => {
        if (saindo) return
        setSaindo(true)
        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                console.warn("Erro ao tentar deslogar no Supabase, prosseguindo com a limpeza local:", error)
            }
        } catch (error: any) {
            console.error("Erro inesperado ao deslogar:", error)
        } finally {
            setSaindo(false)
            navigate("/login", { replace: true })
        }
    }

    const salvarEdicao = async () => {
        if (!perfil?.id) return;
        setSalvando(true);

        try {
            const { data, error } = await supabase
                .from("perfis")
                .update({ foto_url: fotoInput || null, bio: bioInput })
                .eq("id", perfil.id)
                .select()
                .single();

            if (error) throw error;

            if (!data) {
                throw new Error("Não autorizado. Verifique sua sessão.");
            }

            atualizarPerfilLocal(data as PerfilUsuario);

            toast.success("Perfil atualizado!", {
                description: "Suas informações foram salvas com sucesso.",
            });

            setModalEditar(false);

        } catch (error: any) {
            toast.error("Erro ao salvar", {
                description: "Ocorreu um problema ao salvar. Tente atualizar a página.",
            });
        } finally {
            setSalvando(false);
        }
    }

    return (
        <nav className="barra-navegacao">
            <SidebarTrigger />
            <div className="conteiner-navegacao">
                {/* Menu de Notificações */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="focus-visible:ring-0 focus-visible:ring-offset-0">
                            <Bell />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40" align="end">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Tipos de Notificação</DropdownMenuLabel>
                            <DropdownMenuCheckboxItem checked={notifications.email} onCheckedChange={(c) => setNotifications({ ...notifications, email: c })}>
                                <Mail className="mr-2 h-4 w-4" /> Mensagens
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={notifications.alert} onCheckedChange={(c) => setNotifications({ ...notifications, alert: c })}>
                                <AlertCircle className="mr-2 h-4 w-4" /> Alertas
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Tema do Site */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="focus-visible:ring-0 focus-visible:ring-offset-0">
                            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                            <span className="sr-only">Mudar tema</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")}>Claro</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>Escuro</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>Sistema</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Menu Usuario */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 focus-visible:ring-0 focus-visible:ring-offset-0" >
                            <PerfilAvatar
                                classNameDiv={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white`}
                                foto={perfil?.foto_url}
                                tipo="usuario"
                                palavra={perfil?.nome}
                            />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={10} align="end">
                        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setModalVisualizar(true)} className="cursor-pointer">
                            <User className="icones-minha-conta mr-2 h-4 w-4" /> Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={abrirModalEditar} className="cursor-pointer">
                            <Edit className="icones-minha-conta mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={handleSair} disabled={saindo} className="cursor-pointer">
                            <LogOutIcon className="icones-minha-conta mr-2 h-4 w-4" /> {saindo ? "Saindo..." : "Sair"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Visualizar Perfil */}
                <Dialog open={modalVisualizar} onOpenChange={setModalVisualizar}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Perfil do Usuário</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-4 py-6">
                            <PerfilAvatar
                                classNameAvatar={`h-24 w-24 border-2 border-primary rounded-full`}
                                classNameDiv={`flex h-full w-full shrink-0 items-center justify-center rounded-full text-white text-3xl `}
                                foto={perfil?.foto_url}
                                tipo="usuario"
                                palavra={perfil?.nome}
                            />
                            <div className="text-center space-y-1">
                                <h2 className="text-2xl font-bold">{perfil?.nome}</h2>
                                <p className="text-sm font-semibold uppercase text-purple-500">{perfil?.role}</p>
                                <p className="text-xs text-muted-foreground">{perfil?.email}</p>
                            </div>
                            <div className="w-full mt-2 p-4 rounded-md bg-secondary border border-primary/50">
                                <h4 className="text-sm font-medium mb-1">Bio:</h4>
                                <p className="text-sm text-muted-foreground italic">
                                    {perfil?.bio ? `"${perfil.bio}"` : "Nenhuma biografia informada."}
                                </p>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Editar Perfil */}
                <Dialog open={modalEditar} onOpenChange={setModalEditar}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Editar Perfil</DialogTitle>
                            <DialogDescription>
                                Atualize as informações do seu perfil.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-muted-foreground">Nome</Label>
                                <Input value={perfil?.nome || ""} disabled={true} className="col-span-3 bg-muted" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-muted-foreground">E-mail</Label>
                                <Input value={perfil?.email || ""} disabled={true} className="col-span-3 bg-muted" />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4 mt-2">
                                <Label htmlFor="foto" className="text-right">Link da Foto</Label>
                                <Input
                                    id="foto"
                                    value={fotoInput}
                                    onChange={(e) => setFotoInput(e.target.value)}
                                    className="col-span-3 bg-muted border border-primary/50"
                                    placeholder="Deixe vazio para usar a letra inicial"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="bio" className="text-right mt-2">Biografia</Label>
                                <Textarea
                                    id="bio"
                                    value={bioInput}
                                    onChange={(e) => setBioInput(e.target.value)}
                                    className="col-span-3 resize-none h-20 bg-muted border border-primary/50"
                                    placeholder="Fale um pouco sobre você..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setModalEditar(false)} disabled={salvando}>Cancelar</Button>
                            <Button onClick={salvarEdicao} disabled={salvando}>
                                {salvando ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </nav>
    )
}
