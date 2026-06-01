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
		<div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
			<div className="flex items-center justify-between">
				<p className="text-sm font-semibold text-slate-900 dark:text-white">
					{date
						? `Eventos de ${format(date, "dd/MM/yyyy")}`
						: `Eventos de ${format(new Date(), "dd/MM/yyyy")}`}
				</p>
				<Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 dark:border-white/20 dark:bg-white/5 dark:text-white">
					{eventosDoDia.length}
				</Badge>
			</div>

			{carregandoEventos ? (
				<p className="text-sm text-slate-600 dark:text-muted-foreground">Carregando eventos...</p>
			) : null}

			{eventosDoDia.length === 0 ? (
				<p className="text-sm text-slate-600 dark:text-muted-foreground">
					Nenhum evento cadastrado para este dia.
				</p>
			) : (
				<div className="space-y-2">
					{eventosDoDia.map((evento) => (
						<div
							key={evento.id}
							className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.02]"
						>
							<div className="space-y-1">
								<p className="text-sm font-medium text-slate-900 dark:text-white">{evento.titulo}</p>
								{evento.horario ? (
									<p className="text-xs text-slate-600 dark:text-muted-foreground">
										Horario: {evento.horario}
									</p>
								) : null}
								{evento.descricao ? (
									<p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-muted-foreground">
										{evento.descricao}
									</p>
								) : null}
							</div>
							<Button
								variant="outline"
								size="sm"
								className="border-slate-200 bg-white text-slate-900 hover:bg-slate-100 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
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
