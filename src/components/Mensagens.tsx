
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function Mensagens() {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <Card>
                <CardHeader>
                    <CardTitle>Mensagens dos professores para você</CardTitle>
                </CardHeader>
                <CardContent>
                    <img src="https://cdn-icons-png.flaticon.com/512/561/561127.png" alt="Ícone de mensagens" className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-center text-gray-500">Nenhuma mensagem disponível no momento. Aguarde que logo logo o professor irá responder.</p>
                </CardContent>
            </Card>
        </div>
    )
    
}