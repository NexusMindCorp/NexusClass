import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useCalendario } from "@/hooks/CalendarioHooks/useCalendario";
import { BoxAgendamento } from "./BoxAgendamento";
import { BoxAgendados } from "./BoxAgendados";
import type { CalendarioProps } from "@/hooks/CalendarioHooks/type";
import { comparaDataHj } from "@/lib/utils";

export function Calendario({
  perfil,
  inscricoes,
  turmasGlobais,
}: CalendarioProps) {
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
    datasComEventoPessoal,
    datasComEventoTurma,
    datasComEventosMistos,
    eventosDoDia,
    adicionarEvento,
    removerEvento,
    selecionarDataRelativa,
  } = useCalendario({ perfil, inscricoes, turmasGlobais });

  const turmasInscritas = Object.keys(inscricoes)
    .filter((key) => inscricoes[key])
    .map((key) => ({
      id: key,
      nome: turmasGlobais[key]?.materia || key,
    }));

  const todasTurmas = Object.keys(turmasGlobais).map((key) => ({
    id: key,
    nome: turmasGlobais[key]?.materia || key,
  }));

  const isMaster = perfil?.role === "master";

  return (
    <Card className="mx-auto h-fit w-full max-w-5xl gap-0 overflow-hidden border-border bg-card py-0 text-card-foreground shadow-2xl backdrop-blur-sm">
      <CardContent className="min-w-0 space-y-4 p-2 sm:p-4 md:p-5">
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(280px,auto)_minmax(0,1fr)] lg:items-start xl:gap-4">
          <div className="min-w-0 rounded-xl border border-border bg-background p-1 shadow-sm sm:p-2 md:p-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={selecionarDataCalendario}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              modifiers={{
                eventoPessoal: datasComEventoPessoal,
                eventoTurma: datasComEventoTurma,
                eventosMistos: datasComEventosMistos,
              }}
              modifiersClassNames={{
                eventoPessoal:
                  "rounded-md bg-violet-500/15 text-violet-700 dark:text-violet-100 [&_button]:border [&_button]:border-violet-500/40 [&_button]:bg-violet-500/10 [&_button]:hover:bg-violet-500/20",
                eventoTurma:
                  "rounded-md bg-primary/15 text-primary dark:text-primary-foreground [&_button]:border [&_button]:border-primary/45 [&_button]:bg-primary/10 [&_button]:hover:bg-primary/20",
                eventosMistos:
                  "rounded-md bg-[linear-gradient(135deg,rgba(139,92,246,0.24)_0%,rgba(236,72,153,0.24)_100%)] text-foreground [&_button]:border [&_button]:border-primary/50 [&_button]:bg-transparent [&_button]:hover:bg-primary/15",
              }}
              classNames={{
                root: "w-full",
                months: "relative flex w-full flex-col",
                month: "flex w-full flex-col gap-3",
                month_grid: "w-full border-collapse",
                weekdays: "flex gap-0.5 sm:gap-1",
                week: "mt-1.5 flex w-full gap-0.5 sm:mt-2 sm:gap-1",
              }}
              fixedWeeks
              className="w-full p-1 [--cell-size:--spacing(8)] sm:p-2 sm:[--cell-size:--spacing(9)] md:[--cell-size:--spacing(10)]"
            />
            <div className="flex flex-wrap gap-2 px-2 pb-1 pt-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                Pessoal
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                Turma
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border border-primary/40 bg-[linear-gradient(90deg,#8b5cf6_0_50%,#ec4899_50%_100%)]" />
                Ambos
              </span>
            </div>
          </div>

          <div className="min-w-0 space-y-3 sm:space-y-4">
            {!mostrarBoxAgendamento || !comparaDataHj(date) ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Selecione um dia no calendário para adicionar um evento.
                </p>
              </div>
            ) : (
              <BoxAgendamento
                perfil={perfil}
                turmasDisponiveis={isMaster ? todasTurmas : turmasInscritas}
                tipo={sobreEvento.tipo}
                setTipo={(tipo) => setSobreEvento((ant) => ({ ...ant, tipo }))}
                turmaSelecionada={sobreEvento.turmaSelecionada}
                setTurmaSelecionada={(turmaSelecionada) =>
                  setSobreEvento((ant) => ({ ...ant, turmaSelecionada }))
                }
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
              perfil={perfil}
              date={date}
              carregandoEventos={processamentoEvento.carregandoEventos}
              eventosDoDia={eventosDoDia}
              turmasGlobais={turmasGlobais}
              removerEvento={removerEvento}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-2 border-t border-border p-3 sm:flex sm:flex-wrap sm:p-4 md:p-5">
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
            className="min-w-0 border-border bg-background text-foreground transition-colors hover:bg-muted sm:min-w-[100px] sm:flex-1 cursor-pointer"
            onClick={() => selecionarDataRelativa(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </CardFooter>
    </Card>
  );
}
