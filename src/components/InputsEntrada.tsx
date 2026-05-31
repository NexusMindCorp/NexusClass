import { Field, FieldDescription, FieldLabel } from "./ui/field"
import { Input } from "./ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select"

type InputsAcordoProps = {
	titulo: string
	id: string
	nome: string
	escritoNoInputbox: string
	tipo?: string
	decricao?: string
	required?: boolean
	textArea?: boolean
	inputOption?: Array<{
		label: string
		value: string
	}>
}

export function InputsEntrada({
	titulo,
	id,
	nome,
	escritoNoInputbox,
	tipo = "text",
	decricao,
	required = false,
	textArea = false,
	inputOption,
}: InputsAcordoProps) {
	return (
		<Field>
			<FieldLabel htmlFor={id} className="text-white">
				{titulo}
			</FieldLabel>
			{inputOption ? (
				<Select name={nome} required={required} defaultValue="">
					<SelectTrigger id={id}>
						<SelectValue placeholder={escritoNoInputbox} />
					</SelectTrigger>
					<SelectContent>
						{inputOption.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			) : textArea ? (
				<textarea
					id={id}
					name={nome}
					placeholder={escritoNoInputbox}
					rows={6}
					className="min-h-[160px] w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 outline-none transition-[color,box-shadow] focus-visible:border-white/30 focus-visible:ring-[3px] focus-visible:ring-white/20"
					required={required}
				/>
			) : (
				<Input
					id={id}
					name={nome}
					type={tipo}
					placeholder={escritoNoInputbox}
					className="h-11 border-white/15 bg-white/10 px-4 text-white placeholder:text-white/45"
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