import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  GeminiAdapter,
  type GeminiAdapterConfig,
  type IAssistenteIA,
  type IGeminiChatSession,
  type IGeminiSdkClient,
} from "@/patterns/adapter/GeminiAdapter";
import { useGeminiChat } from "@/hooks/botsHooks/useChatBot";
import type { UsuarioProps } from "@/hooks/GerenciadorHooks/type";

vi.mock("@google/generative-ai", () => {
  return {
    SchemaType: { OBJECT: "OBJECT" },
    GoogleGenerativeAI: class FakeGoogleGenerativeAI {
      getGenerativeModel() {
        return {
          startChat: () => ({
            sendMessage: async () => ({
              response: { text: () => "Resposta do SDK padrão mockado" },
            }),
          }),
        };
      }
    },
  };
});

describe("GeminiAdapter & useGeminiChat (Padrão Adapter — Nível 3 RBT)", () => {
  const baseAdapterConfig: GeminiAdapterConfig = {
    model: "gemini-3.1-flash-lite-preview",
    systemInstruction: '{"schema":"jsoninstruction.v1"}',
    temperatura: 0.55,
    maxTokensOutPut: 1000,
    maxRetries: 2,
    delayBase: 500,
  };

  const criarMockSdk = (sendMessageMock: IGeminiChatSession["sendMessage"]) => {
    const startChatMock = vi.fn().mockReturnValue({
      sendMessage: sendMessageMock,
    });
    const getGenerativeModelMock = vi.fn().mockReturnValue({
      startChat: startChatMock,
    });
    const sdkClient: IGeminiSdkClient = {
      getGenerativeModel: getGenerativeModelMock,
    };
    return { sdkClient, getGenerativeModelMock, startChatMock };
  };

  describe("Envio direto e reutilização de sessão", () => {
    it("deve usar o cliente SDK padrão quando sdkClient não for injetado", async () => {
      const adapterPadrao = new GeminiAdapter(baseAdapterConfig);
      const resposta = await adapterPadrao.enviarMensagem("Teste padrão");
      expect(resposta).toBe("Resposta do SDK padrão mockado");
    });

    it("deve inicializar a sessão apenas uma vez e retornar o texto da resposta", async () => {
      const sendMessageMock = vi.fn().mockResolvedValue({
        response: {
          text: () => "Olá, sou o Tigreso!",
          functionCalls: () => undefined,
        },
      });
      const { sdkClient, getGenerativeModelMock, startChatMock } =
        criarMockSdk(sendMessageMock);

      const adapter = new GeminiAdapter(baseAdapterConfig, sdkClient);

      const resp1 = await adapter.enviarMensagem("Oi");
      const resp2 = await adapter.enviarMensagem("Tudo bem?");

      expect(resp1).toBe("Olá, sou o Tigreso!");
      expect(resp2).toBe("Olá, sou o Tigreso!");
      expect(getGenerativeModelMock).toHaveBeenCalledTimes(1);
      expect(startChatMock).toHaveBeenCalledTimes(1);
      expect(sendMessageMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("Orquestração de Function Calling (4 ferramentas de domínio)", () => {
    it("deve resolver chamadas de função via resp.functionCalls() (método) e candidates.parts", async () => {
      const obterEventosCalendario = vi
        .fn()
        .mockResolvedValue("Prova de Engenharia de Software amanhã");
      const obterDuvidasEstudante = vi
        .fn()
        .mockResolvedValue("Dúvida sobre Adapter respondida");
      const obterAtividadesAbertas = vi
        .fn()
        .mockResolvedValue("Entrega Fase 1 pendente");
      const obterPostsProfessor = vi
        .fn()
        .mockResolvedValue("Aviso sobre apresentação DCC061");

      const sendMessageMock = vi
        .fn()
        // 1ª chamada: retorna functionCalls via método
        .mockResolvedValueOnce({
          response: {
            text: () => "",
            functionCalls: () => [
              { name: "obterEventosCalendario" },
              { name: "obterDuvidasEstudante" },
            ],
          },
        })
        // 2ª chamada: retorna functionCalls via array direto
        .mockResolvedValueOnce({
          response: {
            text: () => "",
            functionCalls: [{ name: "obterAtividadesAbertas" }],
          },
        })
        // 3ª chamada: retorna functionCall via candidates[0].content.parts + uma tool desconhecida
        .mockResolvedValueOnce({
          response: {
            text: () => "",
            candidates: [
              {
                content: {
                  parts: [
                    { functionCall: { name: "obterPostsProfessor" } },
                    { functionCall: { name: "toolDesconhecida" } },
                  ],
                },
              },
            ],
          },
        })
        // 4ª chamada: resposta final textual
        .mockResolvedValueOnce({
          response: {
            text: () => "Aqui está o resumo completo das suas turmas!",
            candidates: [{ content: { parts: [{}] } }],
          },
        });

      const { sdkClient } = criarMockSdk(sendMessageMock);
      const adapter = new GeminiAdapter(
        {
          ...baseAdapterConfig,
          toolHandlers: {
            obterEventosCalendario,
            obterDuvidasEstudante,
            obterAtividadesAbertas,
            obterPostsProfessor,
          },
        },
        sdkClient,
      );

      const respostaFinal = await adapter.enviarMensagem(
        "Me dê um panorama geral",
      );

      expect(respostaFinal).toBe(
        "Aqui está o resumo completo das suas turmas!",
      );
      expect(obterEventosCalendario).toHaveBeenCalledTimes(1);
      expect(obterDuvidasEstudante).toHaveBeenCalledTimes(1);
      expect(obterAtividadesAbertas).toHaveBeenCalledTimes(1);
      expect(obterPostsProfessor).toHaveBeenCalledTimes(1);
      expect(sendMessageMock).toHaveBeenCalledTimes(4);
    });

    it("deve retornar string vazia no functionResponse caso toolHandlers não tenha sido fornecido", async () => {
      const sendMessageMock = vi
        .fn()
        .mockResolvedValueOnce({
          response: {
            text: () => "",
            functionCalls: () => [{ name: "obterEventosCalendario" }],
          },
        })
        .mockResolvedValueOnce({
          response: {
            text: () => "Sem eventos registrados.",
          },
        });

      const { sdkClient } = criarMockSdk(sendMessageMock);
      const adapter = new GeminiAdapter(baseAdapterConfig, sdkClient);

      const texto = await adapter.enviarMensagem("Tenho eventos?");
      expect(texto).toBe("Sem eventos registrados.");
      expect(sendMessageMock).toHaveBeenNthCalledWith(2, [
        {
          functionResponse: {
            name: "obterEventosCalendario",
            response: { result: "" },
          },
        },
      ]);
    });
  });

  describe("Resiliência e Backoff Exponencial (HTTP 503 / High Demand)", () => {
    it("deve realizar retry com backoff exponencial em erro 503 e ter sucesso na tentativa seguinte", async () => {
      vi.useFakeTimers();

      const sendMessageMock = vi
        .fn()
        .mockRejectedValueOnce({ status: 503, message: "Service Unavailable" })
        .mockRejectedValueOnce(new Error("Model is experiencing high demand"))
        .mockResolvedValueOnce({
          response: {
            text: () => "Recuperado após 2 retries!",
          },
        });

      const { sdkClient } = criarMockSdk(sendMessageMock);
      const adapter = new GeminiAdapter(baseAdapterConfig, sdkClient);

      const promessa = adapter.enviarMensagem("Olá com instabilidade");

      // 1º retry: 500ms, 2º retry: 1000ms
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(1000);

      const resultado = await promessa;
      expect(resultado).toBe("Recuperado após 2 retries!");
      expect(sendMessageMock).toHaveBeenCalledTimes(3);
    });

    it("deve propagar o erro quando exceder maxRetries em falhas 503 consecutivas", async () => {
      vi.useFakeTimers();

      const erro503 = new Error("503 Service Overloaded");
      const sendMessageMock = vi.fn().mockRejectedValue(erro503);

      const { sdkClient } = criarMockSdk(sendMessageMock);
      const adapter = new GeminiAdapter(baseAdapterConfig, sdkClient);

      const promessa = adapter.enviarMensagem("Vai falhar");
      const validacao = expect(promessa).rejects.toThrow(
        "503 Service Overloaded",
      );

      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(1000);

      await validacao;
      expect(sendMessageMock).toHaveBeenCalledTimes(3);
    });

    it("não deve tentar retry para erros que não sejam 503 (ex: 400 Bad Request)", async () => {
      const erro400 = Object.assign(new Error("Invalid API Key"), {
        code: 400,
      });
      const sendMessageMock = vi.fn().mockRejectedValue(erro400);

      const { sdkClient } = criarMockSdk(sendMessageMock);
      const adapter = new GeminiAdapter(baseAdapterConfig, sdkClient);

      await expect(adapter.enviarMensagem("Teste erro fatal")).rejects.toThrow(
        "Invalid API Key",
      );
      expect(sendMessageMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Integração com o hook useGeminiChat via FakeAssistenteIA (Sem Rede)", () => {
    const usuarioBase: UsuarioProps = {
      inscricoes: { "turma-1": true },
      acessouOq: "principal",
      chaveMural: "",
      listaDosInscritos: ["turma-1"],
      chatAtivoId: null,
    };

    it("deve enviar mensagem usando FakeAssistenteIA e atualizar lista de mensagens", async () => {
      const fakeAssistente: IAssistenteIA = {
        enviarMensagem: vi
          .fn()
          .mockResolvedValue("Resposta simulada instantânea!"),
      };

      const { result } = renderHook(() =>
        useGeminiChat({
          usuario: usuarioBase,
          isHelpMode: false,
          assistente: fakeAssistente,
        }),
      );

      // Ignora mensagens em branco
      await act(async () => {
        await result.current.sendMessage("   ");
      });
      expect(result.current.messages).toHaveLength(0);

      await act(async () => {
        await result.current.sendMessage("Quais são minhas tarefas?");
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.messages).toEqual([
        { role: "user", text: "Quais são minhas tarefas?" },
        { role: "model", text: "Resposta simulada instantânea!" },
      ]);
    });

    it("deve exibir mensagem amigável quando o assistente falhar com erro 503 ou genérico", async () => {
      const fakeAssistente: IAssistenteIA = {
        enviarMensagem: vi
          .fn()
          .mockRejectedValueOnce(new Error("Error 503: Service Unavailable"))
          .mockRejectedValueOnce({ code: 429, message: "Quota exceeded" }),
      };

      const { result } = renderHook(() =>
        useGeminiChat({
          usuario: usuarioBase,
          assistente: fakeAssistente,
        }),
      );

      await act(async () => {
        await result.current.sendMessage("Tentativa 1 (503)");
      });

      expect(result.current.messages[1]).toEqual({
        role: "model",
        text: "O serviço está sobrecarregado no momento. Por favor, tente novamente em alguns minutos.",
      });

      await act(async () => {
        await result.current.sendMessage("Tentativa 2 (429)");
      });

      expect(result.current.messages[3]).toEqual({
        role: "model",
        text: "Erro 429: Quota exceeded",
      });
    });
  });
});
