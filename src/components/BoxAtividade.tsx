import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X, Upload, Paperclip, Trash2 } from "lucide-react";
import type { Atividade } from "@/hooks/MuralHooks/type";
import type { AnexoRef } from "@/lib/db/mappers";

type BoxAtividadeProps = {
  materia: string;
  aberto: boolean;
  onClose: () => void;
  onPublicar: (
    titulo: string,
    descricao: string,
    dataEntrega: string | null,
    arquivos: File[],
  ) => Promise<void>;
  atividadeParaEditar?: Atividade | null;
  onEditar?: (
    atividadeId: string,
    titulo: string,
    descricao: string,
    dataEntrega: string | null,
    arquivos: File[],
    anexosMantidos: AnexoRef[],
  ) => Promise<void>;
};

export function BoxAtividade({
  materia,
  aberto,
  onClose,
  onPublicar,
  atividadeParaEditar,
  onEditar,
}: BoxAtividadeProps) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [anexosMantidos, setAnexosMantidos] = useState<AnexoRef[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (atividadeParaEditar && aberto) {
      setTitulo(atividadeParaEditar.titulo);
      setDescricao(atividadeParaEditar.descricao);
      setAnexosMantidos(atividadeParaEditar.anexos ?? []);

      if (atividadeParaEditar.data_entrega) {
        const date = new Date(atividadeParaEditar.data_entrega);
        const tzOffset = date.getTimezoneOffset() * 60000;
        const localISODate = new Date(date.getTime() - tzOffset)
          .toISOString()
          .slice(0, 16);
        setDataEntrega(localISODate);
      } else {
        setDataEntrega("");
      }
      setArquivos([]);
    } else if (aberto) {
      setTitulo("");
      setDescricao("");
      setDataEntrega("");
      setArquivos([]);
      setAnexosMantidos([]);
    }
  }, [atividadeParaEditar, aberto]);

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

  const removerAnexoMantido = (idObjeto: string) => {
    setAnexosMantidos((prev) => prev.filter((item) => item.idObjeto !== idObjeto));
  };

  const handleConfirm = async () => {
    if (!titulo.trim() || !descricao.trim() || !dataEntrega) return;

    try {
      setLoading(true);
      if (atividadeParaEditar && onEditar) {
        await onEditar(
          atividadeParaEditar.id,
          titulo,
          descricao,
          dataEntrega,
          arquivos,
          anexosMantidos,
        );
      } else {
        await onPublicar(titulo, descricao, dataEntrega, arquivos);
      }
      setTitulo("");
      setDescricao("");
      setDataEntrega("");
      setArquivos([]);
      setAnexosMantidos([]);
      onClose();
    } catch (err) {
      console.error("Erro ao salvar atividade:", err);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <Card className="relative w-full max-w-xl p-6 shadow-2xl border border-border bg-card text-card-foreground max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold tracking-tight mb-4">
          {atividadeParaEditar
            ? `Editar Atividade em ${materia}`
            : `Nova Atividade para ${materia}`}
        </h2>

        <FieldSet>
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel htmlFor="atividade-titulo">
                Título da Atividade
              </FieldLabel>
              <input
                id="atividade-titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Exercícios de Fixação..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="atividade-descricao">
                Descrição / Instruções
              </FieldLabel>
              <Textarea
                id="atividade-descricao"
                placeholder="Escreva as instruções para a atividade..."
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-colors resize-none"
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="atividade-data">
                  Data de Entrega *
                </FieldLabel>
                <input
                  id="atividade-data"
                  type="datetime-local"
                  required
                  aria-invalid={!dataEntrega}
                  value={dataEntrega}
                  onChange={(e) => setDataEntrega(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
              </Field>

              <Field className="flex flex-col justify-end">
                <FieldLabel>Selecionar Arquivos</FieldLabel>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full justify-start cursor-pointer border-input hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Adicionar arquivos...
                </Button>
              </Field>
            </div>

            {/* Empilhamento de Anexos */}
            {(anexosMantidos.length > 0 || arquivos.length > 0) && (
              <div className="space-y-2 pt-2">
                <FieldLabel>
                  Arquivos Anexados ({anexosMantidos.length + arquivos.length})
                </FieldLabel>
                <div className="border border-border/80 rounded-lg bg-muted/20 p-3 max-h-[160px] overflow-y-auto space-y-1.5">
                  {/* Anexos Existentes (Em edição) */}
                  {anexosMantidos.map((anexo) => (
                    <div
                      key={anexo.idObjeto}
                      className="flex items-center justify-between p-1.5 rounded bg-background border border-border/60 text-xs gap-3"
                    >
                      <span className="flex items-center gap-1.5 truncate text-foreground font-medium">
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {anexo.nome}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerAnexoMantido(anexo.idObjeto)}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  {/* Novos arquivos na fila */}
                  {arquivos.map((file, i) => (
                    <div
                      key={`file-${i}`}
                      className="flex items-center justify-between p-1.5 rounded bg-primary/5 border border-primary/10 text-xs gap-3"
                    >
                      <span className="flex items-center gap-1.5 truncate text-primary font-semibold">
                        <Upload className="h-3.5 w-3.5 shrink-0" />
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
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
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

        <div className="flex justify-end gap-3 mt-8">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            className="cursor-pointer"
            onClick={handleConfirm}
            disabled={!titulo.trim() || !descricao.trim() || !dataEntrega || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {atividadeParaEditar ? "Salvando..." : "Criando..."}
              </>
            ) : atividadeParaEditar ? (
              "Salvar Alterações"
            ) : (
              "Publicar Atividade"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );

  return createPortal(modalContent, document.body);
}
