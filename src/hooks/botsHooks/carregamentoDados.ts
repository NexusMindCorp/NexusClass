import { useCallback, useState } from "react";
import { hojeChaveLocal, formatarDataCurta } from "@/lib/utils.ts";
import type { EventoCalendarioChat } from "./type";

export function CarregamentoDados( listaEscolar: any,hasSupabaseConfig: boolean, supabase: any, perfilId: string | null, inscricoesStr: string | null, perfilRole: string | null) {
    const [resumoEventosCalendario, setResumoEventosCalendario] = useState<string>('Eventos do calendário ainda não carregados.');
    const [perguntasFrequentes, setPerguntasFrequentes] = useState<string>('Carregando perguntas frequentes...');
    const [resumoAtividadesAbertas, setResumoAtividadesAbertas] = useState<string>('Atividades em aberto ainda não carregadas.');
    const [resumoPostProfessor, setResumoPostProfessor] = useState<string>('Nenhuma postagem recente de professor disponível.');
    
    const carregarPostsProfessor = useCallback(async () => {
        if (!hasSupabaseConfig || !supabase || !perfilId) {
            return;
        }
        try{
          const idTurmas = inscricoesStr ? inscricoesStr.split(',') : [];
          if(idTurmas.length === 0) {
            setResumoPostProfessor('Nenhuma postagem recente de professor disponível, pois o usuário não está inscrito em nenhuma turma.');
            return;
          }
          const { data, error } = await supabase
          .from("mural_posts")
          .select(`
            conteudo,
            created_at,
            perfis:autor_id (
              nome,
              role
              )`
          )
          .in('turma_id', idTurmas)
          .order('created_at', { ascending: false })
          if(error) console.error("Erro ao carregar posts do mural:", error);
    
          const filtraPost = (data ?? [])
          .filter((post: any) => {                                         
                const autor = Array.isArray(post.perfis) ? post.perfis[0] :    
                post.perfis;                                                             
                return autor?.role === 'professor' || autor?.role === 'master';
              }).map((post: any) => {
                const autor = Array.isArray(post.perfis) ? post.perfis[0] : post.perfis;
                return `- ${post.conteudo} (por ${autor?.nome || 'Professor'})`;
              });
              if(filtraPost.length === 0) {
                setResumoPostProfessor('Nenhuma postagem recente de professor disponível nas turmas do usuário.');
                return;
              }
              setResumoPostProfessor(`Conteúdos e avisos abordados pelos professores em aula:\n${filtraPost.join('\n')}`)         
        }catch(error){
          console.error("Erro ao carregar posts do mural:", error);
          setResumoPostProfessor('Nenhuma postagem recente de professor disponível por falha ao carregar.');
        }
      }, [perfilId, inscricoesStr]);

    const perguntas = useCallback(async () => {
        if (!hasSupabaseConfig || !supabase) {
          return;
        }
        if (!perfilId || !perfilRole) {
          setPerguntasFrequentes('Perfil do usuário não identificado. Não foi possível carregar dúvidas.');
          return;
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
            setPerguntasFrequentes('Nenhuma dúvida cadastrada no momento por falha ao carregar.');
            return;
          }
    
          setPerguntasFrequentes(
            `Leve em consideração as seguintes dúvidas cadastradas pelo usuário:
    ${data && data.length > 0 ? data.map((item: any) => `- Assunto: ${item.assunto} | Descrição: ${item.descricao} | Status: ${item.resolvido ? 'Resolvido' : 'Pendente'} ${item.resposta ? `| Resposta do Professor: ${item.resposta}` : ''}`).join('\n') : 'Nenhuma dúvida cadastrada no momento.'}
    Se a duvida foi persistida, tente reexplicar baseado na resposta do professor, caso exista, e se a duvida foi resolvida ou não. Se a dúvida for recorrente ou tiver uma resposta interessante, use como base para ajudar o usuário.
    `
          );
        } catch (error) {
          console.error(error);
        }
      }, [perfilId, perfilRole]);

    const carregarResumoEventos = useCallback(async () => {
        if (!hasSupabaseConfig || !supabase) {
          setResumoEventosCalendario('Agenda indisponível: integração com calendário não configurada.');
          return;
        }
    
        if (!perfilId) {
          setResumoEventosCalendario('Eventos do calendário ainda não carregados: perfil do usuário não identificado.');
          return;
        }
    
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
          setResumoEventosCalendario('Agenda indisponível no momento por falha ao carregar eventos.');
          return;
        }
    
        const eventos = (data ?? []) as EventoCalendarioChat[];
        if (eventos.length === 0) {
          setResumoEventosCalendario('Nenhum evento futuro cadastrado no calendário.');
          return;
        }
    
        const linhas = eventos.map((evento, index) => {
          const horario = evento.horario ? ` às ${evento.horario}` : '';
          const descricao = evento.descricao?.trim() ? ` - ${evento.descricao.trim()}` : '';
          return `${index + 1}. ${evento.titulo} em ${formatarDataCurta(evento.data)}${horario}${descricao}`;
        });
    
        setResumoEventosCalendario(`Sempre deve ser dito com dia, mês e ano os próximos eventos do aluno:\n${linhas.join('\n')}`);
      }, [perfilId, perfilRole, inscricoesStr]);
    
    const carregarAtividadesAbertas = useCallback(async () => {
        if (!hasSupabaseConfig || !supabase || !perfilId) {
            return;
        }
    
        try {
          if (perfilRole === 'aluno') {
            const idTurmas = inscricoesStr ? inscricoesStr.split(',') : [];
            if (idTurmas.length === 0) {
              setResumoAtividadesAbertas('Nenhuma atividade em aberto, pois o aluno não está inscrito em nenhuma turma.');
              return;
            }
    
            // 1. Buscar todas as atividades das turmas do aluno
            const { data: atividades, error: errAtiv } = await supabase
              .from('atividades')
              .select('id, titulo, descricao, data_entrega, turma_id')
              .in('turma_id', idTurmas);
    
            if (errAtiv) throw errAtiv;
    
            // 2. Buscar as entregas já feitas por esse aluno
            const { data: entregas, error: errEntr } = await supabase
              .from('entregas_atividades')
              .select('atividade_id')
              .eq('aluno_id', perfilId);
    
            if (errEntr) throw errEntr;
    
            const idsEntregues = new Set((entregas || []).map((e: any) => e.atividade_id));
    
            // 3. Filtrar as que não foram entregues
            const abertas = (atividades || []).filter((a: any) => !idsEntregues.has(a.id));
    
            if (abertas.length === 0) {
              setResumoAtividadesAbertas('Parabéns! O aluno não possui nenhuma atividade em aberto.');
              return;
            }
    
            const linhas = abertas.map((a: any) => {
              const materia = listaEscolar?.[a.turma_id]?.materia || 'Matéria desconhecida';
              const prazo = a.data_entrega ? formatarDataCurta(a.data_entrega) : 'Sem prazo';
              const desc = a.descricao?.trim() ? ` - ${a.descricao.trim()}` : '';
              return `- [${materia}] ${a.titulo} (Prazo: ${prazo})${desc}`;
            });
    
            setResumoAtividadesAbertas(`Atividades pendentes de entrega pelo aluno:\n${linhas.join('\n')}`);
          } else if (perfilRole === 'professor') {
            // Professor: Listar atividades cadastradas por ele
            const { data: atividades, error: errAtiv } = await supabase
              .from('atividades')
              .select('id, titulo, data_entrega, turma_id')
              .eq('professor_id', perfilId);
    
            if (errAtiv) throw errAtiv;
    
            if (!atividades || atividades.length === 0) {
              setResumoAtividadesAbertas('O professor não possui atividades cadastradas.');
              return;
            }
    
            const linhas = atividades.map((a: any) => {
              const materia = listaEscolar?.[a.turma_id]?.materia || 'Matéria desconhecida';
              const prazo = a.data_entrega ? formatarDataCurta(a.data_entrega) : 'Sem prazo';
              return `- [${materia}] ${a.titulo} (Prazo de entrega: ${prazo})`;
            });
    
            setResumoAtividadesAbertas(`Atividades cadastradas pelo professor:\n${linhas.join('\n')}`);
          } else {
            setResumoAtividadesAbertas('Sem atividades relevantes para o perfil atual.');
          }
        } catch (error) {
          console.error('Erro ao carregar atividades em aberto:', error);
          setResumoAtividadesAbertas('Não foi possível carregar as atividades em aberto devido a uma falha de conexão.');
        }
      }, [perfilId, perfilRole, inscricoesStr, listaEscolar]);

    return { resumoEventosCalendario, perguntasFrequentes, resumoAtividadesAbertas, resumoPostProfessor, carregarResumoEventos, perguntas, carregarAtividadesAbertas, carregarPostsProfessor };
}