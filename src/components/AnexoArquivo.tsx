import { Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import type { RefObject } from "react";
import { Button } from "./ui/button";

type AnexoArquivoProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  attachedFiles: File[];
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function AnexoArquivo({
  fileInputRef,
  attachedFiles,
  onFileChange,
}: AnexoArquivoProps) {
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
        className="bg-destructive text-slate-950 hover:bg-destructive/90 transition-colors shadow-sm hover:shadow-[0_0_12px_rgba(239,68,68,0.18)] focus-visible:ring-2 focus-visible:ring-ring"
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
  );
}
