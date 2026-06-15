import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import type { TurmaProps } from "@/hooks/leituraJson"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { MoreHorizontalIcon, MessageCircle, User2, AlertCircle, Users } from "lucide-react"
import { useOptionAlunos } from "@/hooks/useOptionAlunos"
import { BoxDenunciaAluno } from "@/components/BoxDenunciaAluno"
import { BoxPerfilUsuario } from "@/components/BoxPerfilUsuario"
import type { PerfilUsuario } from "@/hooks/useAuth"
import { PerfilAvatar } from "./PerfilAvatar"

type AlunosTurmaProps = {
  turma: TurmaProps
  perfil: PerfilUsuario
  abrirChat: (contatoId: string) => void;
}

type tableRowProps = {
  id: string
  nome: string
  foto?: string | null
  descricao?: string
}

export function AlunosTurma({ turma, perfil, abrirChat }: AlunosTurmaProps) {
  const { opcaoSelecionada, nomeAluno, handleOptionSelect } = useOptionAlunos()
  const listaSemUsuario = turma.alunos.filter(aluno => aluno.id !== perfil.id);
  const professorId = turma.professor_id || "";
  const podeInteragirComProfessor = Boolean(professorId && professorId !== perfil.id);
  const isProfessor = perfil.role === "professor" && professorId === perfil.id;

  const renderLinhaPessoa = ({ id, nome, foto, descricao, }: tableRowProps) => {
    const podeEnviarMensagem = Boolean(id && id !== perfil.id);
    const podeDenunciar = Boolean(id !== perfil.id);

    return (
      <TableRow key={id || nome} className="group hover:bg-muted/50 transition-colors">
        <TableCell className="py-3">
          <div className="flex items-center gap-3">
            <PerfilAvatar
              classNameAvatar="h-8 w-8 rounded-full object-cover shadow-sm"
              classNameDiv="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              tipo="usuario"
              palavra={nome}
              foto={foto || undefined}
            />
            <div className="flex min-w-0 flex-col">
              <span className="font-medium text-sm truncate">{nome}</span>
              {descricao ? (
                <span className="text-xs text-muted-foreground truncate">{descricao}</span>
              ) : null}
            </div>
          </div>
        </TableCell>

        <TableCell className="text-right py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 data-[state=open]:opacity-100"
              >
                <MoreHorizontalIcon className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => handleOptionSelect('Ver Perfil', nome)}
              >
                <User2 className="mr-2 h-4 w-4" />
                Ver Perfil
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                disabled={!podeEnviarMensagem}
                onSelect={() => abrirChat(id)}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Enviar mensagem
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                disabled={!podeDenunciar}
                onSelect={() => handleOptionSelect('Denunciar', nome)}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Denunciar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  }

  const renderiarModal =
    opcaoSelecionada === 'Denunciar' && nomeAluno ? (
      <BoxDenunciaAluno
        aluno={nomeAluno}
        onClose={() => handleOptionSelect(null)}
      />
    ) : opcaoSelecionada === 'Ver Perfil' && nomeAluno ? (
      <BoxPerfilUsuario
        nomeUsuario={nomeAluno}
        onClose={() => handleOptionSelect(null)}
        currentUserProfile={perfil}
      />
    ) : null

  return (
    <>
      {renderiarModal}
      <div className="space-y-4 max-w-4xl mx-auto pb-8">
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User2 className="h-5 w-5 text-muted-foreground" />
              Professor
            </h3>
            <span className="text-sm text-muted-foreground">
              {podeInteragirComProfessor ? "Contato disponível" : "Seu perfil"}
            </span>
          </div>

          <div className="rounded-md border bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10">Nome do Professor</TableHead>
                  <TableHead className="h-10 text-right w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderLinhaPessoa({
                  id: professorId,
                  nome: turma.professor,
                  foto: turma.foto_professor,
                  descricao: turma.materia,
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            {isProfessor ? "Alunos da turma" : "Colegas de turma"}
          </h3>
          <span className="text-sm text-muted-foreground">
            {listaSemUsuario.length} {listaSemUsuario.length === 1 ? 'aluno' : 'alunos'}
          </span>
        </div>

        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10">Nome do Aluno</TableHead>
                <TableHead className="h-10 text-right w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listaSemUsuario.map((aluno, index) => renderLinhaPessoa({
                id: aluno.id || String(index),
                nome: aluno.nome,
                foto: aluno.foto_url,
              }))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}
