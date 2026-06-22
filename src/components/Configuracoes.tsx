import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";
import { SidebarMenuButton } from "./ui/sidebar";
import type { OpcoesTela } from "@/hooks/GerenciadorHooks/type";

type ConfiguracoesProps = {
  navegarPara?: (tela: OpcoesTela) => void;
};

export function Configuracoes({ navegarPara }: ConfiguracoesProps) {
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
          onSelect={() => navegarPara?.("configuracoesAvancadas")}
        >
          Configurações avançadas
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navegarPara?.("suporte")}>
          Suporte
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navegarPara?.("privacidade")}>
          Sobre acordo de privacidade
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navegarPara?.("info")}>
          Informações
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
