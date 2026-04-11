import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Mail, PhoneCall, ShieldCheck } from "lucide-react"
export function BoxAuxiliarSugestao() {
    return (
        <div className="space-y-6">
					<Card className="border-white/10 bg-slate-950/40 text-white shadow-2xl backdrop-blur-xl">
						<CardHeader>
							<CardTitle className="text-xl text-white">Canais de atendimento</CardTitle>
							<CardDescription className="text-white/70">
								Use estes canais quando precisar de ajuda rápida.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
								<div className="rounded-lg bg-white/10 p-2 text-white">
									<Mail className="h-5 w-5" />
								</div>
								<div>
									<p className="font-medium text-white">Email de suporte</p>
									<p className="text-sm text-white/70">Você pode receber retorno pelo endereço informado no formulário.</p>
								</div>
							</div>

							<div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
								<div className="rounded-lg bg-white/10 p-2 text-white">
									<PhoneCall className="h-5 w-5" />
								</div>
								<div>
									<p className="font-medium text-white">Atendimento urgente</p>
									<p className="text-sm text-white/70">Informe se o problema impede o acesso à conta ou a uma aula.</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-emerald-400/20 bg-emerald-500/10 text-white shadow-xl backdrop-blur-xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-xl text-white">
								<ShieldCheck className="h-5 w-5" />
								Dica para agilizar
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm leading-relaxed text-white/85">
								Inclua a tela em que o erro aconteceu, o texto exibido e, se possível, um passo a passo curto para reproduzir o problema. Isso reduz o tempo de resposta.
							</p>
						</CardContent>
					</Card>
				</div>
    )
}