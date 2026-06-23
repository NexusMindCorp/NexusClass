alter table public.eventos_calendario
  add column if not exists autor_id uuid references public.perfis(id) on delete cascade,
  add column if not exists tipo text not null default 'pessoal',
  add column if not exists turma_id uuid references public.turmas_escolares(id) on delete cascade;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'eventos_calendario_tipo_valido'
      and conrelid = 'public.eventos_calendario'::regclass
  ) then
    alter table public.eventos_calendario
      add constraint eventos_calendario_tipo_valido
      check (tipo in ('pessoal', 'turma'))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'eventos_calendario_escopo_valido'
      and conrelid = 'public.eventos_calendario'::regclass
  ) then
    alter table public.eventos_calendario
      add constraint eventos_calendario_escopo_valido
      check (
        (tipo = 'pessoal' and turma_id is null)
        or
        (tipo = 'turma' and turma_id is not null)
      )
      not valid;
  end if;
end;
$$;

create index if not exists idx_eventos_calendario_autor_id
  on public.eventos_calendario (autor_id);

create index if not exists idx_eventos_calendario_turma_id
  on public.eventos_calendario (turma_id);

create index if not exists idx_eventos_calendario_tipo_data
  on public.eventos_calendario (tipo, data);

create schema if not exists internal;
grant usage on schema internal to authenticated, service_role;

create or replace function internal.usuario_pode_acessar_evento_calendario(
  evento_autor_id uuid,
  evento_tipo text,
  evento_turma_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (select auth.uid()) is not null
    and (
      (
        evento_tipo = 'pessoal'
        and evento_autor_id = (select auth.uid())
      )
      or
      (
        evento_tipo = 'turma'
        and evento_turma_id is not null
        and (
          evento_autor_id = (select auth.uid())
          or exists (
            select 1
            from public.perfis
            where id = (select auth.uid())
              and role = 'master'
          )
          or exists (
            select 1
            from public.aluno_turma
            where aluno_id = (select auth.uid())
              and turma_id = evento_turma_id
          )
          or exists (
            select 1
            from public.professor_turma
            where professor_id = (select auth.uid())
              and turma_id = evento_turma_id
          )
        )
      )
    );
$$;

create or replace function internal.usuario_pode_criar_evento_turma(
  evento_turma_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (select auth.uid()) is not null
    and evento_turma_id is not null
    and (
      exists (
        select 1
        from public.perfis
        where id = (select auth.uid())
          and role = 'master'
      )
      or exists (
        select 1
        from public.professor_turma
        where professor_id = (select auth.uid())
          and turma_id = evento_turma_id
      )
    );
$$;

create or replace function internal.usuario_pode_remover_evento_calendario(
  evento_autor_id uuid,
  evento_tipo text,
  evento_turma_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (select auth.uid()) is not null
    and (
      evento_autor_id = (select auth.uid())
      or exists (
        select 1
        from public.perfis
        where id = (select auth.uid())
          and role = 'master'
      )
      or (
        evento_tipo = 'turma'
        and evento_turma_id is not null
        and exists (
          select 1
          from public.professor_turma
          where professor_id = (select auth.uid())
            and turma_id = evento_turma_id
        )
      )
    );
$$;

revoke all on function internal.usuario_pode_acessar_evento_calendario(uuid, text, uuid) from public, anon;
revoke all on function internal.usuario_pode_criar_evento_turma(uuid) from public, anon;
revoke all on function internal.usuario_pode_remover_evento_calendario(uuid, text, uuid) from public, anon;

grant execute on function internal.usuario_pode_acessar_evento_calendario(uuid, text, uuid) to authenticated, service_role;
grant execute on function internal.usuario_pode_criar_evento_turma(uuid) to authenticated, service_role;
grant execute on function internal.usuario_pode_remover_evento_calendario(uuid, text, uuid) to authenticated, service_role;

alter table public.eventos_calendario enable row level security;
alter table public.alertas_calendario enable row level security;

do $$
declare
  politica record;
begin
  for politica in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'eventos_calendario'
  loop
    execute format(
      'drop policy if exists %I on public.eventos_calendario',
      politica.policyname
    );
  end loop;

  for politica in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'alertas_calendario'
  loop
    execute format(
      'drop policy if exists %I on public.alertas_calendario',
      politica.policyname
    );
  end loop;
end;
$$;

drop function if exists public.usuario_pode_acessar_evento_calendario(uuid, text, uuid);
drop function if exists public.usuario_pode_criar_evento_turma(uuid);
drop function if exists public.usuario_pode_remover_evento_calendario(uuid, text, uuid);

create policy "Calendario: visualizar eventos autorizados"
on public.eventos_calendario
for select
to authenticated
using (
  internal.usuario_pode_acessar_evento_calendario(autor_id, tipo, turma_id)
);

create policy "Calendario: criar eventos autorizados"
on public.eventos_calendario
for insert
to authenticated
with check (
  autor_id = (select auth.uid())
  and (
    (tipo = 'pessoal' and turma_id is null)
    or
    (
      tipo = 'turma'
      and internal.usuario_pode_criar_evento_turma(turma_id)
    )
  )
);

create policy "Calendario: remover eventos autorizados"
on public.eventos_calendario
for delete
to authenticated
using (
  internal.usuario_pode_remover_evento_calendario(autor_id, tipo, turma_id)
);

create policy "Calendario: visualizar alertas autorizados"
on public.alertas_calendario
for select
to authenticated
using (
  exists (
    select 1
    from public.eventos_calendario evento
    where evento.id = alertas_calendario.evento_id
      and internal.usuario_pode_acessar_evento_calendario(
        evento.autor_id,
        evento.tipo,
        evento.turma_id
      )
  )
);

revoke all on table public.eventos_calendario from anon;
revoke all on table public.alertas_calendario from anon;

revoke all on table public.eventos_calendario from authenticated;
revoke all on table public.alertas_calendario from authenticated;

grant select, insert, delete on table public.eventos_calendario to authenticated;
grant select on table public.alertas_calendario to authenticated;

create or replace function public.remover_eventos_calendario_expirados()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.eventos_calendario
  where
    data < (timezone('America/Sao_Paulo', now()))::date
    or (
      data = (timezone('America/Sao_Paulo', now()))::date
      and horario is not null
      and (data + horario) < timezone('America/Sao_Paulo', now())
    );
$$;

revoke execute on function public.remover_eventos_calendario_expirados() from public, anon, authenticated;
grant execute on function public.remover_eventos_calendario_expirados() to service_role;

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'remover-eventos-calendario-expirados'
  ) then
    perform cron.unschedule('remover-eventos-calendario-expirados');
  end if;

  perform cron.schedule(
    'remover-eventos-calendario-expirados',
    '* * * * *',
    'select public.remover_eventos_calendario_expirados();'
  );
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'alertas_calendario'
  ) then
    alter publication supabase_realtime add table public.alertas_calendario;
  end if;
end;
$$;

select pg_notify('pgrst', 'reload schema');
