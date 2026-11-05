import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { Duvida } from "@/hooks/DuvidaHooks/type";
import type { TurmaProps } from "@/hooks/LeituraDataHooks/type";


export interface FiltroStrategy<T, Contexto = void> {
  filtrar(itens: readonly T[], contexto: Contexto): T[];
}

export type TurmaEntry = [string, TurmaProps];

export type AbaFiltroTurma = "minhas" | "disponiveis" | "todas";

export interface ContextoFiltroTurma {
  estaInscrito: (turmaKey: string) => boolean;
}

export interface OpcoesFiltroTurmas {
  textoPesquisa: string;
  abaAtiva?: AbaFiltroTurma;
  role?: PerfilUsuario["role"];
  estaInscrito?: (turmaKey: string) => boolean;
}


export class FiltroTurmaPorTextoStrategy implements FiltroStrategy<TurmaEntry, string> {
  filtrar(itens: readonly TurmaEntry[], textoPesquisa: string): TurmaEntry[] {
    const consulta = textoPesquisa.trim().toLowerCase();
    if (!consulta) {
      return [];
    }

    return itens.filter(([, turma]) => {
      return (
        turma.materia.toLowerCase().includes(consulta) ||
        turma.professor.toLowerCase().includes(consulta) ||
        turma.sala.toLowerCase().includes(consulta) ||
        turma.turma.toLowerCase().includes(consulta)
      );
    });
  }
}


export class FiltroTurmasInscritasStrategy
  implements FiltroStrategy<TurmaEntry, ContextoFiltroTurma>
{
  filtrar(itens: readonly TurmaEntry[], contexto: ContextoFiltroTurma): TurmaEntry[] {
    return itens.filter(([key]) => contexto.estaInscrito(key));
  }
}


export class FiltroTurmasDisponiveisStrategy
  implements FiltroStrategy<TurmaEntry, ContextoFiltroTurma>
{
  filtrar(itens: readonly TurmaEntry[], contexto: ContextoFiltroTurma): TurmaEntry[] {
    return itens.filter(([key]) => !contexto.estaInscrito(key));
  }
}


export class FiltroTodasTurmasStrategy
  implements FiltroStrategy<TurmaEntry, ContextoFiltroTurma>
{
  filtrar(itens: readonly TurmaEntry[]): TurmaEntry[] {
    return [...itens];
  }
}

export const filtroTurmaPorTextoStrategy = new FiltroTurmaPorTextoStrategy();
export const filtroTurmasInscritasStrategy = new FiltroTurmasInscritasStrategy();
export const filtroTurmasDisponiveisStrategy = new FiltroTurmasDisponiveisStrategy();
export const filtroTodasTurmasStrategy = new FiltroTodasTurmasStrategy();

export const ESTRATEGIAS_ABA_TURMA: Record<
  AbaFiltroTurma,
  FiltroStrategy<TurmaEntry, ContextoFiltroTurma>
> = {
  minhas: filtroTurmasInscritasStrategy,
  disponiveis: filtroTurmasDisponiveisStrategy,
  todas: filtroTodasTurmasStrategy,
};

/**
 * Seleciona a estratégia de filtragem de turmas conforme o papel do usuário e a aba ativa.
 * - Professor: visualiza apenas as turmas que leciona (`inscritas`).
 * - Master: visualiza todas as turmas (`todas`).
 * - Aluno: alterna dinamicamente entre `minhas`, `disponiveis` e `todas`.
 */
export function obterEstrategiaFiltroTurma(
  abaAtiva: AbaFiltroTurma,
  role?: PerfilUsuario["role"],
): FiltroStrategy<TurmaEntry, ContextoFiltroTurma> {
  if (role === "professor") {
    return filtroTurmasInscritasStrategy;
  }
  if (role === "master") {
    return filtroTodasTurmasStrategy;
  }
  return ESTRATEGIAS_ABA_TURMA[abaAtiva];
}

/**
 * Ordena entradas de turmas priorizando aquelas em que o usuário está inscrito,
 * preservando a ordem relativa nos demais casos.
 */
export function ordenarTurmasPorInscricao(
  itens: readonly TurmaEntry[],
  estaInscrito: (turmaKey: string) => boolean,
): TurmaEntry[] {
  return [...itens].sort(([keyA], [keyB]) => {
    const inscritoA = estaInscrito(keyA);
    const inscritoB = estaInscrito(keyB);

    if (inscritoA && !inscritoB) return -1;
    if (!inscritoA && inscritoB) return 1;
    return 0;
  });
}

/**
 * Pipeline completo de filtragem e ordenação de turmas consumido por `usePesquisa` / `Pesquisar`:
 * 1. Quando não há termo de busca, ordena todas as turmas alfabeticamente por `materia`;
 *    quando há termo de busca, aplica `FiltroTurmaPorTextoStrategy`.
 * 2. Aplica a estratégia de aba/papel selecionada por `obterEstrategiaFiltroTurma`.
 * 3. Prioriza turmas inscritas no topo via `ordenarTurmasPorInscricao`.
 */
export function filtrarEOrdenarTurmas(
  turmas: Record<string, TurmaProps>,
  opcoes: OpcoesFiltroTurmas,
): TurmaEntry[] {
  const {
    textoPesquisa,
    abaAtiva = "minhas",
    role = "aluno",
    estaInscrito = () => false,
  } = opcoes;

  const entradas = Object.entries(turmas);
  const base =
    textoPesquisa.trim() === ""
      ? [...entradas].sort((a, b) => a[1].materia.localeCompare(b[1].materia))
      : filtroTurmaPorTextoStrategy.filtrar(entradas, textoPesquisa);

  const estrategiaAba = obterEstrategiaFiltroTurma(abaAtiva, role);
  const filtradasPorAba = estrategiaAba.filtrar(base, { estaInscrito });

  return ordenarTurmasPorInscricao(filtradasPorAba, estaInscrito);
}

// ============================================================================
// 2. ESTRATÉGIAS DO DOMÍNIO DA CENTRAL DE DÚVIDAS
// ============================================================================

export type StatusFiltroDuvida = "todas" | "pendentes" | "resolvidas";

/**
 * Filtra as dúvidas visíveis de acordo com o perfil autenticado:
 * - `null`: nenhuma dúvida visível (`[]`)
 * - `master`: todas as dúvidas escolares
 * - `professor`: apenas dúvidas direcionadas ao docente (`prof_id === perfil.id`)
 * - `aluno`: apenas dúvidas abertas pelo próprio estudante (`aluno_id === perfil.id`)
 */
export class FiltroDuvidasPorPerfilStrategy
  implements FiltroStrategy<Duvida, PerfilUsuario | null>
{
  filtrar(itens: readonly Duvida[], perfil: PerfilUsuario | null): Duvida[] {
    if (!perfil) {
      return [];
    }
    if (perfil.role === "master") {
      return [...itens];
    }
    if (perfil.role === "professor") {
      return itens.filter((d) => d.prof_id === perfil.id);
    }
    return itens.filter((d) => d.aluno_id === perfil.id);
  }
}

/**
 * Retém todas as dúvidas independentemente do status de resolução.
 */
export class FiltroTodasDuvidasStrategy implements FiltroStrategy<Duvida, void> {
  filtrar(itens: readonly Duvida[]): Duvida[] {
    return [...itens];
  }
}

/**
 * Retém apenas as dúvidas pendentes (`resolvido === false`).
 */
export class FiltroDuvidasPendentesStrategy implements FiltroStrategy<Duvida, void> {
  filtrar(itens: readonly Duvida[]): Duvida[] {
    return itens.filter((d) => !d.resolvido);
  }
}

/**
 * Retém apenas as dúvidas resolvidas (`resolvido === true`).
 */
export class FiltroDuvidasResolvidasStrategy implements FiltroStrategy<Duvida, void> {
  filtrar(itens: readonly Duvida[]): Duvida[] {
    return itens.filter((d) => d.resolvido);
  }
}

export const filtroDuvidasPorPerfilStrategy = new FiltroDuvidasPorPerfilStrategy();
export const filtroTodasDuvidasStrategy = new FiltroTodasDuvidasStrategy();
export const filtroDuvidasPendentesStrategy = new FiltroDuvidasPendentesStrategy();
export const filtroDuvidasResolvidasStrategy = new FiltroDuvidasResolvidasStrategy();

export const ESTRATEGIAS_STATUS_DUVIDA: Record<
  StatusFiltroDuvida,
  FiltroStrategy<Duvida, void>
> = {
  todas: filtroTodasDuvidasStrategy,
  pendentes: filtroDuvidasPendentesStrategy,
  resolvidas: filtroDuvidasResolvidasStrategy,
};

/**
 * Seleciona a estratégia de filtragem por status de dúvida (`todas`, `pendentes`, `resolvidas`).
 */
export function obterEstrategiaStatusDuvida(
  status: StatusFiltroDuvida,
): FiltroStrategy<Duvida, void> {
  return ESTRATEGIAS_STATUS_DUVIDA[status];
}

/**
 * Compõe a estratégia de visibilidade por perfil com a estratégia de status de resolução.
 */
export function filtrarDuvidasPorPerfilEStatus(
  duvidas: readonly Duvida[],
  perfil: PerfilUsuario | null,
  status: StatusFiltroDuvida = "todas",
): Duvida[] {
  const doPerfil = filtroDuvidasPorPerfilStrategy.filtrar(duvidas, perfil);
  const estrategiaStatus = obterEstrategiaStatusDuvida(status);
  return estrategiaStatus.filtrar(doPerfil);
}
