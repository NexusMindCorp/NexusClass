-- 1. Create table duvidasalunostoprofessor
create table if not exists public.duvidasalunostoprofessor (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.perfis(id) on delete cascade,
  prof_id uuid not null references public.perfis(id) on delete cascade,
  turma_id uuid not null references public.turmas_escolares(id) on delete cascade,
  assunto text not null,
  descricao text not null,
  anexo_url text, -- supports single URL or JSON array of URLs
  resolveu boolean not null default false, -- resolved doubt flag
  created_at timestamptz not null default now()
);

-- 2. Create performance indexes for foreign keys and RLS lookup
create index if not exists idx_duvidas_aluno_id on public.duvidasalunostoprofessor(aluno_id);
create index if not exists idx_duvidas_prof_id on public.duvidasalunostoprofessor(prof_id);
create index if not exists idx_duvidas_turma_id on public.duvidasalunostoprofessor(turma_id);

-- 3. Grant table permissions to authenticated and anonymous users
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.duvidasalunostoprofessor to authenticated;

-- 4. Enable Row Level Security (RLS)
alter table public.duvidasalunostoprofessor enable row level security;

-- 5. Create Table Policies
-- SELECT: aluno_id, prof_id, or master role
create policy "Allow select for owners, professors or masters"
on public.duvidasalunostoprofessor
for select
to authenticated
using (
  aluno_id = (select auth.uid())
  or prof_id = (select auth.uid())
  or exists (
    select 1 from public.perfis
    where id = (select auth.uid())
    and role = 'master'
  )
);

-- INSERT: Only for authenticated users who are the student (aluno)
create policy "Allow insert for authenticated aluno"
on public.duvidasalunostoprofessor
for insert
to authenticated
with check (
  aluno_id = (select auth.uid())
);

-- UPDATE: Aluno owner or Professor can update
create policy "Allow update for owners or professors"
on public.duvidasalunostoprofessor
for update
to authenticated
using (
  aluno_id = (select auth.uid())
  or prof_id = (select auth.uid())
);

-- DELETE: Aluno owner, Professor, or Master
create policy "Allow delete for owners, professors or masters"
on public.duvidasalunostoprofessor
for delete
to authenticated
using (
  aluno_id = (select auth.uid())
  or prof_id = (select auth.uid())
  or exists (
    select 1 from public.perfis
    where id = (select auth.uid())
    and role = 'master'
  )
);

-- 6. Create Storage Bucket
insert into storage.buckets (id, name, public)
values ('duvidasalunostoprofessor', 'duvidasalunostoprofessor', true)
on conflict (id) do nothing;

-- 7. Create Storage RLS Policies
-- SELECT: Authenticated users can list/read only their own objects in this bucket
create policy "Allow select for authenticated in duvidasalunostoprofessor"
on storage.objects for select
to authenticated
using (bucket_id = 'duvidasalunostoprofessor' and owner = (select auth.uid()));

-- INSERT: Authenticated users can upload to this bucket only if they are the owner
create policy "Allow insert for authenticated in duvidasalunostoprofessor"
on storage.objects for insert
to authenticated
with check (bucket_id = 'duvidasalunostoprofessor' and owner = (select auth.uid()));

-- UPDATE: Authenticated users can update only their own objects in this bucket
create policy "Allow update for authenticated in duvidasalunostoprofessor"
on storage.objects for update
to authenticated
using (bucket_id = 'duvidasalunostoprofessor' and owner = (select auth.uid()));

-- DELETE: Authenticated users can delete only their own objects in this bucket
create policy "Allow delete for authenticated in duvidasalunostoprofessor"
on storage.objects for delete
to authenticated
using (bucket_id = 'duvidasalunostoprofessor' and owner = (select auth.uid()));

-- Force schema reload
select pg_notify('pgrst', 'reload schema');

-- 8. Trigger to automatically clean up storage files when a doubt is deleted
create or replace function public.deletar_anexos_duvida()
returns trigger
language plpgsql
security definer
as $$
declare
  urls jsonb;
  url text;
  caminho_arquivo text;
begin
  if old.anexo_url is not null then
    begin
      urls := old.anexo_url::jsonb;
      if jsonb_typeof(urls) = 'array' then
        for url in select jsonb_array_elements_text(urls) loop
          caminho_arquivo := split_part(url, '/', cardinality(string_to_array(url, '/')));
          caminho_arquivo := split_part(caminho_arquivo, '?', 1);
          delete from storage.objects
          where bucket_id = 'duvidasalunostoprofessor'
          and name = caminho_arquivo;
        end loop;
      end if;
    exception when others then
      caminho_arquivo := split_part(old.anexo_url, '/', cardinality(string_to_array(old.anexo_url, '/')));
      caminho_arquivo := split_part(caminho_arquivo, '?', 1);
      delete from storage.objects
      where bucket_id = 'duvidasalunostoprofessor'
      and name = caminho_arquivo;
    end;
  end if;
  return old;
end;
$$;

revoke execute on function public.deletar_anexos_duvida() from PUBLIC, anon;
grant execute on function public.deletar_anexos_duvida() to authenticated, service_role;

create or replace trigger trigger_deletar_anexos_duvida
before delete on public.duvidasalunostoprofessor
for each row
execute function public.deletar_anexos_duvida();

-- 9. Cron job: delete resolved doubts every month
-- Enable pg_cron if not present
create extension if not exists pg_cron with schema extensions;

-- Schedule job to run on the 1st of every month at midnight (00:00)
select cron.schedule(
  'deletar-duvidas-resolvidas-mensal',
  '0 0 1 * *',
  $$
    delete from public.duvidasalunostoprofessor
    where resolveu = true;
  $$
);
