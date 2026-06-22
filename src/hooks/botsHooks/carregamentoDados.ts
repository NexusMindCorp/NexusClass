import { useCallback } from "react";
import { hojeChaveLocal, formatarDataCurta } from "@/lib/utils.ts";
import type { EventoCalendarioChat } from "./type";

export function CarregamentoDados(
  listaEscolar: any,
  hasSupabaseConfig: boolean,
  supabase: any,
  perfilId: string | null,
  inscricoesStr: string | null,
  perfilRole: string | null
) {
  const obterPostsProfessor = useCallback(async (): Promise<string> => {
    if (!hasSupabaseConfig || !supabase || !perfilId) {
      return "Nenhuma postagem recente de professor disponível.";
    }
    try {
      const idTurmas = inscricoesStr ? inscricoesStr.split(',') : [];
      if (idTurmas.length === 0) {
        return "Nenhuma postagem recente de professor disponível, pois o usuário não está inscrito em nenhuma turma.";
      }
      const { data, error } = await supabase
        .from("mural_posts")
        .select(`
          conteudo,
          created_at,
          perfis:autor_id (
            nome,
            role
          )
        `)
        .in('turma_id', idTurmas)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao carregar posts do mural:", error);
        return "Erro ao carregar os avisos do professor.";
      }

      const filtraPost = (data ?? [])
        .filter((post: any) => {
          const autor = Array.isArray(post.perfis) ? post.perfis[0] : post.perfis;
          return autor?.role === 'professor' || autor?.role === 'master';
        })
        .map((post: any) => {
          const autor = Array.isArray(post.perfis) ? post.perfis[0] : post.perfis;
          return `- ${post.conteudo} (por ${autor?.nome || 'Professor'})`;
        });

      if (filtraPost.length === 0) {
        return "Nenhuma postagem recente de professor disponível nas turmas do usuário.";
      }
      return `Conteúdos e avisos abordados pelos professores em aula:\n${filtraPost.join('\n')}`;
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
      let query = supabase
        .from('duvidasalunostoprofessor')
        .select('assunto,descricao,resposta,resolvido');

      if (perfilRole === 'aluno') {
        query = query.eq('aluno_id', perfilId);
      } else if (perfilRole === 'professor') {
        query = query.eq('prof_id', perfilId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar dúvidas:", error);
        return "Nenhuma dúvida cadastrada no momento por falha ao carregar.";
      }

      if (!data || data.length === 0) {
        return "Nenhuma dúvida cadastrada no momento.";
      }

      return `Dúvidas cadastradas pelo usuário:\n${data.map((item: any) => `- Assunto: ${item.assunto} | Descrição: ${item.descricao} | Status: ${item.resolvido ? 'Resolvido' : 'Pendente'} ${item.resposta ? `| Resposta do Professor: ${item.resposta}` : ''}`).join('\n')}\nSe a dúvida foi persistida, tente reexplicar baseado na resposta do professor, caso exista, e se a dúvida foi resolvida ou não. Se a dúvida for recorrente ou tiver uma resposta interessante, use como base para ajudar o usuário.`;
    } catch (error) {
      console.error(error);
      return "Erro ao carregar dúvidas.";
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
      let query = supabase
        .from('eventos_calendario')
        .select('titulo,descricao,data,horario')
        .gte('data', hojeChaveLocal());

      if (perfilRole !== 'master') {
        const idsTurmas = inscricoesStr ? inscricoesStr.split(',') : [];
        if (idsTurmas.length > 0) {
          query = query.or(`and(tipo.eq.pessoal,autor_id.eq.${perfilId}),and(tipo.eq.turma,turma_id.in.(${idsTurmas.join(',')}))`);
        } else {
          query = query.eq('tipo', 'pessoal').eq('autor_id', perfilId);
        }
      }

      const { data, error } = await query
        .order('data', { ascending: true })
        .order('horario', { ascending: true, nullsFirst: false })
        .limit(10);

      if (error) {
        return "Agenda indisponível no momento por falha ao carregar eventos.";
      }

      const eventos = (data ?? []) as EventoCalendarioChat[];
      if (eventos.length === 0) {
        return "Nenhum evento futuro cadastrado no calendário.";
      }

      const linhas = eventos.map((evento, index) => {
        const horario = evento.horario ? ` às ${evento.horario}` : '';
        const descricao = evento.descricao?.trim() ? ` - ${evento.descricao.trim()}` : '';
        return `${index + 1}. ${evento.titulo} em ${formatarDataCurta(evento.data)}${horario}${descricao}`;
      });

      return `Próximos eventos do usuário (com dia, mês e ano):\n${linhas.join('\n')}`;
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      return "Erro ao carregar eventos do calendário.";
    }
  }, [perfilId, perfilRole, inscricoesStr, hasSupabaseConfig, supabase]);

  const obterAtividadesAbertas = useCallback(async (): Promise<string> => {
    if (!hasSupabaseConfig || !supabase || !perfilId) {
      return "Atividades indisponíveis.";
    }

    try {
      if (perfilRole === 'aluno') {
        const idTurmas = inscricoesStr ? inscricoesStr.split(',') : [];
        if (idTurmas.length === 0) {
          return "Nenhuma atividade em aberto, pois o aluno não está inscrito em nenhuma turma.";
        }

        const { data: atividades, error: errAtiv } = await supabase
          .from('atividades')
          .select('id, titulo, descricao, data_entrega, turma_id')
          .in('turma_id', idTurmas);

        if (errAtiv) throw errAtiv;

        const { data: entregas, error: errEntr } = await supabase
          .from('entregas_atividades')
          .select('atividade_id')
          .eq('aluno_id', perfilId);

        if (errEntr) throw errEntr;

        const idsEntregues = new Set((entregas || []).map((e: any) => e.atividade_id));
        const abertas = (atividades || []).filter((a: any) => !idsEntregues.has(a.id));

        if (abertas.length === 0) {
          return "Parabéns! O aluno não possui nenhuma atividade em aberto.";
        }

        const linhas = abertas.map((a: any) => {
          const materia = listaEscolar?.[a.turma_id]?.materia || 'Matéria desconhecida';
          const prazo = a.data_entrega ? formatarDataCurta(a.data_entrega) : 'Sem prazo';
          const desc = a.descricao?.trim() ? ` - ${a.descricao.trim()}` : '';
          return `- [${materia}] ${a.titulo} (Prazo: ${prazo})${desc}`;
        });

        return `Atividades pendentes de entrega pelo aluno:\n${linhas.join('\n')}`;
      } else if (perfilRole === 'professor') {
        const { data: atividades, error: errAtiv } = await supabase
          .from('atividades')
          .select('id, titulo, data_entrega, turma_id')
          .eq('professor_id', perfilId);

        if (errAtiv) throw errAtiv;

        if (!atividades || atividades.length === 0) {
          return "O professor não possui atividades cadastradas.";
        }

        const linhas = atividades.map((a: any) => {
          const materia = listaEscolar?.[a.turma_id]?.materia || 'Matéria desconhecida';
          const prazo = a.data_entrega ? formatarDataCurta(a.data_entrega) : 'Sem prazo';
          return `- [${materia}] ${a.titulo} (Prazo de entrega: ${prazo})`;
        });

        return `Atividades cadastradas pelo professor:\n${linhas.join('\n')}`;
      } else {
        return "Sem atividades relevantes para o perfil atual.";
      }
    } catch (error) {
      console.error('Erro ao carregar atividades em aberto:', error);
      return "Não foi possível carregar as atividades em aberto devido a uma falha de conexão.";
    }
  }, [perfilId, perfilRole, inscricoesStr, listaEscolar, hasSupabaseConfig, supabase]);

  return {
    obterResumoEventos,
    obterDuvidas,
    obterAtividadesAbertas,
    obterPostsProfessor,
  };
}