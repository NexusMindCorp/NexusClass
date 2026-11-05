import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  FiltroTurmaPorTextoStrategy,
  FiltroTurmasInscritasStrategy,
  FiltroTurmasDisponiveisStrategy,
  FiltroTodasTurmasStrategy,
  filtroTurmasInscritasStrategy,
  filtroTurmasDisponiveisStrategy,
  filtroTodasTurmasStrategy,
  obterEstrategiaFiltroTurma,
  ordenarTurmasPorInscricao,
  filtrarEOrdenarTurmas,
  FiltroDuvidasPorPerfilStrategy,
  FiltroTodasDuvidasStrategy,
  FiltroDuvidasPendentesStrategy,
  FiltroDuvidasResolvidasStrategy,
  obterEstrategiaStatusDuvida,
  filtrarDuvidasPorPerfilEStatus,
  type TurmaEntry,
} from "@/patterns/strategy/FiltroStrategy";
import { usePesquisa } from "@/hooks/PesquisaHooks/usePesquisa";
import { useDuvidas, normalizarDuvida } from "@/hooks/DuvidaHooks/useDuvidas";
import type { TurmaProps } from "@/hooks/LeituraDataHooks/type";
import type { Duvida } from "@/hooks/DuvidaHooks/type";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";

const criarTurmaFake = (parcial: Partial<TurmaProps>): TurmaProps => ({
  turma: "DCC061-A",
  materia: "Engenharia de Software",
  professor: "Prof. Marco",
  sala: "Sala 301",
  banners: "",
  alunos: [],
  foto_professor: "",
  ...parcial,
});

const criarPerfilFake = (parcial: Partial<PerfilUsuario>): PerfilUsuario => ({
  id: "user-1",
  nome: "Gianlucca Paiva",
  email: "gian@ufjf.br",
  foto_url: null,
  bio: null,
  created_at: "2026-10-01T00:00:00Z",
  role: "aluno",
  ...parcial,
});

const TURMAS_FIXTURE: Record<string, TurmaProps> = {
  t_eng: criarTurmaFake({
    turma: "DCC061-A",
    materia: "Engenharia de Software",
    professor: "Prof. Marco",
    sala: "Lab 101",
  }),
  t_alg: criarTurmaFake({
    turma: "DCC001-B",
    materia: "Algoritmos",
    professor: "Profa. Helena",
    sala: "Sala 204",
  }),
  t_bd: criarTurmaFake({
    turma: "DCC060-C",
    materia: "Banco de Dados",
    professor: "Prof. Carlos",
    sala: "Auditório Sul",
  }),
};

const ENTRADAS_TURMAS: TurmaEntry[] = Object.entries(TURMAS_FIXTURE);

const DUVIDAS_FIXTURE: Duvida[] = [
  {
    id: "duv-1",
    aluno_id: "aluno-1",
    prof_id: "prof-1",
    turma_id: "t_eng",
    assunto: "Dúvida sobre Padrão Strategy",
    descricao: "Como injetar a estratégia no hook?",
    anexo_url: null,
    created_at: "2026-11-05T10:00:00Z",
    resolvido: false,
    resposta: null,
  },
  {
    id: "duv-2",
    aluno_id: "aluno-1",
    prof_id: "prof-2",
    turma_id: "t_alg",
    assunto: "Complexidade de Quicksort",
    descricao: "Pior caso O(n^2)?",
    anexo_url: null,
    created_at: "2026-11-05T11:00:00Z",
    resolvido: true,
    resposta: "Sim, quando o pivô é sempre um extremo.",
  },
  {
    id: "duv-3",
    aluno_id: "aluno-2",
    prof_id: "prof-1",
    turma_id: "t_eng",
    assunto: "Entrega da Fase 3",
    descricao: "Qual o escopo de testes?",
    anexo_url: null,
    created_at: "2026-11-05T12:00:00Z",
    resolvido: false,
    resposta: null,
  },
];

describe("Fase 3 — Padrão Strategy (FiltroStrategy)", () => {
  describe("Domínio 1: Estratégias de Pesquisa de Turmas (Nível 2 RBT)", () => {
    it("FiltroTurmaPorTextoStrategy retorna lista vazia quando a busca é vazia ou só espaços", () => {
      const strategy = new FiltroTurmaPorTextoStrategy();

      expect(strategy.filtrar(ENTRADAS_TURMAS, "")).toEqual([]);
      expect(strategy.filtrar(ENTRADAS_TURMAS, "   ")).toEqual([]);
    });

    it("FiltroTurmaPorTextoStrategy filtra por matéria, professor, sala ou código (case-insensitive)", () => {
      const strategy = new FiltroTurmaPorTextoStrategy();

      expect(strategy.filtrar(ENTRADAS_TURMAS, "engenharia").map(([k]) => k)).toEqual([
        "t_eng",
      ]);
      expect(strategy.filtrar(ENTRADAS_TURMAS, "HELENA").map(([k]) => k)).toEqual([
        "t_alg",
      ]);
      expect(strategy.filtrar(ENTRADAS_TURMAS, "auditório").map(([k]) => k)).toEqual([
        "t_bd",
      ]);
      expect(strategy.filtrar(ENTRADAS_TURMAS, "dcc060-c").map(([k]) => k)).toEqual([
        "t_bd",
      ]);
      expect(strategy.filtrar(ENTRADAS_TURMAS, "inexistente")).toEqual([]);
    });

    it("FiltroTurmasInscritasStrategy, DisponiveisStrategy e TodasStrategy filtram por inscrição sem mutar a entrada", () => {
      const inscritas = new FiltroTurmasInscritasStrategy();
      const disponiveis = new FiltroTurmasDisponiveisStrategy();
      const todas = new FiltroTodasTurmasStrategy();
      const contexto = {
        estaInscrito: (key: string) => key === "t_eng",
      };

      expect(inscritas.filtrar(ENTRADAS_TURMAS, contexto).map(([k]) => k)).toEqual([
        "t_eng",
      ]);
      expect(disponiveis.filtrar(ENTRADAS_TURMAS, contexto).map(([k]) => k)).toEqual([
        "t_alg",
        "t_bd",
      ]);

      const resultadoTodas = todas.filtrar(ENTRADAS_TURMAS);
      expect(resultadoTodas).toHaveLength(3);
      expect(resultadoTodas).not.toBe(ENTRADAS_TURMAS);
    });

    it("obterEstrategiaFiltroTurma seleciona a estratégia correta por Tabela de Decisão (papel x aba)", () => {
      expect(obterEstrategiaFiltroTurma("todas", "professor")).toBe(
        filtroTurmasInscritasStrategy,
      );
      expect(obterEstrategiaFiltroTurma("minhas", "master")).toBe(
        filtroTodasTurmasStrategy,
      );
      expect(obterEstrategiaFiltroTurma("minhas", "aluno")).toBe(
        filtroTurmasInscritasStrategy,
      );
      expect(obterEstrategiaFiltroTurma("disponiveis", "aluno")).toBe(
        filtroTurmasDisponiveisStrategy,
      );
      expect(obterEstrategiaFiltroTurma("todas", "aluno")).toBe(
        filtroTodasTurmasStrategy,
      );
    });

    it("ordenarTurmasPorInscricao posiciona turmas inscritas antes das não inscritas em qualquer posição", () => {
      const ordenadasFinal = ordenarTurmasPorInscricao(
        ENTRADAS_TURMAS,
        (key) => key === "t_bd",
      );
      expect(ordenadasFinal.map(([k]) => k)).toEqual(["t_bd", "t_eng", "t_alg"]);

      const ordenadasMeio = ordenarTurmasPorInscricao(
        [ENTRADAS_TURMAS[0], ENTRADAS_TURMAS[1], ENTRADAS_TURMAS[2]],
        (key) => key === "t_eng" || key === "t_bd",
      );
      expect(ordenadasMeio.map(([k]) => k)).toEqual(["t_eng", "t_bd", "t_alg"]);
    });

    it("filtrarEOrdenarTurmas aplica ordenação alfabética quando sem busca e prioriza inscritas na aba todas", () => {
      const resultadoSemBusca = filtrarEOrdenarTurmas(TURMAS_FIXTURE, {
        textoPesquisa: "",
        abaAtiva: "todas",
        role: "aluno",
        estaInscrito: (key) => key === "t_eng",
      });

      // Inscrita (t_eng) vem primeiro; restantes em ordem alfabética (Algoritmos, Banco de Dados)
      expect(resultadoSemBusca.map(([k]) => k)).toEqual([
        "t_eng",
        "t_alg",
        "t_bd",
      ]);

      // Valores default de opcoes (abaAtiva = 'minhas', role = 'aluno', estaInscrito = () => false)
      expect(
        filtrarEOrdenarTurmas(TURMAS_FIXTURE, { textoPesquisa: "dcc" }),
      ).toEqual([]);
    });
  });

  describe("Domínio 2: Estratégias da Central de Dúvidas (Nível 2 RBT)", () => {
    it("FiltroDuvidasPorPerfilStrategy filtra corretamente para null, master, professor e aluno", () => {
      const strategy = new FiltroDuvidasPorPerfilStrategy();
      const perfilMaster = criarPerfilFake({
        id: "m-1",
        nome: "Admin",
        role: "master",
      });
      const perfilProf = criarPerfilFake({
        id: "prof-1",
        nome: "Prof. Marco",
        role: "professor",
      });
      const perfilAluno = criarPerfilFake({
        id: "aluno-1",
        nome: "Gianlucca",
        role: "aluno",
      });

      expect(strategy.filtrar(DUVIDAS_FIXTURE, null)).toEqual([]);
      expect(strategy.filtrar(DUVIDAS_FIXTURE, perfilMaster).map((d) => d.id)).toEqual([
        "duv-1",
        "duv-2",
        "duv-3",
      ]);
      expect(strategy.filtrar(DUVIDAS_FIXTURE, perfilProf).map((d) => d.id)).toEqual([
        "duv-1",
        "duv-3",
      ]);
      expect(strategy.filtrar(DUVIDAS_FIXTURE, perfilAluno).map((d) => d.id)).toEqual([
        "duv-1",
        "duv-2",
      ]);
    });

    it("Estratégias de status filtram todas, pendentes e resolvidas corretamente", () => {
      const todas = new FiltroTodasDuvidasStrategy();
      const pendentes = new FiltroDuvidasPendentesStrategy();
      const resolvidas = new FiltroDuvidasResolvidasStrategy();

      expect(todas.filtrar(DUVIDAS_FIXTURE)).toHaveLength(3);
      expect(pendentes.filtrar(DUVIDAS_FIXTURE).map((d) => d.id)).toEqual([
        "duv-1",
        "duv-3",
      ]);
      expect(resolvidas.filtrar(DUVIDAS_FIXTURE).map((d) => d.id)).toEqual([
        "duv-2",
      ]);
      expect(obterEstrategiaStatusDuvida("pendentes")).toBeInstanceOf(
        FiltroDuvidasPendentesStrategy,
      );
    });

    it("filtrarDuvidasPorPerfilEStatus compõe visibilidade por papel e status de resolução", () => {
      const perfilAluno = criarPerfilFake({
        id: "aluno-1",
        nome: "Gianlucca",
        role: "aluno",
      });

      expect(
        filtrarDuvidasPorPerfilEStatus(DUVIDAS_FIXTURE, perfilAluno).map((d) => d.id),
      ).toEqual(["duv-1", "duv-2"]);
      expect(
        filtrarDuvidasPorPerfilEStatus(
          DUVIDAS_FIXTURE,
          perfilAluno,
          "pendentes",
        ).map((d) => d.id),
      ).toEqual(["duv-1"]);
      expect(
        filtrarDuvidasPorPerfilEStatus(
          DUVIDAS_FIXTURE,
          perfilAluno,
          "resolvidas",
        ).map((d) => d.id),
      ).toEqual(["duv-2"]);
    });

    it("normalizarDuvida normaliza relações vindas como array, objeto ou nulo do Supabase", () => {
      const comArray = normalizarDuvida({
        ...DUVIDAS_FIXTURE[0],
        aluno: [{ nome: "Aluno A", email: "a@ufjf.br", foto_url: null }],
        professor: [{ nome: "Prof. Marco" }],
        turma: [{ materia: "Engenharia", turma: "A" }],
      });
      expect(comArray.aluno?.nome).toBe("Aluno A");
      expect(comArray.professor?.nome).toBe("Prof. Marco");
      expect(comArray.turma?.materia).toBe("Engenharia");

      const comNulo = normalizarDuvida({
        ...DUVIDAS_FIXTURE[0],
        aluno: null,
        professor: null,
        turma: null,
      });
      expect(comNulo.aluno).toBeUndefined();
      expect(comNulo.professor).toBeUndefined();
      expect(comNulo.turma).toBeUndefined();
    });
  });

  describe("Integração dos Hooks com Strategy (usePesquisa e useDuvidas)", () => {
    it("usePesquisa alterna abas, filtra por texto e aciona aoFecharPesquisa apenas ao fechar o Sheet", () => {
      const aoFecharPesquisa = vi.fn();
      const perfilAluno = criarPerfilFake({
        id: "aluno-1",
        nome: "Gianlucca",
        role: "aluno",
      });

      const { result } = renderHook(() =>
        usePesquisa({
          aoFecharPesquisa,
          turmas: TURMAS_FIXTURE,
          perfil: perfilAluno,
          estaInscrito: (key) => key === "t_eng",
        }),
      );

      // Aba inicial: "minhas" -> apenas t_eng
      expect(result.current.abaAtiva).toBe("minhas");
      expect(result.current.turmasOrdenadas.map(([k]) => k)).toEqual(["t_eng"]);
      expect(result.current.turmasFiltradas).toEqual([]);

      // Troca para "disponiveis" -> t_alg, t_bd em ordem alfabética
      act(() => {
        result.current.setAbaAtiva("disponiveis");
      });
      expect(result.current.turmasOrdenadas.map(([k]) => k)).toEqual([
        "t_alg",
        "t_bd",
      ]);

      // Digita termo de pesquisa "Banco"
      act(() => {
        result.current.setTextoPesquisa("Banco");
      });
      expect(result.current.turmasFiltradas.map(([k]) => k)).toEqual(["t_bd"]);
      expect(result.current.turmasOrdenadas.map(([k]) => k)).toEqual(["t_bd"]);

      // Abertura/fechamento do Sheet
      act(() => {
        result.current.mudarAberturaSheet(true);
      });
      expect(aoFecharPesquisa).not.toHaveBeenCalled();

      act(() => {
        result.current.mudarAberturaSheet(false);
      });
      expect(result.current.aberto).toBe(false);
      expect(aoFecharPesquisa).toHaveBeenCalledTimes(1);
    });

    it("useDuvidas aplica estratégias de perfil e status, calcula totalDuvidasPendentes e reseta filtro ao trocar perfil", () => {
      const perfilProf = criarPerfilFake({
        id: "prof-1",
        nome: "Prof. Marco",
        role: "professor",
      });
      const perfilMaster = criarPerfilFake({
        id: "m-1",
        nome: "Admin",
        role: "master",
      });

      const { result, rerender } = renderHook(
        ({ perfil }) => useDuvidas(perfil, DUVIDAS_FIXTURE),
        { initialProps: { perfil: perfilProf as PerfilUsuario | null } },
      );

      expect(result.current.duvidasFiltradas.map((d) => d.id)).toEqual([
        "duv-1",
        "duv-3",
      ]);
      expect(result.current.totalDuvidasPendentes).toBe(2);

      act(() => {
        result.current.setFiltro("resolvidas");
      });
      expect(result.current.filtro).toBe("resolvidas");
      expect(result.current.duvidasFiltradasPorStatus).toEqual([]);

      // Ao trocar o perfil, o filtro deve resetar automaticamente para "todas"
      rerender({ perfil: perfilMaster });
      expect(result.current.filtro).toBe("todas");
      expect(result.current.duvidasFiltradasPorStatus).toHaveLength(3);
    });
  });
});
