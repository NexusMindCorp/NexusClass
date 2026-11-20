-- Gabriel Lineker, 2026-11-20. Executar no Supabase de teste.
-- Esperado: uma linha com papel professor e id_escola 1.
UPDATE public.perfil AS p
SET role = 'professor',
    id_escola = escola.id_escola
FROM auth.users AS u, public.escola
WHERE p.id_perfil = u.id
  AND u.email = 'descarte@nexus.com'
  AND p.role = 'master'
  AND p.id_escola IS NULL
  AND escola.id_escola = 1
RETURNING p.role AS papel, p.id_escola;
