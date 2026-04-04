import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useCalendario } from "@/hooks/useCalendario"
import { BoxAgendamento } from "./BoxAgendamento"
import { BoxAgendados } from "./BoxAgendados"

export function Calendario() {
  const {
    usaSupabase,
    date,
    selecionarDataCalendario,
    mostrarBoxAgendamento,
    cancelarAgendamento,
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
          onSelect={selecionarDataCalendario}
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

        {!mostrarBoxAgendamento ? (
          <p className="text-sm text-muted-foreground text-center">
            Selecione um dia no calendario para adicionar um evento.
          </p>
        ) : (
          <BoxAgendamento
            cancelaAgendamento={cancelarAgendamento}
            usaSupabase={usaSupabase}
            date={date}
            titulo={titulo}
            setTitulo={setTitulo}
            descricao={descricao}
            setDescricao={setDescricao}
            horario={horario}
            setHorario={setHorario}
            salvandoEvento={salvandoEvento}
            erroBanco={erroBanco}
            adicionarEvento={adicionarEvento}
            />
        )}

        <BoxAgendados
          date={date}
          carregandoEventos={carregandoEventos}
          eventosDoDia={eventosDoDia}
          removerEvento={removerEvento}
        />
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
