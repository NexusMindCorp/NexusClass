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
	)
}
