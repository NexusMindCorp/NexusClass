import { Button } from "@/components/ui/button";
export function AtendimentoContato() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <h2 className="text-2xl font-semibold">Entre em contato com o professor</h2>
      <p className="text-gray-600">Envie uma mensagem para tirar suas dúvidas ou solicitar ajuda.</p>
      <Button variant="outline">Enviar mensagem</Button>
    </div>
  );
}