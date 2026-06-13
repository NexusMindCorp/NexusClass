import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useCalendario } from "@/hooks/useCalendario"
import { BoxAgendamento } from "./BoxAgendamento"
import { BoxAgendados } from "./BoxAgendados"
import type { PerfilUsuario } from "@/hooks/useAuth"
import type { TurmaProps } from "@/hooks/leituraJson"

type CalendarioProps = {
  perfil: PerfilUsuario;
  inscricoes: Record<string, boolean>;
  turmasGlobais: Record<string, TurmaProps>;
};

export function Calendario({ perfil, inscricoes, turmasGlobais }: CalendarioProps) {
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
  } = useCalendario({ perfil, inscricoes, turmasGlobais })

  const turmasInscritas = Object.keys(inscricoes).map(key => ({
    id: key,
    nome: turmasGlobais[key]?.materia || key,
  }))

  const todasTurmas = Object.keys(turmasGlobais).map(key => ({
    id: key,
    nome: turmasGlobais[key]?.materia || key,
  }))

  const isMaster = perfil?.role === "master";

  return (
    <Card className="mx-auto h-fit w-full max-w-5xl border-border bg-card text-card-foreground shadow-2xl backdrop-blur-sm">
      <CardContent className="space-y-5 p-4 md:p-5">
        <div className="grid gap-4 xl:grid-cols-[auto_1fr] xl:items-start">
          <div className="rounded-xl border border-border bg-background p-2 shadow-sm md:p-3">
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
                weekdays: "flex gap-1",
                week: "flex w-full gap-1 mt-2",
              }}
              fixedWeeks
              className="p-2 [--cell-size:--spacing(10)] md:[--cell-size:--spacing(11)]"
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

          <div className="space-y-4">
            {!mostrarBoxAgendamento ? (
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
                setTurmaSelecionada={(turmaSelecionada) => setSobreEvento((ant) => ({ ...ant, turmaSelecionada }))}
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

      <CardFooter className="flex flex-wrap gap-2 border-t border-border p-4 md:p-5">
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
            className="min-w-[100px] flex-1 border-border bg-background text-foreground hover:bg-muted transition-colors cursor-pointer"
            onClick={() => selecionarDataRelativa(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </CardFooter>
    </Card>
  )
}
