import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { TurmaProps } from "@/hooks/leituraJson"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

export function AlunosTurma({ turma, perfil, abrirChat }: AlunosTurmaProps) {
  const { opcaoSelecionada, nomeAluno, handleOptionSelect } = useOptionAlunos()
  const listaSemUsuario = turma.alunos.filter(aluno => aluno.id !== perfil.id);

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
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Colegas de Turma
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
              {listaSemUsuario.map((aluno, index) => (
                <TableRow key={aluno.id || index} className="group hover:bg-muted/50 transition-colors">

                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <PerfilAvatar
                        classNameAvatar="h-8 w-8 rounded-full object-cover shadow-sm"
                        classNameDiv="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        tipo="usuario"
                        palavra={aluno.nome}
                        foto={aluno.foto_url || undefined}
                      />
                      <span className="font-medium text-sm">{aluno.nome}</span>
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
                          onSelect={() => handleOptionSelect('Ver Perfil', aluno.nome)}
                        >
                          <User2 className="mr-2 h-4 w-4" />
                          Ver Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onSelect={() => abrirChat(aluno.id)}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Enviar mensagem
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onSelect={() => handleOptionSelect('Denunciar', aluno.nome)}
                        >
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Denunciar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}