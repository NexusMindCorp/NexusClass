create extension if not exists pgcrypto;
create extension if not exists pg_cron;

create table if not exists public.eventos_calendario (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null default '',
  data date not null,
  horario time,
  created_at timestamptz not null default now()
);

create table if not exists public.alertas_calendario (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos_calendario(id) on delete cascade,
  titulo_evento text not null,
  mensagem text not null,
  minutos_antes integer not null,
  lembrete_para timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.alertas_calendario
  add column if not exists minutos_antes integer;

update public.alertas_calendario
set minutos_antes = 5
where minutos_antes is null;

alter table public.alertas_calendario
  alter column minutos_antes set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'alertas_calendario_minutos_validos'
  ) then
    alter table public.alertas_calendario
      add constraint alertas_calendario_minutos_validos
      check (minutos_antes in (1, 5));
  end if;
end;
$$;

create unique index if not exists idx_alertas_calendario_evento_minutos
  on public.alertas_calendario (evento_id, minutos_antes);

create index if not exists idx_alertas_calendario_lembrete_para
  on public.alertas_calendario (lembrete_para);

grant usage on schema public to anon, authenticated;
grant select, insert, delete on table public.eventos_calendario to anon, authenticated;
grant select on table public.alertas_calendario to anon, authenticated;

alter table public.eventos_calendario enable row level security;
alter table public.alertas_calendario enable row level security;

drop policy if exists "Public read eventos_calendario" on public.eventos_calendario;
create policy "Public read eventos_calendario"
on public.eventos_calendario
for select
using (true);

drop policy if exists "Public insert eventos_calendario" on public.eventos_calendario;
create policy "Public insert eventos_calendario"
on public.eventos_calendario
for insert
with check (true);

drop policy if exists "Public delete eventos_calendario" on public.eventos_calendario;
create policy "Public delete eventos_calendario"
on public.eventos_calendario
for delete
using (true);

drop policy if exists "Public read alertas_calendario" on public.alertas_calendario;
create policy "Public read alertas_calendario"
on public.alertas_calendario
for select
using (true);

create or replace function public.processar_alertas_antecedencia()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.alertas_calendario
  where lembrete_para <= now() - interval '1 minute';

  insert into public.alertas_calendario (evento_id, titulo_evento, mensagem, minutos_antes, lembrete_para)
  select
    evento.id,
    evento.titulo,
    format(
      'Lembrete: "%s" comeca em %s minuto%s.',
      evento.titulo,
      alvo.minutos_antes,
      case when alvo.minutos_antes = 1 then '' else 's' end
    ),
    alvo.minutos_antes,
    (evento.data::timestamp + evento.horario) - make_interval(mins => alvo.minutos_antes)
  from public.eventos_calendario as evento
  cross join (values (5), (1)) as alvo(minutos_antes)
  where evento.horario is not null
    and (evento.data::timestamp + evento.horario)
      between now() + make_interval(mins => alvo.minutos_antes)
      and now() + make_interval(mins => alvo.minutos_antes + 1)
    and not exists (
      select 1
      from public.alertas_calendario as alerta
      where alerta.evento_id = evento.id
        and alerta.minutos_antes = alvo.minutos_antes
    );
end;
$$;

revoke execute on function public.processar_alertas_antecedencia() from PUBLIC, anon, authenticated;
grant execute on function public.processar_alertas_antecedencia() to service_role;

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'processar_alertas_antecedencia'
  ) then
    perform cron.unschedule('processar_alertas_antecedencia');
  end if;

  perform cron.schedule(
    'processar_alertas_antecedencia',
    '* * * * *',
    'select public.processar_alertas_antecedencia();'
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

-- Force PostgREST to refresh schema cache after creating/updating objects.
select pg_notify('pgrst', 'reload schema');
