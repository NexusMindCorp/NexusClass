# Adapter (`GeminiAdapter`)

**Por quê:** `useChatBot.ts` instanciava `new GoogleGenerativeAI(__API_GEMINI_KEY__)` diretamente e misturava estado React com o protocolo de *Function Calling* e *retry* de HTTP 503 da biblioteca externa, impedindo testar o chatbot sem acesso à rede.

**Como funciona:** o hook passa a depender exclusivamente do contrato de domínio `IAssistenteIA` (`enviarMensagem(texto: string): Promise<string>`). A classe `GeminiAdapter` encapsula a sessão `ChatSession` do SDK `@google/generative-ai`, resolve chamadas recursivas de ferramentas (`obterEventosCalendario`, `obterDuvidasEstudante`, `obterAtividadesAbertas`, `obterPostsProfessor`) e aplica *backoff* exponencial em erros `503` / `"high demand"`.

**Exemplo de uso:**
```ts
import { GeminiAdapter, type IAssistenteIA } from "@/patterns/adapter/GeminiAdapter";

const assistente: IAssistenteIA = new GeminiAdapter(adapterConfig, sdkClientOpcional);
const resposta = await assistente.enviarMensagem("Quais são minhas atividades em aberto?");
```

**Status:** Concluído (Fase 1 — Autor: Gianlucca Paiva)
