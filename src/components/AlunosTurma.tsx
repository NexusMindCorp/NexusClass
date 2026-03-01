import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MoreHorizontalIcon } from "lucide-react"
import type { TurmaProps } from "@/hooks/leituraJson"

type AlunosTurmaProps = {
  turma: TurmaProps
}

export function AlunosTurma({ turma }: AlunosTurmaProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Nome do Aluno</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {turma.alunos.map((aluno, index) => (
          <TableRow key={index} className="hover:bg-transparent">
            <TableCell className="font-medium">{aluno}</TableCell>
            <TableCell className="text-right">
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

