import {Send, Sparkles } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, FieldSet } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { useSuporte } from "@/hooks/useSuporte"
import { AnexoArquivo } from "@/components/AnexoArquivo"
import { InputsEntrada} from "@/components/InputsEntrada"
import { BoxAuxiliarSugestao } from "@/components/BoxAuxiliarSugestao"
export function Suporte() {
	const {
		formRef,
		fileInputRef,
		sending,
		attachedFiles,
		handleFileChange,
		handleSubmit,
		formFields,
	} = useSuporte()

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
									{formFields.map((field) => (
										<InputsEntrada
											key={field.key}
											titulo={field.titulo}
											id={field.id}
											nome={field.nome}
											escritoNoInputbox={field.escritoNoInputbox}
											decricao={field.decricao}
											tipo={field.tipo}
											textArea={field.textArea}
											inputOption={field.inputOption}
											required={field.required}
										/>
									))}

									<AnexoArquivo
										fileInputRef={fileInputRef}
										attachedFiles={attachedFiles}
										onFileChange={handleFileChange}
									/>
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
				<BoxAuxiliarSugestao />
			</div>
		</div>
	)
}

