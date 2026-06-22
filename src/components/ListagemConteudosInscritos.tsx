import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ListagemConteudosInscritos({
  usuario,
  listaEscolar,
  cancelarInscricao,
  estaInscrito,
}: {
  usuario: any;
  listaEscolar: any;
  cancelarInscricao: any;
  estaInscrito: any;
}) {
  const [carregandoAcao, setCarregandoAcao] = useState<string | null>(null);
  const [turmaParaSair, setTurmaParaSair] = useState<{
    key: string;
    materia: string;
    turma: string;
  } | null>(null);

  const handleSair = async (key: string) => {
    setCarregandoAcao(key);
    try {
      await cancelarInscricao(key);
      toast.success("Você saiu da turma com sucesso.");
      setTurmaParaSair(null);
    } catch (err) {
      toast.error("Erro ao sair da turma.");
    } finally {
      setCarregandoAcao(null);
    }
  };

  const turmasFiltradas = listaEscolar.turmas
    ? Object.entries(listaEscolar.turmas)
        .filter(([key]) => estaInscrito(key) || usuario.role === "master")
        .sort((a, b) =>
          (a[1] as any).materia.localeCompare((b[1] as any).materia),
        )
    : [];

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-full flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Inscritos nos Murais
        </h2>
        <p className="text-sm text-muted-foreground">
          Gerencie suas turmas e inscrições.
        </p>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-foreground">
                Matéria
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Turma
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Professor
              </TableHead>
              <TableHead className="text-center font-semibold text-foreground">
                Ação
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {turmasFiltradas.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground italic"
                >
                  Nenhuma inscrição encontrada.
                </TableCell>
              </TableRow>
            ) : (
              turmasFiltradas.map(([key, turma]: [string, any]) => (
                <TableRow
                  key={key}
                  className="hover:bg-transparent transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    {turma.materia}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {turma.turma}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {turma.professor}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/30 text-destructive  hover:text-destructive-foreground hover:scale-105 hover:shadow-md transition-all duration-200 h-8 cursor-pointer"
                      onClick={() =>
                        setTurmaParaSair({
                          key,
                          materia: turma.materia,
                          turma: turma.turma,
                        })
                      }
                      disabled={carregandoAcao === key}
                    >
                      {carregandoAcao === key ? "Saindo..." : "Sair da Turma"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={turmaParaSair !== null}
        onOpenChange={(aberto) => {
          if (!aberto && !carregandoAcao) setTurmaParaSair(null);
        }}
      >
        <DialogContent className="mensagens-dialog-exclusao sm:max-w-md">
          <DialogHeader className="items-center text-center sm:text-center">
            <div className="mensagens-dialog-exclusao-icone">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle>Sair desta turma?</DialogTitle>
            <DialogDescription>
              Você deixará a turma {turmaParaSair?.materia} (
              {turmaParaSair?.turma}) e perderá o acesso ao mural e aos
              conteúdos dela.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setTurmaParaSair(null)}
              disabled={carregandoAcao !== null}
            >
              Cancelar
            </Button>
            <Button
              className="mensagens-botao-confirmar-exclusao cursor-pointer"
              onClick={() =>
                turmaParaSair && void handleSair(turmaParaSair.key)
              }
              disabled={carregandoAcao !== null}
            >
              <LogOut className="h-4 w-4" />
              {carregandoAcao ? "Saindo..." : "Sair da turma"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
