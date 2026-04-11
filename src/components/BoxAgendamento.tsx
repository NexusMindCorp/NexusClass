
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
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Novo evento</p>
        <span className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground">
          {textoDataEvento}
        </span>
      </div>

      {!usaSupabase ? (
        <p className="rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          Supabase nao configurado. O calendario nao salva sem backend.
        </p>
      ) : null}

      {erroBanco ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {erroBanco}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="titulo-evento">Titulo do evento</Label>
        <Input
          id="titulo-evento"
          placeholder="Ex.: Prova de Matematica"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="horario-evento">Horario (opcional)</Label>
          <Input
            id="horario-evento"
            type="time"
            value={horario}
            onChange={(event) => setHorario(event.target.value)}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="descricao-evento">Descricao (opcional)</Label>
          <Textarea
            id="descricao-evento"
            placeholder="Detalhes do evento"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button
          onClick={cancelaAgendamento}
          variant="outline"
          className="border-white/20 bg-transparent"
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
    </div>
  )
}