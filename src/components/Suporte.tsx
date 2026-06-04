import { Send, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, FieldSet } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { useSuporte } from "@/hooks/useSuporte"
import { AnexoArquivo } from "@/components/AnexoArquivo"
import { InputsEntrada } from "@/components/InputsEntrada"
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
		perfil
	} = useSuporte()

	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 lg:px-8">
			<div className="mb-6 space-y-2">
				<div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground backdrop-blur">
					<Sparkles className="h-4 w-4 text-primary" />
					Suporte
				</div>
				<h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
					Fale com a equipe de suporte
				</h1>
				<p className="max-w-2xl text-sm text-muted-foreground md:text-base">
					Envie sua dúvida, problema técnico ou solicitação. Use o formulário abaixo para registrar o contato com mais contexto. Seu nome e email serão do seu perfil cadastrado  para que possamos responder. Quanto mais detalhes, melhor!
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
				<Card className="border-border bg-card text-card-foreground shadow-2xl backdrop-blur-xl">
					<CardHeader className="pb-2">
						<CardTitle className="text-xl text-foreground">Abrir chamado</CardTitle>
						<CardDescription className="text-muted-foreground">
							Resposta mais rápida quando você descreve o que aconteceu e em qual tela o erro apareceu.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
							<FieldSet>
												<FieldGroup className="gap-5">
																		{/* If we have a logged-in profile, show name/email and skip rendering those inputs */}
																		{perfil && (
																			<div className="space-y-1">
																				<div className="text-sm text-muted-foreground">Nome</div>
																				<div className="text-foreground font-medium">{perfil.nome}</div>
																				<div className="text-sm text-muted-foreground mt-2">Email</div>
																				<div className="text-foreground font-medium">{perfil.email}</div>
																			</div>
																		)}

																		{formFields.filter((f) => f.key !== 'name' && f.key !== 'email').map((field) => (
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

							<div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
								<p className="text-sm text-muted-foreground">
									Seu pedido será enviado com os dados do formulário para o time de suporte.
								</p>
								<Button
									type="submit"
									disabled={sending}
									className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
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