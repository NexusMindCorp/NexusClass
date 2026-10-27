import { GoogleGenerativeAI, type Tool } from "@google/generative-ai";

export interface IAssistenteIA {
  enviarMensagem(texto: string): Promise<string>;
}

export interface BotToolHandlers {
  obterEventosCalendario?: () => Promise<string>;
  obterDuvidasEstudante?: () => Promise<string>;
  obterAtividadesAbertas?: () => Promise<string>;
  obterPostsProfessor?: () => Promise<string>;
}

export interface GeminiFunctionCall {
  name: string;
  args?: Record<string, unknown>;
}

export interface GeminiFunctionResponsePart {
  functionResponse: {
    name: string;
    response: {
      result: string;
    };
  };
}

export interface IGeminiResponse {
  text(): string;
  functionCalls?: (() => GeminiFunctionCall[] | undefined) | GeminiFunctionCall[];
  candidates?: Array<{
    content?: {
      parts?: Array<{
        functionCall?: GeminiFunctionCall;
      }>;
    };
  }>;
}

export interface IGeminiSendMessageResult {
  response: Promise<IGeminiResponse> | IGeminiResponse;
}

export interface IGeminiChatSession {
  sendMessage(
    content: string | GeminiFunctionResponsePart[],
  ): Promise<IGeminiSendMessageResult>;
}

export interface IGeminiGenerativeModel {
  startChat(params: {
    history: unknown[];
    generationConfig: {
      maxOutputTokens: number;
      temperature: number;
    };
  }): IGeminiChatSession;
}

export interface IGeminiSdkClient {
  getGenerativeModel(params: {
    model: string;
    systemInstruction: string;
    tools?: Tool[];
  }): IGeminiGenerativeModel;
}

export interface GeminiAdapterConfig {
  model: string;
  systemInstruction: string;
  temperatura: number;
  maxTokensOutPut: number;
  maxRetries: number;
  delayBase: number;
  tools?: Tool[];
  toolHandlers?: BotToolHandlers;
}

export class GeminiAdapter implements IAssistenteIA {
  private readonly config: GeminiAdapterConfig;
  private readonly sdkClient: IGeminiSdkClient;
  private chatSession: IGeminiChatSession | null = null;

  constructor(config: GeminiAdapterConfig, sdkClient?: IGeminiSdkClient) {
    this.config = config;
    this.sdkClient =
      sdkClient ??
      (new GoogleGenerativeAI(__API_GEMINI_KEY__) as unknown as IGeminiSdkClient);
  }

  private obterSessao(): IGeminiChatSession {
    if (!this.chatSession) {
      const model = this.sdkClient.getGenerativeModel({
        model: this.config.model,
        systemInstruction: this.config.systemInstruction,
        tools: this.config.tools,
      });

      this.chatSession = model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: this.config.maxTokensOutPut,
          temperature: this.config.temperatura,
        },
      });
    }

    return this.chatSession;
  }

  private extrairFunctionCalls(
    resp: IGeminiResponse,
  ): GeminiFunctionCall[] | undefined {
    if (typeof resp.functionCalls === "function") {
      const calls = resp.functionCalls();
      if (calls && calls.length > 0) return calls;
    } else if (Array.isArray(resp.functionCalls) && resp.functionCalls.length > 0) {
      return resp.functionCalls;
    }

    const candidate = resp.candidates?.[0];
    const parts = candidate?.content?.parts;
    if (parts) {
      const extraidas = parts
        .filter((p): p is { functionCall: GeminiFunctionCall } =>
          Boolean(p.functionCall),
        )
        .map((p) => p.functionCall);
      return extraidas.length > 0 ? extraidas : undefined;
    }

    return undefined;
  }

  private async executarToolCall(call: GeminiFunctionCall): Promise<string> {
    const handlers = this.config.toolHandlers;
    if (!handlers) return "";

    if (call.name === "obterEventosCalendario" && handlers.obterEventosCalendario) {
      return handlers.obterEventosCalendario();
    }
    if (call.name === "obterDuvidasEstudante" && handlers.obterDuvidasEstudante) {
      return handlers.obterDuvidasEstudante();
    }
    if (call.name === "obterAtividadesAbertas" && handlers.obterAtividadesAbertas) {
      return handlers.obterAtividadesAbertas();
    }
    if (call.name === "obterPostsProfessor" && handlers.obterPostsProfessor) {
      return handlers.obterPostsProfessor();
    }

    return "";
  }

  private async chamarComRetry(
    content: string | GeminiFunctionResponsePart[],
    attempt = 0,
  ): Promise<IGeminiSendMessageResult> {
    try {
      return await this.obterSessao().sendMessage(content);
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        code?: string | number;
        message?: string;
      };
      const status = err?.status ?? err?.message;
      const isServiceUnavailable =
        status === 503 ||
        Boolean(err?.message?.includes("503")) ||
        Boolean(err?.message?.includes("high demand"));

      if (isServiceUnavailable && attempt < this.config.maxRetries) {
        const delay = this.config.delayBase * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.chamarComRetry(content, attempt + 1);
      }

      throw error;
    }
  }

  async enviarMensagem(texto: string): Promise<string> {
    let result = await this.chamarComRetry(texto);
    let response = await result.response;
    let functionCalls = this.extrairFunctionCalls(response);

    while (functionCalls && functionCalls.length > 0) {
      const responses: GeminiFunctionResponsePart[] = await Promise.all(
        functionCalls.map(async (call) => {
          const functionResult = await this.executarToolCall(call);
          return {
            functionResponse: {
              name: call.name,
              response: { result: functionResult },
            },
          };
        }),
      );

      result = await this.chamarComRetry(responses);
      response = await result.response;
      functionCalls = this.extrairFunctionCalls(response);
    }

    return response.text();
  }
}
