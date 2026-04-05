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
import { useConfiguracoes } from "@/hooks/useConfiguracoes"
import type { OpcoesTela } from "@/hooks/useGerenciador"
type ConfiguracoesProps = {
  navegarPara?: (tela: OpcoesTela) => void
}

export function Configuracoes({ navegarPara }: ConfiguracoesProps) {
  const { notificacoes, clickarNotificacoes } = useConfiguracoes();

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
            onClick={()=> clickarNotificacoes()}
            aria-label="Ativar notificações"
            checked={notificacoes}
          />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Configurações avançadas</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navegarPara?.("suporte")}>Suporte</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navegarPara?.("privacidade")}>Sobre acordo de privacidade</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
