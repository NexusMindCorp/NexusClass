import { useState } from "react";
import type { TurmaProps } from "@/hooks/leituraJson";
import type { PerfilUsuario } from "@/hooks/useAuth";
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
import { Plus, MoreVertical, Trash2, User } from "lucide-react";
import { useMural } from "@/hooks/useMural";
import { AtendimentoContato } from "./AtendimentoContato";
import { AlunosTurma } from "./AlunosTurma";
import { PerfilAvatar } from "./PerfilAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { BoxPerfilUsuario } from "./BoxPerfilUsuario";

type MuralProps = {
  materia: string;
  turma: TurmaProps;
  perfil: PerfilUsuario;
};

export function Mural({ materia, turma, perfil }: MuralProps) {
  const [nomePerfilParaVer, setNomePerfilParaVer] = useState<string | null>(null);
  const {
    posts,
    conteudo,
    setConteudo,
    assunto,
    setAssunto,
    mudarAberturaBox,
    handlePublicar,
    handleCancelar,
    abrirMural,
    abrirAtividades,
    abrirContato,
    abrirMensagemContato,
    abrirAlunos,
    deletarPost,
  } = useMural(materia, perfil);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-1 min-h-screen pb-16">
      {nomePerfilParaVer && (
        <BoxPerfilUsuario
          nomeUsuario={nomePerfilParaVer}
          onClose={() => setNomePerfilParaVer(null)}
          currentUserProfile={perfil}
        />
      )}
      <Card className="relative w-full overflow-hidden h-67">
        <img
          src={turma.banners}
          alt={`Banner da turma ${materia}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <CardHeader className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <CardTitle className="text-3xl text-white">{turma.materia}</CardTitle>
            <CardDescription className="text-white/90">
              Professor: {turma.professor} | Sala: {turma.sala}
            </CardDescription>
          </div>
          <CardAction className="self-end">
            <div className="flex flex-col items-end gap-2">
              <PerfilAvatar
                classNameAvatar={`h-20 w-20 rounded-full object-cover border-2 border-background shadow-sm`}
                classNameDiv={`flex h-full w-full shrink-0 items-center justify-center rounded-full text-white text-3xl`}
                foto={turma.foto_professor}
                tipo="materia"
                palavra={turma.professor}
              />
              <ButtonGroup>
                <Button onClick={() => abrirMural()} className="text-white" variant="link" size="sm">
                  Mural
                </Button>
                <Button onClick={() => abrirAtividades()} className="text-white" variant="link" size="sm">
                  Atividades
                </Button>
                <Button onClick={() => abrirContato()} className="text-white" variant="link" size="sm">
                  Entrar em contato
                </Button>
                <Button onClick={() => abrirAlunos()} className="text-white" variant="link" size="sm">
                  Alunos
                </Button>
              </ButtonGroup>
            </div>
          </CardAction>
        </CardHeader>
      </Card>

      <Button className=" w-fit" onClick={() => mudarAberturaBox(true)}>
        <Plus />Postar no mural
      </Button>

      <BoxMural
        materia={turma.materia}
        professorNome={turma.professor}
        aberto={posts.boxAberto}
        onClose={handleCancelar}
        conteudo={conteudo}
        setConteudo={setConteudo}
        onPublicar={handlePublicar}
      />

      <div className="mt-4 space-y-4">
        {posts.tipoAmostar === "mural" ? (
          posts.posts.length > 0 ? (
            posts.posts.map((post) => (
              <Card key={post.id} className="p-5 shadow-sm border border-border/60 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <PerfilAvatar
                      classNameAvatar="h-10 w-10 rounded-full object-cover border border-border/80"
                      classNameDiv="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      foto={post.autor?.foto_url}
                      tipo="usuario"
                      palavra={post.Nome}
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-foreground leading-tight">{post.Nome}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">{post.data}</span>
                    </div>
                  </div>

                  {/* Dropdown Menu (Três Pontos) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 rounded-full cursor-pointer hover:bg-muted">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onSelect={() => setNomePerfilParaVer(post.Nome)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Ver Perfil
                      </DropdownMenuItem>

                      {/* Mostrar Excluir se for o autor ou se for professor/master */}
                      {(post.autor?.id === perfil.id || perfil.role === "professor" || perfil.role === "master") && (
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onSelect={() => deletarPost(post.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="whitespace-pre-wrap text-sm text-card-foreground leading-relaxed pl-1">{post.conteudo}</p>
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
          )
        ) : posts.tipoAmostar === "atividade" ? (
          <Card className="overflow-hidden p-4">
            <div className="flex gap-1 items-center justify-center">
              <img src="https://cdn.pixabay.com/photo/2016/10/28/16/56/list-1778593_1280.png" alt="Não encontrado imagem" className="h-40 w-40 object-cover rounded" />
              <p className="text-muted-foreground">
                Nenhuma atividade ainda.
              </p>
            </div>
          </Card>
        ) : (
          <AtendimentoContato
            professorNome={turma.professor}
            aberto={posts.boxAberto}
            onClose={handleCancelar}
            assunto={assunto}
            setAssunto={setAssunto}
            mensagem={conteudo}
            setMensagem={setConteudo}
            onEnviar={abrirMensagemContato}
          />
        )}
        {posts.tipoAmostar === "alunos" && (
          <AlunosTurma turma={turma} perfil={perfil} />
        )}
      </div>
    </div>
  );
}