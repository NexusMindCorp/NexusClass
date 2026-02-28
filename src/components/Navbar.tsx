import { LogOutIcon, Moon, Settings, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const Navbar = () => {
    return (
        <nav className="p-4 flex items-center justify-between">
            {/*Esquerda*/}
            collapse button
            {/*Direita*/}
            <div className="flex items-center gap-4">
                <a href="/">Nexus Class</a>
                <Moon />
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Avatar>
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={10}>
                        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem> <User className="h-[1.2rem] w-[1.2rem] mr-2" /> Perfil</DropdownMenuItem>
                        <DropdownMenuItem> <Settings className="h-[1.2rem] w-[1.2rem] mr-2" /> Configurações </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive"> <LogOutIcon className="h-[1.2rem] w-[1.2rem] mr-2" /> Sair</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    )
}

export default Navbar