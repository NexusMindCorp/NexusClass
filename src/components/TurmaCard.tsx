import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ButtonGroup } from "./ui/button-group";
import { PerfilAvatar } from "./PerfilAvatar";
import type { PerfilUsuario } from "@/hooks/useAuth"
import { Plus } from "lucide-react"

type TurmasProps = {
  materia: string;
  professor: string;
  banners: string;
  fotoProfessor: string;
  sala: string;
  turma: string;
  inscrito?: boolean;
  compacto?: boolean;
  modoPesquisa?: boolean;
  perfil: PerfilUsuario;
  clickInscrito?: () => void;
  clickMural?: () => void;
}

export function TurmaCard({ materia, professor, banners, fotoProfessor, sala, turma, inscrito = false, compacto = false, modoPesquisa, clickMural, clickInscrito, perfil }: TurmasProps) {
  const isMaster = perfil?.role === "master";

  return (
    <Card className={`relative mx-auto w-full pt-0 overflow-hidden ${compacto ? '' : 'max-w-sm'}`}>
      <div className={`absolute inset-0 z-30 bg-black/35 ${compacto ? 'h-24' : 'aspect-video'}`} />

      <img
        src={banners || undefined}
        alt="Banner da turma"
        className={`relative z-20 w-full object-cover brightness-70 ${compacto ? 'h-24' : 'aspect-video'}`}
      />

      <CardHeader className={compacto ? "p-4 pb-1 pt-0" : ""}>
        <CardAction className="relative z-40 h-11 w-11">
          <PerfilAvatar
            classNameAvatar={`rounded-full object-cover border-2 border-background shadow-sm ${compacto ? 'h-10 w-10' : 'h-14 w-14'}`}
            classNameDiv={`flex h-full w-full shrink-0 items-center justify-center rounded-full text-white text-3xl`}
            foto={fotoProfessor}
            tipo="materia"
            palavra={professor}
          />
        </CardAction>

        <CardTitle className={compacto ? "text-lg mt-1" : ""}>{materia}</CardTitle>

        <CardDescription className={compacto ? "text-xs " : ""}>
          {compacto ? `Prof: ${professor} | Sala: ${sala}` : `Professor: ${professor} | Sala: ${sala} | Turma: ${turma}`}
        </CardDescription>
      </CardHeader>

      <CardFooter className={compacto ? "p-4 pb-1 pt-0" : ""}>
        {inscrito || isMaster ? (
          modoPesquisa ? (
            <Button onClick={() => clickMural?.()} size="sm" className="w-full">
              Entrar
            </Button>
          ) : (
            <ButtonGroup className='w-full'>
              <Button onClick={() => clickMural?.()} size="sm" className="w-full">
                Entrar
              </Button>
            </ButtonGroup>
          )) : (
          <ButtonGroup className={compacto ? "w-full" : ""}>
            <Button onClick={() => clickInscrito?.()}
              size="sm"
              className='w-full bg-ring hover:bg-ring/80 text-white border-0 hover:bg-ring/80 focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-ring/80'>
              <Plus className="h-4 w-4" />
              Inscrever-se
            </Button>
          </ButtonGroup>
        )}
      </CardFooter>
    </Card>
  )
}