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
import type { PerfilUsuario } from "@/hooks/useAuth";

type BoxAgendamentoProps = {
  perfil: PerfilUsuario;
  turmasDisponiveis: { id: string; nome: string }[];
  tipo: "pessoal" | "turma";
  setTipo: (tipo: "pessoal" | "turma") => void;
  turmaSelecionada: string;
  setTurmaSelecionada: (id: string) => void;
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

export function BoxAgendamento({ cancelaAgendamento, usaSupabase, date, titulo, setTitulo, descricao, setDescricao, horario, setHorario, salvandoEvento, erroBanco, adicionarEvento, perfil, turmasDisponiveis, tipo, setTipo, turmaSelecionada, setTurmaSelecionada }: BoxAgendamentoProps) {
  const textoDataEvento = date ? format(date, "dd/MM/yyyy") : "data nao selecionada"
  const [horaInicial = "", minutoInicial = ""] = horario.split(":")
  const horas = Array.from({ length: 24 }, (_, indice) => String(indice).padStart(2, "0"))
  const minutos = Array.from({ length: 60 }, (_, indice) => String(indice).padStart(2, "0"))

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-lg shadow-black/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Novo evento</p>
        <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          {textoDataEvento}
        </span>
      </div>

      {!usaSupabase ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          Supabase não configurado. O calendário não salva sem backend.
        </p>
      ) : null}

      {erroBanco ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {erroBanco}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="titulo-evento" className="text-foreground">Título do evento</Label>
        <Input
          id="titulo-evento"
          placeholder="Ex.: Prova de Matemática"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-2 transition-colors"
        />
        {perfil.role !== "aluno" && (
          <div className="grid gap-3 sm:grid-cols-2 mt-2">
            <div className="space-y-1.5">
              <Label className="text-foreground">Tipo de Evento</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="border-input bg-background text-foreground">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessoal">Evento Pessoal</SelectItem>
                  <SelectItem value="turma">Evento para Turma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipo === "turma" && (
              <div className="space-y-1.5">
                <Label className="text-foreground">Qual Turma?</Label>
                <Select value={turmaSelecionada} onValueChange={setTurmaSelecionada}>
                  <SelectTrigger className="border-input bg-background text-foreground">
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" className="max-h-64 overflow-y-auto">
                    {turmasDisponiveis.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id} className="cursor-pointer">
                        {turma.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="horario-evento" className="text-foreground">Horário (opcional)</Label>
          <div className="inline-flex items-center gap-2 rounded-xl border border-input bg-background px-2 py-2 shadow-sm">
            <div className="flex h-10 items-center gap-2 rounded-lg bg-muted px-2">
              <Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Select
                value={horaInicial}
                onValueChange={(novaHora) => {
                  const minutoFinal = minutoInicial || "00"
                  setHorario(`${novaHora}:${minutoFinal}`)
                }}
              >
                <SelectTrigger className="h-8 w-[4.5rem] border-0 bg-transparent px-1 text-foreground shadow-none ring-0 focus:ring-0 cursor-pointer dark:bg-transparent">
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" sideOffset={4} collisionPadding={16} avoidCollisions className="w-[4.5rem] max-h-56 overflow-hidden rounded-xl border border-border bg-popover/95 text-popover-foreground shadow-xl backdrop-blur">
                  {horas.map((hora) => (
                    <SelectItem key={hora} value={hora} className="cursor-pointer">
                      {hora}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-sm font-medium text-muted-foreground">:</span>

            <div className="flex h-10 items-center rounded-lg bg-muted px-2">
              <Select
                value={minutoInicial}
                onValueChange={(novoMinuto) => {
                  const horaFinal = horaInicial || "00"
                  setHorario(`${horaFinal}:${novoMinuto}`)
                }}
              >
                <SelectTrigger className="h-8 w-[4.5rem] border-0 bg-transparent px-1 text-foreground shadow-none ring-0 focus:ring-0 cursor-pointer dark:bg-transparent">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" sideOffset={4} collisionPadding={16} avoidCollisions className="w-[4.5rem] max-h-56 overflow-hidden rounded-xl border border-border bg-popover/95 text-popover-foreground shadow-xl backdrop-blur">
                  {minutos.map((minuto) => (
                    <SelectItem key={minuto} value={minuto} className="cursor-pointer">
                      {minuto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="descricao-evento" className="text-foreground">Descrição (opcional)</Label>
          <Textarea
            id="descricao-evento"
            placeholder="Detalhes do evento"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            rows={3}
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-2 transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button
          onClick={cancelaAgendamento}
          variant="outline"
          className="border-border bg-background text-foreground hover:bg-muted cursor-pointer transition-colors"
        >
          Cancelar
        </Button>
        <Button
          onClick={adicionarEvento}
          disabled={!titulo.trim() || salvandoEvento || !usaSupabase}
          className="cursor-pointer transition-colors"
        >
          {salvandoEvento ? "Salvando..." : "Marcar evento"}
        </Button>
      </div>
    </div>
  )
}