import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { TurmaProps } from "@/hooks/LeituraDataHooks/type";

type EventoCalendario = {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  horario: string;
  tipo: "pessoal" | "turma";
  turma_id: string | null;
  autor_id: string;
};

type BoxAgendadosProps = {
  perfil: PerfilUsuario;
  date: Date | undefined;
  carregandoEventos: boolean;
  eventosDoDia: EventoCalendario[];
  turmasGlobais: Record<string, TurmaProps>;
  removerEvento: (id: string) => void;
};

export function BoxAgendados({
  perfil,
  date,
  carregandoEventos,
  eventosDoDia,
  turmasGlobais,
  removerEvento,
}: BoxAgendadosProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          {date
            ? `Eventos de ${format(date, "dd/MM/yyyy")}`
            : `Eventos de ${format(new Date(), "dd/MM/yyyy")}`}
        </p>
        <Badge
          variant="outline"
          className="border-border bg-muted text-muted-foreground"
        >
          {eventosDoDia.length}
        </Badge>
      </div>

      {carregandoEventos ? (
        <p className="text-sm text-muted-foreground">Carregando eventos...</p>
      ) : null}

      {eventosDoDia.length === 0 && !carregandoEventos ? (
        <p className="text-sm text-muted-foreground">
          Nenhum evento cadastrado para este dia.
        </p>
      ) : (
        <div className="space-y-2">
          {eventosDoDia.map((evento) => {
            const ehEventoTurma = evento.tipo === "turma";
            const podeRemover =
              evento.tipo === "pessoal" || perfil.role !== "aluno";
            const nomeTurma = evento.turma_id
              ? turmasGlobais[evento.turma_id]?.materia
              : null;
            const textoBadge = ehEventoTurma
              ? `Turma: ${nomeTurma || "Turma não encontrada"}`
              : "Pessoal";
            const classesEvento = ehEventoTurma
              ? {
                  card: "border-l-primary bg-primary/5 dark:bg-primary/10",
                  badge:
                    "border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/15 dark:text-primary-foreground",
                }
              : {
                  card: "border-l-violet-500 bg-violet-500/5 dark:bg-violet-500/10",
                  badge:
                    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:border-violet-400/35 dark:bg-violet-400/10 dark:text-violet-200",
                };

            return (
              <div
                key={evento.id}
                className={`flex items-start justify-between gap-3 rounded-lg border border-border p-3 shadow-sm transition-colors border-l-4 ${classesEvento.card}`}
              >
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-foreground">
                      {evento.titulo}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] py-0 h-4 ${classesEvento.badge}`}
                    >
                      {textoBadge}
                    </Badge>
                  </div>

                  {evento.horario ? (
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      Horário: {evento.horario.slice(0, 5)}
                    </p>
                  ) : null}

                  {evento.descricao ? (
                    <p className="whitespace-pre-wrap text-xs text-muted-foreground/80 mt-1">
                      {evento.descricao}
                    </p>
                  ) : null}
                </div>

                {podeRemover && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/30 bg-background/80 text-destructive shadow-sm hover:border-destructive hover:bg-destructive/10 hover:text-destructive dark:bg-background/40 dark:text-destructive dark:hover:bg-destructive/15 cursor-pointer transition-colors"
                    onClick={() => removerEvento(evento.id)}
                  >
                    Remover
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
