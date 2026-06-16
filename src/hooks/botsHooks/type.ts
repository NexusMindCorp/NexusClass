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