import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCalendario } from "@/hooks/useCalendario"

export function Calendario() {
  const {
    usaSupabase,
    date,
    setDate,
    currentMonth,
    setCurrentMonth,
    titulo,
    setTitulo,
    descricao,
    setDescricao,
    horario,
    setHorario,
    carregandoEventos,
    salvandoEvento,
    erroBanco,
    datasComEvento,
    eventosDoDia,
    adicionarEvento,
    removerEvento,
    selecionarDataRelativa,
  } = useCalendario()

  return (
    <Card className="w-full max-w-2xl mx-auto h-fit shadow-md">

      <CardContent className="p-4 space-y-4">
        <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          modifiers={{ comEvento: datasComEvento }}
          modifiersClassNames={{
            comEvento:
              "bg-primary/15 rounded-md [&_button]:border [&_button]:border-primary/40",
          }}
          fixedWeeks
          className="p-2"
        />
        </div>

        {!date ? (
          <p className="text-sm text-muted-foreground text-center">
            Selecione um dia no calendario para adicionar um evento.
          </p>
        ) : (
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
              {`Novo evento em ${format(date, "dd/MM/yyyy")}`}
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
              onClick={adicionarEvento}
              disabled={!titulo.trim() || salvandoEvento || !usaSupabase}
            >
              {salvandoEvento ? "Salvando..." : "Marcar evento"}
            </Button>
          </div>
        )}

        <div className="rounded-md border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {date
                ? `Eventos de ${format(date, "dd/MM/yyyy")}`
                : `Eventos de ${format(new Date(), "dd/MM/yyyy")}`}
            </p>
            <Badge variant="outline">{eventosDoDia.length}</Badge>
          </div>

          {carregandoEventos ? (
            <p className="text-sm text-muted-foreground">Carregando eventos...</p>
          ) : null}

          {eventosDoDia.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum evento cadastrado para este dia.
            </p>
          ) : (
            <div className="space-y-2">
              {eventosDoDia.map((evento) => (
                <div
                  key={evento.id}
                  className="rounded-md border p-2 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{evento.titulo}</p>
                    {evento.horario ? (
                      <p className="text-xs text-muted-foreground">
                        Horario: {evento.horario}
                      </p>
                    ) : null}
                    {evento.descricao ? (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {evento.descricao}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removerEvento(evento.id)}
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 border-t p-4">
        {[
          { label: "Hoje", value: 0 },
          { label: "Amanhã", value: 1 },
          { label: "Em 3 dias", value: 3 },
          { label: "Em 1 semana", value: 7 },
          { label: "Em 2 semanas", value: 14 },
        ].map((preset) => (
          <Button
            key={preset.value}
            variant="outline"
            size="sm"
            className="flex-1 min-w-[100px]"
            onClick={() => selecionarDataRelativa(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </CardFooter>
    </Card>
  )
}
