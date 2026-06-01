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
			<FieldLabel htmlFor={id} className="text-slate-900 dark:text-white">
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
					className="min-h-[160px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition-[color,box-shadow] focus-visible:border-slate-300 focus-visible:ring-[3px] focus-visible:ring-indigo-500/20 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45 dark:focus-visible:border-white/30 dark:focus-visible:ring-white/20"
					required={required}
				/>
			) : (
				<Input
					id={id}
					name={nome}
					type={tipo}
					placeholder={escritoNoInputbox}
					className="h-11 border-slate-200 bg-white px-4 text-slate-900 placeholder:text-slate-400 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45"
					required={required}
				/>
			)}
			{decricao && (
				<FieldDescription className="text-slate-600 dark:text-white/65">
					{decricao}
				</FieldDescription>
			)}
		</Field>
	)
}