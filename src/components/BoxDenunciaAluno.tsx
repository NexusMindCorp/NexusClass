import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { useDenuncia } from "@/hooks/useDenuncia"

type BoxDenunciaAlunoProps = {
    aluno: string
    onClose: () => void
}

export function BoxDenunciaAluno({ aluno, onClose }: BoxDenunciaAlunoProps) {
    const {
        motivos,
        motivoSelecionado,
        setMotivoSelecionado,
        detalhes,
        setDetalhes,
        sending,
        error,
        success,
        submit,
    } = useDenuncia()

    async function handleConfirm() {
        try {
            await submit(aluno)
            onClose()
        } catch (err) {
            console.error("Erro ao enviar denúncia", err)
        }
    }

    const conteudoModal = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="bg-card text-card-foreground border border-border rounded-lg p-6 w-full max-w-xl shadow-lg">
                <h2 className="text-lg font-semibold mb-2">Denunciar {aluno}</h2>
                <p className="text-sm text-muted-foreground mb-4">Selecione o motivo da denúncia e, se quiser, adicione mais detalhes.</p>

                <div className="mb-4">
                    <div className="grid grid-cols-2 gap-2">
                        {motivos.map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMotivoSelecionado(m)}
                                aria-pressed={motivoSelecionado === m}
                                className={`cursor-pointer flex items-center gap-3 px-2 py-2 text-left text-sm transition-colors focus:outline-none ${motivoSelecionado === m
                                    ? "text-primary font-medium"
                                    : "text-foreground hover:text-primary/80"
                                    }`}
                            >
                                <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-sm border ${motivoSelecionado === m
                                        ? "bg-primary border-primary"
                                        : "border-border bg-background"
                                        }`}
                                >
                                    {motivoSelecionado === m ? (
                                        <Check className="h-3 w-3 text-primary-foreground" />
                                    ) : (
                                        <span className="h-3 w-3" />
                                    )}
                                </span>
                                <span className="truncate">{m}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-foreground">Detalhes (opcional)</label>
                    <textarea
                        value={detalhes}
                        onChange={(e) => setDetalhes(e.target.value)}
                        rows={4}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground transition-colors"
                        placeholder="Descreva o que aconteceu, quando e onde..."
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} className="px-4 cursor-pointer">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} className="px-4 cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={sending}>
                        {sending ? "Enviando..." : "Denunciar"}
                    </Button>
                </div>
                {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
                {success && <p className="mt-3 text-sm text-green-600">Denúncia enviada com sucesso.</p>}
            </div>
        </div>
    )

    return createPortal(conteudoModal, document.body)
}