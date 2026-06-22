import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Paperclip, Trash2, X } from "lucide-react";

type AtendimentoContatoProps = {
  professorNome: string;
  aberto: boolean;
  onClose: () => void;
  onEnviar: (
    assunto: string,
    mensagem: string,
    arquivos: File[],
  ) => Promise<void>;
};

export function AtendimentoContato({
  professorNome,
  aberto,
  onClose,
  onEnviar,
}: AtendimentoContatoProps) {
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!aberto) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const listFiles = Array.from(e.target.files);
      setArquivos((prev) => [...prev, ...listFiles]);
    }
  };

  const removerArquivoNovo = (index: number) => {
    setArquivos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!assunto.trim() || !mensagem.trim()) return;
    try {
      setLoading(true);
      await onEnviar(assunto, mensagem, arquivos);
      setAssunto("");
      setMensagem("");
      setArquivos([]);
    } catch (err) {
      // O erro é tratado no hook pai (useMural)
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl p-6 shadow-2xl border border-border bg-card text-card-foreground max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold tracking-tight mb-4">
          Enviar Dúvida para {professorNome}
        </h2>

        <FieldSet>
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel htmlFor="assunto-contato">Assunto</FieldLabel>
              <Input
                id="assunto-contato"
                type="text"
                placeholder="Ex: Dúvida sobre a matéria..."
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                disabled={loading}
              />
              <FieldDescription>
                Descreva brevemente o assunto de sua dúvida.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="mensagem-contato">
                Conteúdo da Dúvida
              </FieldLabel>
              <Textarea
                id="mensagem-contato"
                placeholder="Explique detalhadamente sua dúvida..."
                rows={4}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                disabled={loading}
              />
            </Field>

            <Field className="flex flex-col justify-end">
              <FieldLabel>Anexar Arquivos (Opcional)</FieldLabel>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-start cursor-pointer"
                disabled={loading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Adicionar anexos...
              </Button>
            </Field>

            {/* Fila de arquivos selecionados */}
            {arquivos.length > 0 && (
              <div className="space-y-2">
                <FieldLabel>
                  Arquivos Selecionados ({arquivos.length})
                </FieldLabel>
                <div className="border border-border/80 rounded-lg bg-muted/20 p-3 max-h-[160px] overflow-y-auto space-y-1.5">
                  {arquivos.map((file, i) => (
                    <div
                      key={`file-${i}`}
                      className="flex items-center justify-between p-1.5 rounded bg-purple-500/5 border border-purple-500/10 text-xs gap-3"
                    >
                      <span className="flex items-center gap-1.5 truncate text-purple-500 font-semibold">
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {file.name}
                        <span className="text-[10px] text-muted-foreground font-normal">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerArquivoNovo(i)}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                        disabled={loading}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </FieldGroup>
        </FieldSet>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!assunto.trim() || !mensagem.trim() || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Mensagem"
            )}
          </Button>
        </div>
      </Card>
    </>
  );
}
