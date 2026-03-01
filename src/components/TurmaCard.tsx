import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ButtonGroup, ButtonGroupSeparator } from "./ui/button-group";

type TurmasProps = {
  materia: string;
  professor: string;
  banners: string;
  fotoProfessor: string;
  sala: string;
  turma: string;
  inscrito?: boolean;
  compacto?: boolean;
  clickInscrito?: () => void;
  clickMural?: (materia: string) => void;
}

export function TurmaCard({ materia, professor, banners, fotoProfessor, sala, turma, inscrito = false, compacto = false, clickMural, clickInscrito }: TurmasProps) {
  return (
    <Card className={`relative mx-auto w-full pt-0 ${compacto ? '' : 'max-w-sm'}`}>

      <div className={`absolute inset-0 z-30 bg-black/35 ${compacto ? 'h-24' : 'aspect-video'}`} />

      <img
        src={banners}
        alt="Banner da turma"
        className={`relative z-20 w-full object-cover brightness-70 ${compacto ? 'h-24' : 'aspect-video'}`}
      />

      <CardHeader className={compacto ? "p-4 pb-1 pt-0" : ""}>
        <CardAction>
          <Badge asChild variant="link" className="rounded-full">
            <img
              src={fotoProfessor}
              alt="Foto do professor"
              className={`rounded-full object-cover ${compacto ? 'h-10 w-10' : 'h-14 w-14'}`}
            />
          </Badge>
        </CardAction>

        <CardTitle className={compacto ? "text-lg mt-1" : ""}>{materia}</CardTitle>

        <CardDescription className={compacto ? "text-xs " : ""}>
          {compacto ? `Prof: ${professor} | Sala: ${sala}` : `Professor: ${professor} | Sala: ${sala} | Turma: ${turma}`}
        </CardDescription>
      </CardHeader>

      <CardFooter className={compacto ? "p-4 pb-1 pt-0" : ""}>
        {inscrito ? (
          <ButtonGroup>
            <Button onClick={() => clickInscrito?.()} variant={"destructive"} size="sm">
              {compacto ? "Sair" : "Cancelar Inscrição"}
            </Button>
            <ButtonGroupSeparator />
            <Button onClick={() => clickMural?.(materia)} size="sm">
              Entrar
            </Button>
          </ButtonGroup>
        ) : (
          <ButtonGroup className={compacto ? "w-full" : ""}>
            <Button onClick={() => clickInscrito?.()} size="sm" className="w-full">
              Inscrever-se
            </Button>
          </ButtonGroup>
        )}
      </CardFooter>
    </Card>
  )
}