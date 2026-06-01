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
    sobreEvento,
    setSobreEvento,
    processamentoEvento,
    erroBanco,
    datasComEvento,
    eventosDoDia,
    adicionarEvento,
    removerEvento,
    selecionarDataRelativa,
  } = useCalendario()

  return (
    <Card className="mx-auto h-fit w-full max-w-5xl border-slate-200 bg-white shadow-2xl backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      <CardContent className="space-y-5 p-4 md:p-5">
        <div className="grid gap-4 xl:grid-cols-[auto_1fr] xl:items-start">
          <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm md:p-3 dark:border-white/10 dark:bg-white/5">
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
              className="p-2 [--cell-size:--spacing(10)] md:[--cell-size:--spacing(11)]"
            />
          </div>

          <div className="space-y-4">
            {!mostrarBoxAgendamento ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-white/20 dark:bg-white/[0.03]">
                <p className="text-sm text-slate-600 dark:text-muted-foreground">
                  Selecione um dia no calendario para adicionar um evento.
                </p>
              </div>
            ) : (
              <BoxAgendamento
                cancelaAgendamento={cancelarAgendamento}
                usaSupabase={usaSupabase}
                date={date}
                titulo={sobreEvento.titulo}
                setTitulo={(titulo) =>
                  setSobreEvento((anterior) => ({ ...anterior, titulo }))
                }
                descricao={sobreEvento.descricao}
                setDescricao={(descricao) =>
                  setSobreEvento((anterior) => ({ ...anterior, descricao }))
                }
                horario={sobreEvento.horario}
                setHorario={(horario) =>
                  setSobreEvento((anterior) => ({ ...anterior, horario }))
                }
                salvandoEvento={processamentoEvento.salvandoEvento}
                erroBanco={erroBanco}
                adicionarEvento={adicionarEvento}
              />
            )}

            <BoxAgendados
              date={date}
              carregandoEventos={processamentoEvento.carregandoEventos}
              eventosDoDia={eventosDoDia}
              removerEvento={removerEvento}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 border-t border-slate-200 p-4 md:p-5 dark:border-white/10">
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
            className="min-w-[100px] flex-1 border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            onClick={() => selecionarDataRelativa(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </CardFooter>
    </Card>
  )
}
