import { Upload } from "lucide-react"
import type { ChangeEvent } from "react"
import type { RefObject } from "react"
import { Button } from "./ui/button"

type AnexoArquivoProps = {
	fileInputRef: RefObject<HTMLInputElement | null>
	attachedFiles: File[]
	onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export function AnexoArquivo({ fileInputRef, attachedFiles, onFileChange }: AnexoArquivoProps) {
	return (
		<>
			<input
				ref={fileInputRef}
				id="attachments"
				name="attachments"
				type="file"
				multiple
				onChange={onFileChange}
				className="hidden"
			/>
			<Button
				type="button"
				className="bg-red-500 text-slate-950 hover:bg-white/90"
				onClick={() => fileInputRef.current?.click()}
			>
				<Upload /> Anexar arquivos
			</Button>

			{attachedFiles.length > 0 && (
				<p className="text-xs text-white/70">
					{attachedFiles.length === 1
						? `1 arquivo selecionado: ${attachedFiles[0].name}`
						: `${attachedFiles.length} arquivos selecionados`}
				</p>
			)}
		</>
	)
}