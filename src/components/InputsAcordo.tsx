import { Field, FieldDescription, FieldLabel } from "./ui/field"
import { Input } from "./ui/input"

type InputsAcordoProps = {
	titulo: string
	id: string
	nome: string
	escritoNoInputbox: string
	tipo?: string
	decricao?: string
	required?: boolean
    textArea?:boolean
}

export function InputsAcordo({
	titulo,
	id,
	nome,
	escritoNoInputbox,
	tipo = "text",
	decricao,
	required = false,
	textArea = false
}: InputsAcordoProps) {
	return (
		<Field>
			<FieldLabel htmlFor={id} className="text-white">
				{titulo}
			</FieldLabel>
			{textArea ? (
				<textarea
					id={id}
					name={nome}
					placeholder={escritoNoInputbox}
					rows={6}
					className="rounded-xl border-white/15 bg-white/10 text-white placeholder:text-white/45"
					required={required}
				/>
			) : (
				<Input
					id={id}
					name={nome}
					type={tipo}
					placeholder={escritoNoInputbox}
					className="border-white/15 bg-white/10 text-white placeholder:text-white/45"
					required={required}
				/>
			)}
			{decricao && (
				<FieldDescription className="text-white/65">
					{decricao}
				</FieldDescription>
			)}
		</Field>
	)
}
