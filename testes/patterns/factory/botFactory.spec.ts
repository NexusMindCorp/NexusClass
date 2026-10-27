import { describe, it, expect } from "vitest";
import {
  BotFactory,
  RESUMO_ACORDO_USO,
} from "@/patterns/factory/BotFactory";
import { GeminiAdapter } from "@/patterns/adapter/GeminiAdapter";
import type { IGeminiSdkClient } from "@/patterns/adapter/GeminiAdapter";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";

describe("BotFactory (Padrão Factory — Nível 2 RBT)", () => {
  const perfilAluno: PerfilUsuario = {
    id: "aluno-1",
    nome: "Carlos Silva",
    email: "carlos@nexus.edu",
    foto_url: null,
    bio: null,
    created_at: "2026-10-01T00:00:00Z",
    role: "aluno",
  };

  const perfilProfessor: PerfilUsuario = {
    id: "prof-1",
    nome: "Profa. Helena",
    email: "helena@nexus.edu",
    foto_url: null,
    bio: null,
    created_at: "2026-10-01T00:00:00Z",
    role: "professor",
  };

  const perfilMaster: PerfilUsuario = {
    id: "master-1",
    nome: "Admin Geral",
    email: "admin@nexus.edu",
    foto_url: null,
    bio: null,
    created_at: "2026-10-01T00:00:00Z",
    role: "master",
  };

  describe("resolverTipoBot", () => {
    it("deve retornar 'tigreso' por padrão ou quando isHelpMode for false", () => {
      expect(BotFactory.resolverTipoBot()).toBe("tigreso");
      expect(BotFactory.resolverTipoBot(false)).toBe("tigreso");
    });

    it("deve retornar 'falcao' quando isHelpMode for true", () => {
      expect(BotFactory.resolverTipoBot(true)).toBe("falcao");
    });
  });

  describe("montarResumoPerfil", () => {
    it("deve formatar nome e papel quando perfil estiver carregado", () => {
      const resumo = BotFactory.montarResumoPerfil(perfilAluno);
      expect(resumo).toBe(
        "Nome do usuário: Carlos Silva. Papel: aluno. Use esse nome para personalizar o atendimento.",
      );
    });

    it("deve retornar mensagem genérica quando perfil for nulo ou indefinido", () => {
      expect(BotFactory.montarResumoPerfil(null)).toBe(
        "Perfil do usuário não carregado. Atenda de forma genérica até o perfil estar disponível.",
      );
      expect(BotFactory.montarResumoPerfil(undefined)).toBe(
        "Perfil do usuário não carregado. Atenda de forma genérica até o perfil estar disponível.",
      );
    });
  });

  describe("montarResumoInscricoes (Tabela de Decisão por Papel)", () => {
    it("deve listar matérias inscritas para aluno com inscrições ativas", () => {
      const resumo = BotFactory.montarResumoInscricoes({
        perfil: perfilAluno,
        inscricoes: { "turma-1": true, "turma-2": false, "turma-3": true },
        listaEscolar: {
          "turma-1": { materia: "Engenharia de Software" },
          "turma-2": { materia: "Banco de Dados" },
          "turma-3": { materia: "Cálculo I" },
        },
      });

      expect(resumo).toBe(
        "O usuário está inscrito nas seguintes matérias: Engenharia de Software, Cálculo I. Foque nessas matérias no auxílio.",
      );
    });

    it("deve orientar inscrição quando aluno não possuir matérias ativas", () => {
      const resumoSemInscricoes = BotFactory.montarResumoInscricoes({
        perfil: perfilAluno,
      });
      expect(resumoSemInscricoes).toBe(
        "O usuário não está inscrito em nenhuma matéria; avise que para receber ajuda personalizada ele deve se inscrever em pelo menos uma matéria.",
      );
    });

    it("deve listar matérias lecionadas para professor com matérias vinculadas", () => {
      const resumo = BotFactory.montarResumoInscricoes({
        perfil: perfilProfessor,
        materiasProfessor: ["Engenharia de Software", "Arquitetura de Sistemas"],
      });

      expect(resumo).toBe(
        "O usuário é professor. Foque em sugerir atividades, estruturar questões para alunos e em gerenciar conteúdos das seguintes matérias: Engenharia de Software, Arquitetura de Sistemas.",
      );
    });

    it("deve retornar resumo genérico de docência para professor sem matérias listadas", () => {
      const resumo = BotFactory.montarResumoInscricoes({
        perfil: perfilProfessor,
        materiasProfessor: [],
      });

      expect(resumo).toBe(
        "O usuário é professor. Foque em sugerir atividades, estruturar questões para alunos e em gerenciar conteúdos da disciplina.",
      );
    });

    it("deve retornar resumo administrativo para papel master", () => {
      const resumo = BotFactory.montarResumoInscricoes({
        perfil: perfilMaster,
      });

      expect(resumo).toBe(
        "O usuário é administrador da plataforma. Forneça informações sobre configuração, permissões e uso administrativo.",
      );
    });

    it("deve retornar fallback genérico quando papel não estiver disponível", () => {
      expect(BotFactory.montarResumoInscricoes()).toBe(
        "Informações de inscrição/papel não disponíveis. Atenda de forma genérica.",
      );
    });
  });

  describe("criarConfig e criarAssistente", () => {
    it("deve construir configuração completa do Tigreso com escopo escolar, tools e easter egg", () => {
      const config = BotFactory.criarConfig("tigreso", {
        perfil: perfilAluno,
        inscricoes: { "t-1": true },
        listaEscolar: { "t-1": { materia: "DCC061" } },
      });

      expect(config.tipo).toBe("tigreso");
      expect(config.nome).toBe("Tigreso");
      expect(config.foto).toContain("perfilBot/perfilBot.jpg");
      expect(config.instructionJson.assistant.name).toBe("Tigreso");
      expect(config.instructionJson.scope.allowedTopics).toContain(
        "oração divina do tigreso",
      );
      expect(config.instructionJson.behavior.easterEgg).toContain("tigreso");
      expect(config.instructionJson.context?.enrollmentSummary).toContain(
        "DCC061",
      );
      expect(config.adapterConfig.tools).toBeDefined();
      expect(config.adapterConfig.maxRetries).toBe(2);
    });

    it("deve construir configuração completa do Falcão Peregrino com Acordo de Uso", () => {
      const config = BotFactory.criarConfig("falcao", {
        perfil: perfilProfessor,
      });

      expect(config.tipo).toBe("falcao");
      expect(config.nome).toBe("Falcão Peregrino");
      expect(config.foto).toContain("perfilBot/perfilBot2.png");
      expect(config.instructionJson.assistant.name).toBe("Falcão Peregrino");
      expect(config.instructionJson.scope.allowedTopics).toContain(
        "privacidade",
      );
      expect(config.instructionJson.context?.usageAgreementSummary).toBe(
        RESUMO_ACORDO_USO,
      );
      expect(config.systemInstruction).toContain("Falcão Peregrino");
    });

    it("deve instanciar um GeminiAdapter funcional via BotFactory.criarAssistente", () => {
      const fakeSdk: IGeminiSdkClient = {
        getGenerativeModel: () => ({
          startChat: () => ({
            sendMessage: async () => ({
              response: { text: () => "Olá do Tigreso!" },
            }),
          }),
        }),
      };

      const assistente = BotFactory.criarAssistente("tigreso", undefined, fakeSdk);
      expect(assistente).toBeInstanceOf(GeminiAdapter);
    });
  });
});
