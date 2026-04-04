
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

type BoxAgendamentoProps = {
  usaSupabase: boolean;
  date: Date | null;
  titulo: string;
  setTitulo: (titulo: string) => void;
  descricao: string;
  setDescricao: (descricao: string) => void;
  horario: string;
  setHorario: (horario: string) => void;
  salvandoEvento: boolean;
  erroBanco: string | null;
  adicionarEvento: () => void;
    cancelaAgendamento: () => void;
}
export function BoxAgendamento( {cancelaAgendamento, usaSupabase, date, titulo, setTitulo, descricao, setDescricao, horario, setHorario, salvandoEvento, erroBanco, adicionarEvento }: BoxAgendamentoProps) {
  const textoDataEvento = date ? format(date, "dd/MM/yyyy") : "data nao selecionada"

  return (
    <div className="rounded-md border p-3 space-y-3">
            {!usaSupabase ? (
              <p className="text-xs text-muted-foreground">
                Supabase nao configurado. O calendario nao salva sem backend.
              </p>
            ) : null}

            {erroBanco ? (
              <p className="text-xs text-destructive">{erroBanco}</p>
            ) : null}

            <p className="text-sm font-semibold">
              {`Novo evento em ${textoDataEvento}`}
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="titulo-evento">Titulo do evento</Label>
              <Input
                id="titulo-evento"
                placeholder="Ex.: Prova de Matematica"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="horario-evento">Horario (opcional)</Label>
              <Input
                id="horario-evento"
                type="time"
                value={horario}
                onChange={(event) => setHorario(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao-evento">Descricao (opcional)</Label>
              <Textarea
                id="descricao-evento"
                placeholder="Detalhes do evento"
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                rows={3}
              />
            </div>

            <Button
                onClick={cancelaAgendamento}
                variant="outline"
              >
                Cancelar
              </Button>
            <Button
              onClick={adicionarEvento}
              disabled={!titulo.trim() || salvandoEvento || !usaSupabase}
            >
              {salvandoEvento ? "Salvando..." : "Marcar evento"}
            </Button>
          </div>
  )
}