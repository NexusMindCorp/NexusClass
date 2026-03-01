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
import { toast } from "sonner"

type AtendimentoContatoProps = {
  professorNome: string;
  aberto: boolean;
  onClose: () => void;
  assunto: string;
  setAssunto: (assunto: string) => void;
  mensagem: string;
  setMensagem: (mensagem: string) => void;
  onEnviar: () => void;
};

export function AtendimentoContato({
  professorNome,
  aberto,
  onClose,
  assunto,
  setAssunto,
  mensagem,
  setMensagem,
  onEnviar,
}: AtendimentoContatoProps) {
  if (!aberto) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <Card className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl p-6">
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="assunto-contato">
                Assunto
              </FieldLabel>
              <Input
                id="assunto-contato"
                type="text"
                placeholder="Ex: Dúvida sobre a atividade"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
              />
              <FieldDescription>
                Descreva brevemente o motivo do contato.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="mensagem-contato">
                Digite o conteúdo da mensagem para o professor {professorNome}
              </FieldLabel>
              <Textarea
                id="mensagem-contato"
                placeholder="Escreva sua mensagem aqui..."
                rows={4}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              onEnviar();
              toast.success("Mensagem enviada com sucesso!");
            }}
            disabled={!assunto.trim() || !mensagem.trim()}
          >
            Enviar mensagem
          </Button>
        </div>
      </Card>
    </>
  );
}