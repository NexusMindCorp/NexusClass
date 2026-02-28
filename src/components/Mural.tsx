import type { TurmaProps } from "@/hooks/leituraJson";
import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
} from "@/components/ui/button-group"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Plus } from "lucide-react";

type MuralProps = {
    materia: string;
    turma: TurmaProps;
};

export function Mural({ materia, turma }: MuralProps) {
    return (
        <div className="mx-auto w-full max-w-3xl space-y-1">
        <Card className="relative w-full overflow-hidden">
      <img
        src={turma.banners}
        alt={`Banner da turma ${materia}`}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/50" />
      <CardHeader className="relative z-10 flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-3xl text-white">{materia}</CardTitle>
          <CardDescription className="text-white/90">
            Professor: {turma.professor} | Sala: {turma.sala}
          </CardDescription>
        </div>
        <CardAction>
          <div className="flex flex-col items-end gap-2">
            <img
              src={turma.foto_professor}
              alt={`Foto do professor ${turma.professor}`}
              className="h-14 w-14 rounded-full object-cover"
            />
            <ButtonGroup>
              <Button  className="text-white" variant="link" size="sm">
                Atividades
              </Button>

              <Button className="text-white" variant="link" size="sm">
                Entrar em contato
              </Button>
            </ButtonGroup>
          </div>
        </CardAction>
      </CardHeader>
    </Card>
    
    <Button className="ml-30 w-fit"><Plus />Postar no mural</Button>
    </div>
    );
}