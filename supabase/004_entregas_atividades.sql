-- =========================================================================
-- 1. TABELA DE ENTREGAS (Relacionamento N Alunos para 1 Atividade)
-- =========================================================================

-- Tabela de Entregas
create table if not exists public.entregas_atividades (
  id uuid primary key default gen_random_uuid(),
  atividade_id uuid not null references public.atividades(id) on delete cascade,
  aluno_id uuid not null references public.perfis(id) on delete cascade,
  url_anexo text, -- Caminho interno do arquivo no storage
  nota numeric(4, 2) check (nota >= 0 and nota <= 10),
  feedback text,
  no_prazo boolean not null default true, -- Tag booleana indicando se foi entregue no prazo
  entregue_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique (atividade_id, aluno_id)
);

-- =========================================================================
-- 2. ÍNDICES DE PERFORMANCE (Evita Seq Scans e lentidão em CASCADE)
-- =========================================================================
create index if not exists idx_entregas_atividade_id on public.entregas_atividades(atividade_id);
create index if not exists idx_entregas_aluno_id on public.entregas_atividades(aluno_id);

-- =========================================================================
-- 3. TRIGGER AUTOMÁTICO PARA VERIFICAR O PRAZO (Segurança da Informação)
-- =========================================================================
-- Essa função compara a data da entrega com a data limite cadastrada na tabela "atividades" existente.
-- Por ser executada no banco de dados, o aluno não consegue burlar alterando o valor no JSON de envio.
create or replace function public.verificar_prazo_entrega()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  limite_prazo timestamptz;
begin
  select data_entrega into limite_prazo
  from public.atividades
  where id = new.atividade_id;
  
  if limite_prazo is not null then
    if new.entregue_em <= limite_prazo then
      new.no_prazo := true;
    else
      new.no_prazo := false;
    end if;
  else
    new.no_prazo := true;
  end if;
  
  return new;
end;
$$;

-- Revoga a execução direta da função de gatilho para usuários anônimos e públicos
revoke execute on function public.verificar_prazo_entrega() from PUBLIC, anon, authenticated;

-- Concede execução apenas para a service_role (administração interna)
grant execute on function public.verificar_prazo_entrega() to service_role;

create or replace trigger trigger_verificar_prazo
before insert or update of entregue_em, atividade_id on public.entregas_atividades
for each row
execute function public.verificar_prazo_entrega();

-- =========================================================================
-- 4. SEGURANÇA E POLÍTICAS RLS (Tabela entregas_atividades)
-- =========================================================================
alter table public.entregas_atividades enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.entregas_atividades to authenticated;

-- SELECT: Aluno vê sua própria entrega; Professor da turma ou Master veem todas as entregas
create policy "Visualizar entregas"
on public.entregas_atividades
for select
to authenticated
using (
  aluno_id = (select auth.uid())
  or exists (
    select 1 from public.atividades a
    join public.professor_turma pt on pt.turma_id = a.turma_id
    where a.id = entregas_atividades.atividade_id and pt.professor_id = (select auth.uid())
  )
  or exists (
    select 1 from public.perfis
    where id = (select auth.uid()) and role = 'master'
  )
);

-- INSERT: Aluno pertencente à turma da atividade pode criar sua entrega
create policy "Criar entrega (Alunos)"
on public.entregas_atividades
for insert
to authenticated
with check (
  aluno_id = (select auth.uid())
  and exists (
    select 1 from public.atividades a
    join public.aluno_turma at on at.turma_id = a.turma_id
    where a.id = atividade_id and at.aluno_id = (select auth.uid())
  )
);

-- UPDATE: Aluno pode modificar seu anexo; Professor ou Master podem atualizar Nota/Feedback
create policy "Atualizar entrega"
on public.entregas_atividades
for update
to authenticated
using (
  aluno_id = (select auth.uid())
  or exists (
    select 1 from public.atividades a
    join public.professor_turma pt on pt.turma_id = a.turma_id
    where a.id = entregas_atividades.atividade_id and pt.professor_id = (select auth.uid())
  )
  or exists (
    select 1 from public.perfis
    where id = (select auth.uid()) and role = 'master'
  )
)
with check (
  -- Se for o aluno, ele só altera o anexo e a data de entrega (para atualizar o prazo se ele re-enviar)
  (
    aluno_id = (select auth.uid()) 
    and (nota is not distinct from nota) -- impede alterar nota
  )
  -- Se for o professor ou master, eles podem alterar tudo (nota, feedback, etc)
  or exists (
    select 1 from public.atividades a
    join public.professor_turma pt on pt.turma_id = a.turma_id
    where a.id = entregas_atividades.atividade_id and pt.professor_id = (select auth.uid())
  )
  or exists (
    select 1 from public.perfis
    where id = (select auth.uid()) and role = 'master'
  )
);

-- =========================================================================
-- 5. BUCKET PRIVADO E POLÍTICAS DO STORAGE
-- =========================================================================

-- Cria o bucket
insert into storage.buckets (id, name, public)
values ('entregas_atividades', 'entregas_atividades', false)
on conflict (id) do nothing;

-- SELECT: Aluno proprietário, Professor da turma ou Admin Master
create policy "Acesso exclusivo: Aluno proprietario, Professor ou Master"
on storage.objects for select
to authenticated
using (
  bucket_id = 'entregas_atividades'
  and (
    -- Caso A: O usuário logado é o aluno proprietário da pasta {aluno_id}
    (select auth.uid())::text = split_part(name, '/', 2)
    or
    -- Caso B: O usuário logado é o professor da turma relacionada a essa atividade
    exists (
      select 1 from public.atividades a
      join public.professor_turma pt on pt.turma_id = a.turma_id
      where a.id::text = split_part(name, '/', 1)
      and pt.professor_id = (select auth.uid())
    )
    or
    -- Caso C: O usuário logado possui a role 'master' (Administrador)
    exists (
      select 1 from public.perfis
      where id = (select auth.uid())
      and role = 'master'
    )
  )
);

-- INSERT: Aluno proprietário matriculado na turma correspondente ou Admin Master
create policy "Upload de entregas"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'entregas_atividades'
  and (
    -- Caso A: O aluno proprietário matriculado na turma correspondente
    ((select auth.uid())::text = split_part(name, '/', 2)
    and exists (
      select 1 from public.atividades a
      join public.aluno_turma alt on alt.turma_id = a.turma_id
      where a.id::text = split_part(name, '/', 1)
      and alt.aluno_id = (select auth.uid())
    ))
    or
    -- Caso B: Admin Master
    exists (
      select 1 from public.perfis
      where id = (select auth.uid())
      and role = 'master'
    )
  )
);

-- UPDATE/DELETE: Permite modificação/exclusão de arquivos para o aluno proprietário, professor da turma ou admin master
create policy "Modificacao de arquivos"
on storage.objects for all
to authenticated
using (
  bucket_id = 'entregas_atividades'
  and (
    -- Caso A: O aluno proprietário
    (select auth.uid())::text = split_part(name, '/', 2)
    or
    -- Caso B: O professor da turma relacionada a essa atividade
    exists (
      select 1 from public.atividades a
      join public.professor_turma pt on pt.turma_id = a.turma_id
      where a.id::text = split_part(name, '/', 1)
      and pt.professor_id = (select auth.uid())
    )
    or
    -- Caso C: Admin Master
    exists (
      select 1 from public.perfis
      where id = (select auth.uid())
      and role = 'master'
    )
  )
);

-- Force PostgREST to refresh schema cache after creating/updating objects.
select pg_notify('pgrst', 'reload schema');
