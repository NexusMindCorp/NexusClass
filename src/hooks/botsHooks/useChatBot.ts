import { useState, useRef, useEffect, useMemo } from "react";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";
import type { Message, UseGeminiChatProps } from "./type";
import { CarregamentoDados } from "./carregamentoDados";
import type { IAssistenteIA } from "@/patterns/adapter/GeminiAdapter";
import { BotFactory } from "@/patterns/factory/BotFactory";

export function useGeminiChat({
  usuario,
  isHelpMode = false,
  assistente: assistenteInjetado,
}: UseGeminiChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const assistenteRef = useRef<IAssistenteIA | null>(null);

  const perfilId = usuario.perfil?.id;
  const perfilRole = usuario.perfil?.role;
  const inscricoesStr = Object.keys(usuario.inscricoes || {})
    .filter((key) => usuario.inscricoes[key])
    .sort()
    .join(",");

  const {
    obterResumoEventos,
    obterDuvidas,
    obterAtividadesAbertas,
    obterPostsProfessor,
  } = CarregamentoDados(
    usuario.listaEscolar,
    hasSupabaseConfig,
    supabase,
    perfilId || null,
    inscricoesStr || null,
    perfilRole || null,
  );

  const tipoBot = BotFactory.resolverTipoBot(isHelpMode);

  const botConfig = useMemo(
    () =>
      BotFactory.criarConfig(tipoBot, {
        perfil: usuario.perfil,
        inscricoes: usuario.inscricoes,
        listaEscolar: usuario.listaEscolar,
        materiasProfessor: usuario.materiasProfessor,
      }),
    [
      tipoBot,
      usuario.perfil,
      usuario.inscricoes,
      usuario.listaEscolar,
      usuario.materiasProfessor,
    ],
  );

  useEffect(() => {
    if (assistenteInjetado) {
      assistenteRef.current = assistenteInjetado;
      return;
    }

    assistenteRef.current = BotFactory.criarAssistente(tipoBot, {
      perfil: usuario.perfil,
      inscricoes: usuario.inscricoes,
      listaEscolar: usuario.listaEscolar,
      materiasProfessor: usuario.materiasProfessor,
      toolHandlers: {
        obterEventosCalendario: obterResumoEventos,
        obterDuvidasEstudante: obterDuvidas,
        obterAtividadesAbertas,
        obterPostsProfessor,
      },
    });
  }, [
    assistenteInjetado,
    tipoBot,
    botConfig.systemInstruction,
    usuario.perfil,
    usuario.inscricoes,
    usuario.listaEscolar,
    usuario.materiasProfessor,
    obterResumoEventos,
    obterDuvidas,
    obterAtividadesAbertas,
    obterPostsProfessor,
  ]);

  useEffect(() => {
    setMessages([]);
  }, [isHelpMode]);

  const sendMessage = async (input: string) => {
    if (!input.trim() || !assistenteRef.current) return;

    const userMsg: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const botText = await assistenteRef.current.enviarMensagem(input);
      const botMsg: Message = { role: "model", text: botText };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error: unknown) {
      const err = error as { code?: string | number; message?: string };
      const errorMessage = err?.message?.includes("503")
        ? "O serviço está sobrecarregado no momento. Por favor, tente novamente em alguns minutos."
        : `Erro ${err?.code}: ${err?.message}`;

      setMessages((prev) => [...prev, { role: "model", text: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage };
}
