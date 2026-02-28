import type { TurmaProps } from "@/hooks/leituraJson";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BoxMural } from "./BoxMural";
import { Plus } from "lucide-react";
import { useMural } from "@/hooks/useMural";

type MuralProps = {
  materia: string;
  turma: TurmaProps;
};

export function Mural({ materia, turma }: MuralProps) {
  const {
    posts,
    conteudo,
    setConteudo,
    mudarAberturaBox,
    handlePublicar,
    handleCancelar,
  } = useMural();

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
                <Button className="text-white" variant="link" size="sm">
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

      <Button className="ml-30 w-fit" onClick={() => mudarAberturaBox(true)}>
        <Plus />Postar no mural
      </Button>

      <BoxMural
        materia={materia}
        professorNome={turma.professor}
        aberto={posts.boxAberto}
        onClose={handleCancelar}
        conteudo={conteudo}
        setConteudo={setConteudo}
        onPublicar={handlePublicar}
      />

      <div className="mt-4 space-y-4">
        {posts.posts.length > 0 ? (
          posts.posts.map((post) => (
            <Card key={post.id} className="p-4">
              <p className="mb-2 text-sm text-muted-foreground">{post.data}</p>
              <p className="whitespace-pre-wrap">{post.conteudo}</p>
            </Card>
          ))
        ) : (
            <Card className="overflow-hidden p-4">
              <div className="flex gap-1 items-center justify-center">
                <img src="https://cdn.pixabay.com/photo/2016/10/28/16/56/list-1778593_1280.png" alt="Não encontrado imagem" className="h-40 w-40 object-cover rounded" />
                <p className="text-muted-foreground">
                  Nenhum post ainda.
                </p>
              </div>
            </Card>
        )}
      </div>
    </div>
  );
}