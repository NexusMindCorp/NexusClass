-- =========================================================================
-- FUNÇÃO RPC PARA DELEÇÃO DE CONTA DO ALUNO (COM TRAVA DE SEGURANÇA)
-- =========================================================================

-- Cria a função com SECURITY DEFINER para permitir acesso ao schema 'auth'
-- e restringe o search_path para evitar vetores de ataque a funções PRIVILEGED.
create or replace function public.deletar_propria_conta()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  usuario_id uuid;
  usuario_role text;
begin
  -- Obtém o ID do usuário autenticado a partir do contexto JWT do Supabase
  usuario_id := auth.uid();
  
  if usuario_id is null then
    raise exception 'Usuário não autenticado no banco de dados';
  end if;

  -- Busca a role do usuário logado na tabela de perfis
  select role::text into usuario_role 
  from public.perfis 
  where id = usuario_id;

  -- Trava de segurança: apenas usuários com a role 'aluno' podem se auto-excluir
  if usuario_role is null or usuario_role != 'aluno' then
    raise exception 'Ação não permitida: apenas contas de alunos podem ser deletadas.';
  end if;

  -- 1. Deletar entregas de atividades feitas pelo aluno
  delete from public.entregas_atividades where aluno_id = usuario_id;

  -- 2. Deletar dúvidas postadas pelo aluno
  delete from public.duvidasalunostoprofessor where aluno_id = usuario_id;

  -- 3. Deletar histórico de mensagens (enviadas ou recebidas)
  delete from public.mensagens where remetente_id = usuario_id or destinatario_id = usuario_id;

  -- 4. Deletar posts no mural feitos pelo aluno
  delete from public.mural_posts where autor_id = usuario_id;

  -- 5. Deletar eventos pessoais do calendário criados pelo aluno
  delete from public.eventos_calendario where autor_id = usuario_id;

  -- 6. Deletar matrículas do aluno em turmas
  delete from public.aluno_turma where aluno_id = usuario_id;

  -- 7. Deletar o perfil público do aluno
  delete from public.perfis where id = usuario_id;

  -- 8. Deletar o usuário das credenciais de autenticação (auth.users)
  delete from auth.users where id = usuario_id;
end;
$$;

-- Revoga a execução da função de todos os usuários (por padrão, qualquer um pode executar)
revoke execute on function public.deletar_propria_conta() from public, anon;

-- Concede permissão de execução exclusivamente para usuários autenticados
grant execute on function public.deletar_propria_conta() to authenticated;

-- Força o PostgREST a recarregar o cache do schema
select pg_notify('pgrst', 'reload schema');
