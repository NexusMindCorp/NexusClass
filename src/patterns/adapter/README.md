# Adapter

**Por quê:** `useChatBot.ts` cria `new GoogleGenerativeAI(...)` diretamente. A tela fica presa ao SDK do Gemini e não dá para testar sem rede.

**Como funciona:** o app passa a depender de uma interface própria (`IAssistenteIA`); o `GeminiAdapter` traduz essa interface para o SDK (incluindo Function Calling e retry em HTTP 503). Trocar de provedor ou usar um *fake* nos testes não altera o hook.

**Exemplo (esboço):**
```ts
export interface IAssistenteIA {
  enviarMensagem(texto: string): Promise<string>
}
// GeminiAdapter implements IAssistenteIA  → envolve ChatSession do SDK
// FakeAssistente implements IAssistenteIA → usado em testes
```
**Status:** Planejado (Fase 1)
