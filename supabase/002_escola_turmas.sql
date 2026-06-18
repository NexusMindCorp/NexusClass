create extension if not exists pgcrypto;

create table if not exists public.escolas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ano_letivo integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.turmas_escolares (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas(id) on delete cascade,
  chave text not null,
  materia text not null,
  professor text not null,
  banner_url text not null,
  foto_professor_url text not null,
  sala text not null,
  turma text not null,
  created_at timestamptz not null default now(),
  unique (escola_id, chave)
);

create table if not exists public.turma_alunos (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references public.turmas_escolares(id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_turmas_escolares_escola_id on public.turmas_escolares(escola_id);
create index if not exists idx_turma_alunos_turma_id on public.turma_alunos(turma_id);

grant usage on schema public to anon, authenticated;
grant select on table public.escolas to anon, authenticated;
grant select on table public.turmas_escolares to anon, authenticated;
grant select on table public.turma_alunos to anon, authenticated;

grant insert, update, delete on table public.escolas to authenticated;
grant insert, update, delete on table public.turmas_escolares to authenticated;
grant insert, update, delete on table public.turma_alunos to authenticated;

alter table public.escolas enable row level security;
alter table public.turmas_escolares enable row level security;
alter table public.turma_alunos enable row level security;

drop policy if exists "Public read escolas" on public.escolas;
create policy "Public read escolas"
on public.escolas
for select
using (true);

drop policy if exists "Public read turmas_escolares" on public.turmas_escolares;
create policy "Public read turmas_escolares"
on public.turmas_escolares
for select
using (true);

drop policy if exists "Public read turma_alunos" on public.turma_alunos;
create policy "Public read turma_alunos"
on public.turma_alunos
for select
using (true);

drop policy if exists "Authenticated write escolas" on public.escolas;
create policy "Authenticated write escolas"
on public.escolas
for all
to authenticated
using (
  exists (
    select 1 from public.perfis
    where id = (select auth.uid())
    and role = 'master'
  )
)
with check (
  exists (
    select 1 from public.perfis
    where id = (select auth.uid())
    and role = 'master'
  )
);

drop policy if exists "Authenticated write turmas_escolares" on public.turmas_escolares;
create policy "Authenticated write turmas_escolares"
on public.turmas_escolares
for all
to authenticated
using (
  exists (
    select 1 from public.perfis
    where id = (select auth.uid())
    and role = 'master'
  )
)
with check (
  exists (
    select 1 from public.perfis
    where id = (select auth.uid())
    and role = 'master'
  )
);

drop policy if exists "Authenticated write turma_alunos" on public.turma_alunos;
create policy "Authenticated write turma_alunos"
on public.turma_alunos
for all
to authenticated
using (
  exists (
    select 1 from public.perfis
    where id = (select auth.uid())
    and role = 'master'
  )
)
with check (
  exists (
    select 1 from public.perfis
    where id = (select auth.uid())
    and role = 'master'
  )
);

create or replace function public.escola_com_turmas_json(escola_uuid uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  with turmas_agg as (
    select
      t.chave,
      jsonb_build_object(
        'materia', t.materia,
        'professor', t.professor,
        'banners', t.banner_url,
        'alunos', coalesce(
          (
            select jsonb_agg(a.nome order by a.nome)
            from public.turma_alunos a
            where a.turma_id = t.id
          ),
          '[]'::jsonb
        ),
        'foto_professor', t.foto_professor_url,
        'sala', t.sala,
        'turma', t.turma
      ) as turma_json
    from public.turmas_escolares t
    where t.escola_id = escola_uuid
  )
  select jsonb_build_object(
    'escola', e.nome,
    'ano_letivo', e.ano_letivo,
    'turmas', coalesce(
      (
        select jsonb_object_agg(ta.chave, ta.turma_json)
        from turmas_agg ta
      ),
      '{}'::jsonb
    )
  )
  from public.escolas e
  where e.id = escola_uuid;
$$;

insert into public.escolas (id, nome, ano_letivo)
values ('00000000-0000-0000-0000-000000000001', 'Escola Estadual de Nexus City', 2069)
on conflict (id) do update
set nome = excluded.nome,
    ano_letivo = excluded.ano_letivo;

insert into public.turmas_escolares (
  id,
  escola_id,
  chave,
  materia,
  professor,
  banner_url,
  foto_professor_url,
  sala,
  turma
)
values
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'informatica',
    'Informatica',
    'ET',
    'https://preview.redd.it/afo77nn5l8401.jpg?auto=webp&s=5467bce7a0c54d2ce2f902bee58145f89dd074eb',
    'https://preview.redd.it/cty39ctc10jg1.jpeg?width=640&crop=smart&auto=webp&s=7f6b489ec8ad14f18fc6b32f3385d5300cb0b93c',
    'A-01',
    '9o Ano A'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'filosofia',
    'Filosofia',
    'Phoenix Wright',
    'https://dubai-teachmeet.com/wp-content/uploads/2014/03/picture7.jpg',
    'https://translate.google.com/website?sl=en&tl=pt&hl=pt&client=srp&u=https://static.wikia.nocookie.net/aceattorney/images/9/95/Phoenix_Wright_Portrait_AJ_Trilogy.png/revision/latest?cb%3D20240620212543',
    'B-12',
    '9o Ano A'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000001',
    'quimica',
    'Quimica',
    'Walter White',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzSV1CyfcCHkqN4Zs1fxbbDfHzsCy0Lfq4rQ&s',
    'https://imagenes.elpais.com/resizer/v2/QB4I6VGKINYWS4AVFSTV5FWFYI.jpg?auth=e8bd312047bd47aac60cd3421b55d5fae4528cf0b93c78ca6269597c247c832c&width=1200',
    'B-12',
    '9o Ano A'
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000001',
    'matematica',
    'Matematica',
    'Alan Garner',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTT1DgIRo9Te3ngmCpq0yv0HX_sToE02qSV9Q&s',
    'https://static.independent.co.uk/s3fs-public/thumbnails/image/2016/01/26/10/the-hangover.jpg?width=1200',
    'C-05',
    '9o Ano B'
  ),
  (
    '00000000-0000-0000-0000-000000000105',
    '00000000-0000-0000-0000-000000000001',
    'geografia',
    'Geografia',
    'Celso Portiolli',
    'https://wallpaperaccess.com/full/4420933.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuiU7qyb_BWQ5WrFfp3hewXebEY9TVKT6C-g&s',
    'D-01',
    '1o Ensino Medio'
  ),
  (
    '00000000-0000-0000-0000-000000000106',
    '00000000-0000-0000-0000-000000000001',
    'portugues',
    'Portugues',
    'Raimundo',
    'https://www.fundacaotelefonicavivo.org.br/wp-content/uploads/2021/05/lingua-portuguesa-1200px-facebook.jpg',
    'https://th.bing.com/th?q=Professor+Raimundo+Chico+Anysio&w=120&h=120&c=1&rs=1&qlt=70&o=7&cb=1&dpr=1.3&pid=InlineBlock&rm=3&mkt=pt-BR&cc=BR&setlang=pt-br&adlt=moderate&t=1&mw=247',
    'Auditorio A',
    '2o Ensino Medio'
  ),
  (
    '00000000-0000-0000-0000-000000000107',
    '00000000-0000-0000-0000-000000000001',
    'ciencias',
    'Ciencias',
    'Pedro Loos',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&h=400&fit=crop',
    'https://pbs.twimg.com/media/F3kXMy4WwAARHA4.jpg',
    'Sala de Debates',
    '3o Ensino Medio'
  )
on conflict (id) do update
set escola_id = excluded.escola_id,
    chave = excluded.chave,
    materia = excluded.materia,
    professor = excluded.professor,
    banner_url = excluded.banner_url,
    foto_professor_url = excluded.foto_professor_url,
    sala = excluded.sala,
    turma = excluded.turma;

delete from public.turma_alunos where turma_id in (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000105',
  '00000000-0000-0000-0000-000000000106',
  '00000000-0000-0000-0000-000000000107'
);

insert into public.turma_alunos (turma_id, nome)
values
  ('00000000-0000-0000-0000-000000000101', 'Ana Silva'),
  ('00000000-0000-0000-0000-000000000101', 'Bruno Oliveira'),
  ('00000000-0000-0000-0000-000000000101', 'Carlos Eduardo'),
  ('00000000-0000-0000-0000-000000000102', 'Ana Silva'),
  ('00000000-0000-0000-0000-000000000102', 'Bruno Oliveira'),
  ('00000000-0000-0000-0000-000000000102', 'Carlos Eduardo'),
  ('00000000-0000-0000-0000-000000000103', 'Ana Silva'),
  ('00000000-0000-0000-0000-000000000103', 'Bruno Oliveira'),
  ('00000000-0000-0000-0000-000000000103', 'Carlos Eduardo'),
  ('00000000-0000-0000-0000-000000000104', 'Erick Ferreira'),
  ('00000000-0000-0000-0000-000000000104', 'Fernanda Lima'),
  ('00000000-0000-0000-0000-000000000104', 'Gabriel Costa'),
  ('00000000-0000-0000-0000-000000000105', 'Marcos Viana'),
  ('00000000-0000-0000-0000-000000000105', 'Patricia Luz'),
  ('00000000-0000-0000-0000-000000000105', 'Renato Garcia'),
  ('00000000-0000-0000-0000-000000000106', 'Thiago Ramos'),
  ('00000000-0000-0000-0000-000000000106', 'Ursula Lins'),
  ('00000000-0000-0000-0000-000000000106', 'Vitor Hugo'),
  ('00000000-0000-0000-0000-000000000107', 'Beatriz Dias'),
  ('00000000-0000-0000-0000-000000000107', 'Caio Castro'),
  ('00000000-0000-0000-0000-000000000107', 'Eduarda Nobre'),
  ('00000000-0000-0000-0000-000000000107', 'Tigreso');

-- Force PostgREST to refresh schema cache after creating/updating objects.
select pg_notify('pgrst', 'reload schema');
