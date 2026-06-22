import { getAssetPath } from "@/lib/assetPath";
import { SchemaType } from "@google/generative-ai";
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
    DELAY_BASE: 500,
    fotos: [
        getAssetPath('perfilBot/perfilBot.jpg'),
        getAssetPath('perfilBot/perfilBot2.png')
    ],
    tools: [
        {
            functionDeclarations: [
                {
                    name: "obterEventosCalendario",
                    description: "Retorna a lista dos próximos eventos, compromissos ou avaliações no calendário do usuário.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {},
                    },
                },
                {
                    name: "obterDuvidasEstudante",
                    description: "Retorna as dúvidas e perguntas frequentes enviadas pelo estudante/professor com os respectivos status de resolução e respostas.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {},
                    },
                },
                {
                    name: "obterAtividadesAbertas",
                    description: "Retorna a lista de tarefas ou atividades em aberto (pendentes) para o estudante ou cadastradas pelo professor.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {},
                    },
                },
                {
                    name: "obterPostsProfessor",
                    description: "Retorna os comunicados, posts e avisos recentes dos professores nas turmas do usuário.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {},
                    },
                }
            ]
        }
    ]
}