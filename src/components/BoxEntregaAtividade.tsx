import { useState, useRef, type ChangeEvent } from "react";
import { useEntregas } from "@/hooks/EntregasHooks/useEntregas";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  Upload,
  Paperclip,
  CheckCircle,
  AlertCircle,
  Award,
  Download,
  RefreshCw,
} from "lucide-react";
import type { BoxEntregaAtividadeProps } from "@/hooks/EntregasHooks/type";

export function BoxEntregaAtividade({
  atividadeId,
  perfil,
  dataEntregaAtividade,
}: BoxEntregaAtividadeProps) {
  const {
    entregaPropria,
    todasEntregas,
    loading,
    uploading,
    enviarEntrega,
    avaliarEntrega,
    obterLinkArquivo,
  } = useEntregas(atividadeId, perfil);

  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(
    null,
  );
  const [avaliandoAlunoId, setAvaliandoAlunoId] = useState<string | null>(null);
  const [notaInput, setNotaInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArquivoSelecionado(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!arquivoSelecionado) return;
    await enviarEntrega(arquivoSelecionado);
    setArquivoSelecionado(null);
  };

  const handleDownload = async (caminho: string | null) => {
    if (!caminho) return;
    const url = await obterLinkArquivo(caminho);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const iniciarAvaliacao = (
    alunoId: string,
    notaAtual: number | null,
    feedbackAtual: string | null,
  ) => {
    setAvaliandoAlunoId(alunoId);
    setNotaInput(notaAtual !== null ? notaAtual.toString() : "");
    setFeedbackInput(feedbackAtual || "");
  };

  const salvarAvaliacao = async (alunoId: string) => {
    const nota = parseFloat(notaInput);
    if (isNaN(nota) || nota < 0 || nota > 10) {
      alert("Por favor, insira uma nota válida entre 0 e 10.");
      return;
    }
    await avaliarEntrega(alunoId, nota, feedbackInput);
    setAvaliandoAlunoId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando entregas...
      </div>
    );
  }

  if (perfil.role === "aluno") {
    const jaPassouDoPrazo = dataEntregaAtividade
      ? new Date() > new Date(dataEntregaAtividade)
      : false;

    return (
      <div className="mt-4 pt-4 border-t border-border/60">
        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Sua Entrega
        </h5>

        {entregaPropria ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border bg-muted/20 border-border/80">
              <div className="flex items-center gap-2.5 truncate max-w-[70%]">
                <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate text-foreground">
                  {entregaPropria.url_anexo
                    ? entregaPropria.url_anexo
                        .split("/")
                        .pop()
                        ?.replace(/^\d+-/, "")
                    : "Arquivo entregue"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Badge de Prazo */}
                {entregaPropria.no_prazo ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                    <CheckCircle className="h-3 w-3" /> No Prazo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                    <AlertCircle className="h-3 w-3" /> Fora do Prazo
                  </span>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(entregaPropria.url_anexo)}
                  className="h-8 w-8 p-0 cursor-pointer"
                  title="Baixar arquivo entregue"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Avaliação e Notas */}
            {(entregaPropria.nota !== null || entregaPropria.feedback) && (
              <div className="p-3.5 rounded-lg border border-purple-500/20 bg-purple-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Award className="h-4 w-4" /> NOTA E FEEDBACK
                  </span>
                  {entregaPropria.nota !== null && (
                    <span className="text-sm font-extrabold text-foreground px-2 py-0.5 bg-background border border-border rounded">
                      {entregaPropria.nota.toFixed(1)} / 10.0
                    </span>
                  )}
                </div>
                {entregaPropria.feedback && (
                  <p className="text-xs text-muted-foreground leading-relaxed pl-5 italic">
                    "{entregaPropria.feedback}"
                  </p>
                )}
              </div>
            )}

            {/* Alterar Entrega (Somente se não houver nota) */}
            {entregaPropria.nota === null && (
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs shrink-0 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Substituir arquivo
                  </Button>
                  {arquivoSelecionado && (
                    <div className="flex items-center gap-2 truncate text-xs">
                      <span className="truncate text-muted-foreground italic">
                        (Novo: {arquivoSelecionado.name})
                      </span>
                      <Button
                        size="sm"
                        onClick={handleUpload}
                        disabled={uploading}
                        className="h-8 py-0 px-3 cursor-pointer"
                      >
                        {uploading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Confirmar Envio"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Caso não tenha entregue
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />

            {jaPassouDoPrazo && (
              <p className="text-xs text-amber-500 font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Atenção: O prazo de entrega
                desta atividade já venceu. Seus envios serão marcados como fora
                do prazo.
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-dashed border-2 hover:border-solid w-full md:w-auto cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-2" />
                {arquivoSelecionado
                  ? "Selecionar outro arquivo"
                  : "Anexar arquivo de entrega"}
              </Button>

              {arquivoSelecionado && (
                <Button
                  variant="default"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="cursor-pointer shrink-0"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Entregar Trabalho"
                  )}
                </Button>
              )}
            </div>

            {arquivoSelecionado && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 pl-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                Arquivo:{" "}
                <span className="font-semibold text-foreground">
                  {arquivoSelecionado.name}
                </span>{" "}
                ({(arquivoSelecionado.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/60">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Entregas Recebidas ({todasEntregas.length})
        </h5>
      </div>

      {todasEntregas.length === 0 ? (
        <div className="text-center py-4 border border-dashed rounded-lg border-border/60 bg-muted/10">
          <p className="text-xs text-muted-foreground">
            Nenhum aluno realizou a entrega desta atividade ainda.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
          {todasEntregas.map((ent) => (
            <Card key={ent.id} className="p-3 border bg-card/50 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {ent.aluno_nome}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Entregue em:{" "}
                    {new Date(ent.entregue_em).toLocaleString("pt-BR")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {ent.no_prazo ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                      No Prazo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                      Atrasado
                    </span>
                  )}

                  {ent.nota !== null && (
                    <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                      Nota: {ent.nota.toFixed(1)}
                    </span>
                  )}

                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleDownload(ent.url_anexo)}
                    className="h-7 px-2 cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    <Download className="h-3 w-3" />
                    Baixar Trabalho
                  </Button>
                </div>
              </div>

              {/* Área de Avaliação e Feedback */}
              {avaliandoAlunoId === ent.aluno_id ? (
                <div className="pt-2 border-t border-border/40 space-y-3 animate-in slide-in-from-top-2 duration-150">
                  <div className="flex gap-4">
                    <div className="w-1/4">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                        Nota (0 a 10)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={notaInput}
                        onChange={(e) => setNotaInput(e.target.value)}
                        className="w-full rounded border border-input bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Ex: 8.5"
                      />
                    </div>
                    <div className="w-3/4">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                        Feedback ao Aluno
                      </label>
                      <Textarea
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="Muito bem! A resposta do exercício 3..."
                        rows={2}
                        className="w-full rounded border border-input bg-background px-2.5 py-1.5 text-xs text-foreground outline-none resize-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAvaliandoAlunoId(null)}
                      className="h-8 px-3 cursor-pointer text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => salvarAvaliacao(ent.aluno_id)}
                      className="h-8 px-3 cursor-pointer text-xs bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Salvar Avaliação
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {ent.feedback && (
                    <p className="text-xs text-muted-foreground italic pl-2 border-l-2 border-border/80">
                      "{ent.feedback}"
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      variant="link"
                      size="xs"
                      onClick={() =>
                        iniciarAvaliacao(ent.aluno_id, ent.nota, ent.feedback)
                      }
                      className="text-purple-600 hover:text-purple-700 h-5 p-0 text-[11px] font-semibold cursor-pointer"
                    >
                      {ent.nota !== null
                        ? "Editar Nota/Feedback"
                        : "Avaliar Trabalho"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
