"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings } from "lucide-react"
import { SidebarMenuButton } from "./ui/sidebar"
import { Switch } from "@/components/ui/switch"

export function Configuracoes() {
  return (
    <DropdownMenu>
      <SidebarMenuButton asChild>
        <DropdownMenuTrigger asChild>
          <a href="#" onClick={(e) => e.preventDefault()}>
            <Settings />
            <span>Configurações</span>
          </a>
        </DropdownMenuTrigger>
      </SidebarMenuButton>
      <DropdownMenuContent side="top" align="start" className="w-48">
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="justify-between focus:bg-transparent data-[highlighted]:bg-transparent focus:text-foreground data-[highlighted]:text-foreground"
        >
          <span>Notificações</span>
          <Switch
            id="notificacoes"
            onClick={(e) => e.stopPropagation()}
            aria-label="Ativar notificações"
          />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Configurações avançadas</DropdownMenuItem>
        <DropdownMenuItem>Suporte</DropdownMenuItem>
        <DropdownMenuItem>Sobre acordo de privacidade</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
