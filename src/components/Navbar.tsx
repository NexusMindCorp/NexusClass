"use client"

import { LogOutIcon, Moon, Edit, Sun, User, Mail, Bell, AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
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
import { Button } from "./ui/button"
import { useTheme } from "./provedores/ThemeProvider"
import { SidebarTrigger } from "./ui/sidebar"
import React from "react"

const Navbar = () => {
    const { setTheme } = useTheme()
    const [notifications, setNotifications] = React.useState({
        email: true,
        sms: false,
        push: true,
    })

    return (
        <nav className="barra-navegacao">
            {/*Esquerda*/}
            <SidebarTrigger />
            {/*Direita*/}
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
                            <DropdownMenuCheckboxItem
                                checked={notifications.email}
                                onCheckedChange={(checked) =>
                                    setNotifications({ ...notifications, email: checked === true })
                                }
                            >
                                <Mail />
                                Mensagens
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={notifications.push}
                                onCheckedChange={(checked) =>
                                    setNotifications({ ...notifications, push: checked === true })
                                }
                            >
                                <AlertCircle />
                                Alertas
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/*Tema do Site*/}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="focus-visible:ring-0 focus-visible:ring-offset-0">
                            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                            <span className="sr-only">Mudar tema</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            Claro
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            Escuro
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                            Sistema
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Menu Usuario*/}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 focus-visible:ring-0 focus-visible:ring-offset-0" >
                            <Avatar>
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>Imagem Perfil</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={10} align="end">
                        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem> <User className="icones-minha-conta" /> Perfil</DropdownMenuItem>
                        <DropdownMenuItem> <Edit className="icones-minha-conta" /> Editar </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive"> <LogOutIcon className="icones-minha-conta" /> Sair</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav >
    )
}

export default Navbar