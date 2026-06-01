import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
export function BoxAgendamento({ cancelaAgendamento, usaSupabase, date, titulo, setTitulo, descricao, setDescricao, horario, setHorario, salvandoEvento, erroBanco, adicionarEvento }: BoxAgendamentoProps) {
  const textoDataEvento = date ? format(date, "dd/MM/yyyy") : "data nao selecionada"
  const [horaInicial = "", minutoInicial = ""] = horario.split(":")
  const horas = Array.from({ length: 24 }, (_, indice) => String(indice).padStart(2, "0"))
  const minutos = Array.from({ length: 60 }, (_, indice) => String(indice).padStart(2, "0"))

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/50 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Novo evento</p>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-muted-foreground">
          {textoDataEvento}
        </span>
      </div>

      {!usaSupabase ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
          Supabase nao configurado. O calendario nao salva sem backend.
        </p>
      ) : null}

      {erroBanco ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {erroBanco}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="titulo-evento" className="text-slate-900 dark:text-white">Titulo do evento</Label>
        <Input
          id="titulo-evento"
          placeholder="Ex.: Prova de Matematica"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-indigo-300 focus-visible:ring-indigo-500/20 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="horario-evento" className="text-slate-900 dark:text-white">Horario (opcional)</Label>
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-sm dark:border-white/15 dark:bg-white/10">
            <div className="flex h-10 items-center gap-2 rounded-lg bg-slate-50 px-2 dark:bg-white/5">
              <Clock3 className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-300" />
              <Select
                value={horaInicial}
                onValueChange={(novaHora) => {
                  const minutoFinal = minutoInicial || "00"
                  setHorario(`${novaHora}:${minutoFinal}`)
                }}
              >
                <SelectTrigger className="h-8 w-[4.5rem] border-0 bg-transparent px-1 text-slate-900 shadow-none ring-0 focus:ring-0 dark:text-white dark:bg-transparent">
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" sideOffset={4} collisionPadding={16} avoidCollisions className="w-[4.5rem] max-h-56 overflow-hidden rounded-xl border border-slate-200 bg-white/95 text-slate-900 shadow-xl backdrop-blur dark:border-white/15 dark:bg-slate-950/92 dark:text-white">
                  {horas.map((hora) => (
                    <SelectItem key={hora} value={hora}>
                      {hora}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">:</span>

            <div className="flex h-10 items-center rounded-lg bg-slate-50 px-2 dark:bg-white/5">
              <Select
                value={minutoInicial}
                onValueChange={(novoMinuto) => {
                  const horaFinal = horaInicial || "00"
                  setHorario(`${horaFinal}:${novoMinuto}`)
                }}
              >
                <SelectTrigger className="h-8 w-[4.5rem] border-0 bg-transparent px-1 text-slate-900 shadow-none ring-0 focus:ring-0 dark:text-white dark:bg-transparent">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" sideOffset={4} collisionPadding={16} avoidCollisions className="w-[4.5rem] max-h-56 overflow-hidden rounded-xl border border-slate-200 bg-white/95 text-slate-900 shadow-xl backdrop-blur dark:border-white/15 dark:bg-slate-950/92 dark:text-white">
                  {minutos.map((minuto) => (
                    <SelectItem key={minuto} value={minuto}>
                      {minuto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="descricao-evento" className="text-slate-900 dark:text-white">Descricao (opcional)</Label>
          <Textarea
            id="descricao-evento"
            placeholder="Detalhes do evento"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            rows={3}
            className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-indigo-300 focus-visible:ring-indigo-500/20 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45"
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button
          onClick={cancelaAgendamento}
          variant="outline"
          className="border-slate-200 bg-white text-slate-900 hover:bg-slate-100 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
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