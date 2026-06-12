import { useState, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, X, Upload } from "lucide-react"

type BoxAtividadeProps = {
    materia: string
    aberto: boolean
    onClose: () => void
    onPublicar: (titulo: string, descricao: string, dataEntrega: string | null, arquivo: File | null) => Promise<void>
}

export function BoxAtividade({ materia, aberto, onClose, onPublicar }: BoxAtividadeProps) {
    const [titulo, setTitulo] = useState("")
    const [descricao, setDescricao] = useState("")
    const [dataEntrega, setDataEntrega] = useState("")
    const [arquivo, setArquivo] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    if (!aberto) return null

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setArquivo(e.target.files[0])
        }
    }

    const handleConfirm = async () => {
        if (!titulo.trim() || !descricao.trim()) return

        try {
            setLoading(true)
            await onPublicar(titulo, descricao, dataEntrega || null, arquivo)
            setTitulo("")
            setDescricao("")
            setDataEntrega("")
            setArquivo(null)
            onClose()
        } catch (err) {
            console.error("Erro ao criar atividade:", err)
        } finally {
            setLoading(false)
        }
    }

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <Card className="relative w-full max-w-xl p-6 shadow-2xl border border-border bg-card text-card-foreground">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10 cursor-pointer"
                >
                    <X className="h-5 w-5" />
                </button>

                <h2 className="text-xl font-bold tracking-tight mb-4">Nova Atividade para {materia}</h2>

                <FieldSet>
                    <FieldGroup className="space-y-4">
                        <Field>
                            <FieldLabel htmlFor="atividade-titulo">Título da Atividade</FieldLabel>
                            <input
                                id="atividade-titulo"
                                type="text"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="Ex: Exercícios de Fixação..."
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                            />
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="atividade-descricao">Descrição / Instruções</FieldLabel>
                            <Textarea
                                id="atividade-descricao"
                                placeholder="Escreva as instruções para a atividade..."
                                rows={4}
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                            />
                        </Field>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel htmlFor="atividade-data">Data de Entrega</FieldLabel>
                                <input
                                    id="atividade-data"
                                    type="datetime-local"
                                    value={dataEntrega}
                                    onChange={(e) => setDataEntrega(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                                />
                            </Field>

                            <Field className="flex flex-col justify-end">
                                <FieldLabel>Anexo</FieldLabel>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full justify-start cursor-pointer"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {arquivo ? "Trocar arquivo" : "Selecionar arquivo"}
                                    </Button>
                                </div>
                                {arquivo && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                        {arquivo.name}
                                    </p>
                                )}
                            </Field>
                        </div>
                    </FieldGroup>
                </FieldSet>

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={!titulo.trim() || !descricao.trim() || loading}>
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Criando...
                            </>
                        ) : (
                            "Publicar Atividade"
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    )

    return createPortal(modalContent, document.body)
}
