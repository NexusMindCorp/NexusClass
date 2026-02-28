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
  clickInscrito?: () => void;
  clickMural?: (materia: string) => void;
}

export function TurmaCard({ materia, professor, banners, fotoProfessor, sala, turma, inscrito = false,clickMural, clickInscrito }: TurmasProps) {
  return (
    <Card className="relative mx-auto w-full max-w-sm pt-0">
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      {/* imagem do banner */ }
      <img
        src={banners}
        alt="Banner da turma"
        className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40"
      />
      <CardHeader>
        <CardAction>
          <Badge asChild variant="secondary" className="rounded-full">
            {/* Imagem professor */}
            <img
              src={fotoProfessor}
              alt="Foto do professor"
              className="h-10 w-10 rounded-full object-cover"
            />
            </Badge>
        </CardAction>
        {/* Título da matéria */ }
        <CardTitle>{materia}</CardTitle>
        {/* Informações adicionais da turma */ }
        <CardDescription>
          Professor: {professor} | Sala: {sala} | Turma: {turma}
        </CardDescription>
      </CardHeader>
      <CardFooter>
          {inscrito ? <ButtonGroup>
            <Button onClick={()=>clickInscrito?.()} variant={"destructive"} size="sm">
              Cancelar Inscrição
            </Button>
            <ButtonGroupSeparator />
            <Button onClick={() => clickMural?.(materia)} size="sm">
              Entrar
            </Button>
        </ButtonGroup>
        :
        <ButtonGroup>
            <Button onClick={() => clickInscrito?.()} size="sm">
              Inscrever-se
            </Button>
        </ButtonGroup>
        }
      </CardFooter>
    </Card>
  )
}
