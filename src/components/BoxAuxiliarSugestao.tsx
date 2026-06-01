import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Mail, PhoneCall, ShieldCheck } from "lucide-react"
export function BoxAuxiliarSugestao() {
	return (
		<div className="space-y-6">
			<Card className="border-slate-200 bg-white text-slate-900 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 dark:text-white">
				<CardHeader>
					<CardTitle className="text-xl text-slate-900 dark:text-white">Canais de atendimento</CardTitle>
					<CardDescription className="text-slate-600 dark:text-white/70">
						Use estes canais quando precisar de ajuda rápida.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
						<div className="rounded-lg bg-slate-100 p-2 text-slate-900 dark:bg-white/10 dark:text-white">
							<Mail className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-slate-900 dark:text-white">Email de suporte</p>
							<p className="text-sm text-slate-600 dark:text-white/70">Você pode receber retorno pelo endereço informado no formulário.</p>
						</div>
					</div>

					<div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
						<div className="rounded-lg bg-slate-100 p-2 text-slate-900 dark:bg-white/10 dark:text-white">
							<PhoneCall className="h-5 w-5" />
						</div>
						<div>
							<p className="font-medium text-slate-900 dark:text-white">Atendimento urgente</p>
							<p className="text-sm text-slate-600 dark:text-white/70">Informe se o problema impede o acesso à conta ou a uma aula.</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border-emerald-300 bg-emerald-200 text-slate-900 shadow-xl backdrop-blur-xl dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-white">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-white">
						<ShieldCheck className="h-5 w-5" />
						Dica para agilizar
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm leading-relaxed text-slate-600 dark:text-white/85">
						Inclua a tela em que o erro aconteceu, o texto exibido e, se possível, um passo a passo curto para reproduzir o problema. Isso reduz o tempo de resposta.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}