import { useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Mail, PhoneCall, Send, ShieldCheck, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { sendContactEmail } from "@/hooks/useSuporte"
import { AnexoArquivo } from "@/components/AnexoArquivo"

export function Suporte() {
	const formRef = useRef<HTMLFormElement | null>(null)
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const [sending, setSending] = useState(false)
	const [attachedFiles, setAttachedFiles] = useState<File[]>([])

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		setAttachedFiles(Array.from(event.target.files ?? []))
	}

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (!formRef.current) return

		setSending(true)

		try {
			await sendContactEmail(formRef.current)
			toast.success("Mensagem enviada com sucesso.")
			formRef.current.reset()
			setAttachedFiles([])
			if (fileInputRef.current) fileInputRef.current.value = ""
		} catch (error) {
			console.error(error)
			toast.error("Não foi possível enviar sua mensagem. Tente novamente.")
		} finally {
			setSending(false)
		}
	}

	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 lg:px-8">
			<div className="mb-6 space-y-2">
				<div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-white backdrop-blur">
					<Sparkles className="h-4 w-4" />
					Suporte
				</div>
				<h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
					Fale com a equipe de suporte
				</h1>
				<p className="max-w-2xl text-sm text-white/80 md:text-base">
					Envie sua dúvida, problema técnico ou solicitação. Use o formulário abaixo para registrar o contato com mais contexto.
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
				<Card className="border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
					<CardHeader className="pb-2">
						<CardTitle className="text-xl text-white">Abrir chamado</CardTitle>
						<CardDescription className="text-white/70">
							Resposta mais rápida quando você descreve o que aconteceu e em qual tela o erro apareceu.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
							<FieldSet>
								<FieldGroup className="gap-5">
									<Field>
										<FieldLabel htmlFor="from_name" className="text-white">
											Seu nome
										</FieldLabel>
										<Input
											id="from_name"
											name="from_name"
											type="text"
											placeholder="Ex: Maria Souza"
											className="border-white/15 bg-white/10 text-white placeholder:text-white/45"
											required
										/>
										<FieldDescription className="text-white/65">
											Nome de quem está solicitando o suporte.
										</FieldDescription>
									</Field>

									<Field>
										<FieldLabel htmlFor="from_email" className="text-white">
											E-mail
										</FieldLabel>
										<Input
											id="from_email"
											name="from_email"
											type="email"
											placeholder="voce@exemplo.com"
											className="border-white/15 bg-white/10 text-white placeholder:text-white/45"
											required
										/>
										<FieldDescription className="text-white/65">
											Usado para retorno da equipe.
										</FieldDescription>
									</Field>

									<Field>
										<FieldLabel htmlFor="subject" className="text-white">
											Assunto
										</FieldLabel>
										<Input
											id="subject"
											name="subject"
											type="text"
											placeholder="Ex: Erro ao abrir o chat"
											className="border-white/15 bg-white/10 text-white placeholder:text-white/45"
											required
										/>
										<FieldDescription className="text-white/65">
											Seja direto para facilitar a triagem.
										</FieldDescription>
									</Field>

									<Field>
										<FieldLabel htmlFor="message" className="text-white">
											Mensagem
										</FieldLabel>
										<Textarea
											id="message"
											name="message"
											placeholder="Descreva o problema, passos para reproduzir e o que você esperava acontecer."
											rows={6}
											className="border-white/15 bg-white/10 text-white placeholder:text-white/45"
											required
										/>
										<input
											ref={fileInputRef}
											id="attachments"
											name="attachments"
											type="file"
											multiple
											onChange={handleFileChange}
											className="hidden"
										/>
										<AnexoArquivo fileInputRef={fileInputRef} attachedFiles={attachedFiles} />
										<FieldDescription className="text-white/65">
											Inclua prints, tela afetada e horário, se possível.
										</FieldDescription>
									</Field>
								</FieldGroup>
							</FieldSet>

							<div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
								<p className="text-sm text-white/70">
									Seu pedido será enviado com os dados do formulário para o time de suporte.
								</p>
								<Button
									type="submit"
									disabled={sending}
									className="bg-white text-slate-950 hover:bg-white/90"
								>
									<Send className="h-4 w-4" />
									{sending ? "Enviando..." : "Enviar mensagem"}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

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
			</div>
		</div>
	)
}

