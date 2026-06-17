import type { BotConfigProps } from "./type";

export const ConfigBot: BotConfigProps = {
    nome:['Tigreso', 'Falcão Peregrino'],
    linguagem: 'pt-BR',
    minSentences: 3,
    maxSentences: 6,
    model: "gemini-3.1-flash-lite-preview",
    temperatura: 0.55,
    maxTokensOutPut: 1000,
    MAX_RETRIES: 2,
    DELAY_BASE: 500
}