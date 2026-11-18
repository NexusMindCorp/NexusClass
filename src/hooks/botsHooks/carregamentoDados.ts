import { useCallback } from "react";
import { hojeChaveLocal, formatarDataCurta } from "@/lib/utils.ts";
import {
  atividadeRepository,
  comunicacaoRepository,
  duvidaRepository,
  muralRepository,
} from "@/repositories";
import type { EventoCalendarioChat } from "./type";

export function CarregamentoDados(
  listaEscolar: Record<string, { materia?: string }> | null | undefined,
  hasSupabaseConfig: boolean,
  supabase: unknown,
  perfilId: string | null,
  inscricoesStr: string | null,
  perfilRole: string | null,
) {
  const obterPostsProfessor = useCallback(async (): Promise<string> => {
    if (!hasSupabaseConfig || !supabase || !perfilId) {
      return "Nenhuma postagem recente de professor disponível.";
    }
    try {
      const idTurmas = inscricoesStr ? inscricoesStr.split(",").filter(Boolean) : [];
      if (idTurmas.length === 0) {
        return "Nenhuma postagem recente de professor disponível, pois o usuário não está inscrito em nenhuma turma.";
      }

      const posts = await muralRepository.listarPostsProfessorBot(idTurmas);
      if (posts.length === 0) {
        return "Nenhuma postagem recente de professor disponível nas turmas do usuário.";
      }

      const linhas = posts.map(
        (post) => `- ${post.conteudo} (por ${post.autorNome})`,
      );
      return `Conteúdos e avisos abordados pelos professores em aula:\n${linhas.join("\n")}`;
    } catch (error) {
      console.error("Erro ao carregar posts do mural:", error);
      return "Nenhuma postagem recente de professor disponível por falha ao carregar.";
    }
  }, [perfilId, inscricoesStr, hasSupabaseConfig, supabase]);

  const obterDuvidas = useCallback(async (): Promise<string> => {
    if (!hasSupabaseConfig || !supabase) {
      return "Nenhuma dúvida cadastrada no momento.";
    }
    if (!perfilId || !perfilRole) {
      return "Perfil do usuário não identificado. Não foi possível carregar dúvidas.";
    }
    try {
      const data = await duvidaRepository.listarResumoBot(perfilId, perfilRole);
      if (data.length === 0) {
        return "Nenhuma dúvida cadastrada no momento.";
      }

      return `Dúvidas cadastradas pelo usuário:\n${data
        .map(
          (item) =>
            `- Assunto: ${item.assunto} | Descrição: ${item.descricao} | Status: ${item.resolvido ? "Resolvido" : "Pendente"} ${item.resposta ? `| Resposta do Professor: ${item.resposta}` : ""}`,
        )
        .join("\n")}\nSe a dúvida foi persistida, tente reexplicar baseado na resposta do professor, caso exista, e se a dúvida foi resolvida ou não. Se a dúvida for recorrente ou tiver uma resposta interessante, use como base para ajudar o usuário.`;
    } catch (error) {
      console.error("Erro ao buscar dúvidas:", error);
      return "Nenhuma dúvida cadastrada no momento por falha ao carregar.";
    }
  }, [perfilId, perfilRole, hasSupabaseConfig, supabase]);

  const obterResumoEventos = useCallback(async (): Promise<string> => {
    if (!hasSupabaseConfig || !supabase) {
      return "Agenda indisponível: integração com calendário não configurada.";
    }

    if (!perfilId) {
      return "Eventos do calendário ainda não carregados: perfil do usuário não identificado.";
    }

    try {
      const idsTurmas = inscricoesStr ? inscricoesStr.split(",").filter(Boolean) : [];
      const eventos: EventoCalendarioChat[] =
        await comunicacaoRepository.listarEventosBot(
          perfilId,
          perfilRole || "aluno",
          idsTurmas,
          hojeChaveLocal(),
          10,
        );

      if (eventos.length === 0) {
        return "Nenhum evento futuro cadastrado no calendário.";
      }

      const linhas = eventos.map((evento, index) => {
        const horario = evento.horario ? ` às ${evento.horario}` : "";
        const descricao = evento.descricao?.trim()
          ? ` - ${evento.descricao.trim()}`
          : "";
        return `${index + 1}. ${evento.titulo} em ${formatarDataCurta(evento.data)}${horario}${descricao}`;
      });

      return `Próximos eventos do usuário (com dia, mês e ano):\n${linhas.join("\n")}`;
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      return "Agenda indisponível no momento por falha ao carregar eventos.";
    }
  }, [perfilId, perfilRole, inscricoesStr, hasSupabaseConfig, supabase]);

  const obterAtividadesAbertas = useCallback(async (): Promise<string> => {
    if (!hasSupabaseConfig || !supabase || !perfilId) {
      return "Atividades indisponíveis.";
    }

    try {
      const idsTurmas = inscricoesStr ? inscricoesStr.split(",").filter(Boolean) : [];

      if (perfilRole === "aluno") {
        if (idsTurmas.length === 0) {
          return "Nenhuma atividade em aberto, pois o aluno não está inscrito em nenhuma turma.";
        }

        const abertas = await atividadeRepository.listarResumoBot(
          perfilId,
          perfilRole,
          idsTurmas,
        );
        if (abertas.length === 0) {
          return "Parabéns! O aluno não possui nenhuma atividade em aberto.";
        }

        const linhas = abertas.map((a) => {
          const materia = listaEscolar?.[a.turma_id]?.materia || "Matéria desconhecida";
          const prazo = a.data_entrega ? formatarDataCurta(a.data_entrega) : "Sem prazo";
          const desc = a.descricao?.trim() ? ` - ${a.descricao.trim()}` : "";
          return `- [${materia}] ${a.titulo} (Prazo: ${prazo})${desc}`;
        });

        return `Atividades pendentes de entrega pelo aluno:\n${linhas.join("\n")}`;
      }

      if (perfilRole === "professor") {
        const atividades = await atividadeRepository.listarResumoBot(
          perfilId,
          perfilRole,
          idsTurmas,
        );
        if (atividades.length === 0) {
          return "O professor não possui atividades cadastradas.";
        }

        const linhas = atividades.map((a) => {
          const materia = listaEscolar?.[a.turma_id]?.materia || "Matéria desconhecida";
          const prazo = a.data_entrega ? formatarDataCurta(a.data_entrega) : "Sem prazo";
          return `- [${materia}] ${a.titulo} (Prazo de entrega: ${prazo})`;
        });

        return `Atividades cadastradas pelo professor:\n${linhas.join("\n")}`;
      }

      return "Sem atividades relevantes para o perfil atual.";
    } catch (error) {
      console.error("Erro ao carregar atividades para o bot:", error);
      return "Erro ao carregar atividades.";
    }
  }, [perfilId, perfilRole, inscricoesStr, listaEscolar, hasSupabaseConfig, supabase]);

  return {
    obterPostsProfessor,
    obterDuvidas,
    obterResumoEventos,
    obterAtividadesAbertas,
  };
}
