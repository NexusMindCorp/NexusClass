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


type TurmasProps = {
  materia: string;
  professor: string;
  banners: string;
  fotoProfessor: string;
  sala: string;
  turma: string;
}

export function TurmaCard({ materia, professor, banners, fotoProfessor, sala, turma }: TurmasProps) {
  return (
    <Card className="relative mx-auto w-full max-w-sm pt-0">
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      <img
        src={banners}
        alt="Event cover"
        className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40"
      />
      <CardHeader>
        <CardAction>
          <Badge asChild variant="secondary" className="rounded-full">
            <img
              src={fotoProfessor}
              alt="Event cover"
              className="h-10 w-10 rounded-full object-cover"
            />
            </Badge>
        </CardAction>
        <CardTitle>{materia}</CardTitle>
        <CardDescription>
          Professor: {professor} | Sala: {sala} | Turma: {turma}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full">Entrar</Button>
      </CardFooter>
    </Card>
  )
}
