import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

type BoxMuralProps = {
  materia: string;
  professorNome: string;
  aberto: boolean;
  onClose: () => void;
  conteudo: string;
  setConteudo: (conteudo: string) => void;
  onPublicar: () => void;
};

export function BoxMural({ materia, professorNome, aberto, onClose, conteudo, setConteudo, onPublicar }: BoxMuralProps) {
  if (!aberto) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />
      <Card className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl p-6">
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="mensagem-mural">Postar no mural de {materia}</FieldLabel>
              <Textarea
                id="mensagem-mural"
                placeholder="Escreva sua mensagem aqui..."
                rows={4}
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
              />
              <FieldDescription>
                Compartilhe algo com a turma de {professorNome}
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onPublicar} disabled={!conteudo.trim()}>
            Publicar
          </Button>
        </div>
      </Card>
    </>
  );
}
