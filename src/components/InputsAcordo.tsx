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
	textArea?: boolean
	inputOption?: Array<{
		label: string
		value: string
	}>
}

export function InputsAcordo({
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
				<select
					id={id}
					name={nome}
					defaultValue=""
					className="border-white/15 bg-white/10 text-white placeholder:text-white/45 h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-white/30 focus-visible:ring-white/20 focus-visible:ring-[3px] md:text-sm"
					required={required}
				>
					<option value="" disabled>
						{escritoNoInputbox}
					</option>
					{inputOption.map((option) => (
						<option key={option.value} value={option.value} className="bg-slate-950 text-white">
							{option.label}
						</option>
					))}
				</select>
			) : textArea ? (
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
