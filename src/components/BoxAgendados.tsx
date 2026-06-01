import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type EventoCalendario = {
	id: string
	titulo: string
	descricao: string
	data: string
	horario: string
}

type BoxAgendadosProps = {
	date: Date | undefined
	carregandoEventos: boolean
	eventosDoDia: EventoCalendario[]
	removerEvento: (id: string) => void
}

export function BoxAgendados({
	date,
	carregandoEventos,
	eventosDoDia,
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
				<Badge variant="outline" className="border-border bg-muted text-muted-foreground">
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
					{eventosDoDia.map((evento) => (
						<div
							key={evento.id}
							className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3 shadow-sm transition-colors"
						>
							<div className="space-y-1">
								<p className="text-sm font-medium text-foreground">{evento.titulo}</p>
								{evento.horario ? (
									<p className="text-xs text-muted-foreground">
										Horário: {evento.horario}
									</p>
								) : null}
								{evento.descricao ? (
									<p className="whitespace-pre-wrap text-sm text-muted-foreground">
										{evento.descricao}
									</p>
								) : null}
							</div>
							<Button
								variant="outline"
								size="sm"
								className="border-border bg-background text-foreground hover:bg-destructive hover:text-destructive-foreground cursor-pointer transition-colors"
								onClick={() => removerEvento(evento.id)}
							>
								Remover
							</Button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}