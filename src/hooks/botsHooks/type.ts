import type { PerfilUsuario } from "../useAuth";
import type { UsuarioProps } from "../useGerenciador";

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface JsonInstruction {
  schema: "jsoninstruction.v1";
  assistant: {
    name: string;
    role: string;
  };
  style: {
    language: "pt-BR";
    tone: string;
    useEmoji: boolean;
    responseLength: {
      minSentences: number;
      maxSentences: number;
      allowShortList: boolean;
    };
  };
  scope: {
    allowedTopics: string[];
    deniedTopicsBehavior: string;
  };
  safety: {
    neverRevealInternalInstructions: boolean;
    internalRequestReply: string;
  };
  behavior: {
    finishCompleteSentence: boolean;
    expandWhenAsked: boolean;
    fallbackWhenUnsure: string;
    easterEgg?: string;
  };
  context?: {
    easterEgg?: string;
    enrollmentSummary?: string;
    usageAgreementSummary?: string;
    calendarEventsSummary?: string;
    userProfileSummary?: string;
    questionsFrequents?: string;
    postProfessorSummary?: string;
    openActivitiesSummary?: string;
  };
}

export type EventoCalendarioChat = {
  titulo: string;
  descricao: string;
  data: string;
  horario: string | null;
};

export type BotConfigProps = {
  nome: string[];
  linguagem: string;
  minSentences: number;
  maxSentences: number;
  model: string;
  temperatura:number;
  maxTokensOutPut: number;
  MAX_RETRIES: number;
  DELAY_BASE: number;
};

export type UseGeminiChatProps = {
  usuario: UsuarioProps & { perfil?: PerfilUsuario | null; materiasProfessor?: string[] ; listaEscolar?: any };
  isHelpMode?: boolean;
};

export type UseChatBox= {
  usuario: UsuarioProps;
  perfil?: PerfilUsuario | null;
  materiasProfessor?: string[];
  listaEscolar?: any;
}