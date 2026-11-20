-- Gabriel Lineker, 2026-11-20. Executar no Supabase de teste.
-- Esperado: uma linha com papel master e id_escola NULL.
UPDATE public.perfil AS p
SET role = 'master',
    id_escola = NULL
FROM auth.users AS u
WHERE p.id_perfil = u.id
  AND u.email = 'descarte@nexus.com'
  AND u.email_confirmed_at IS NOT NULL
  AND p.role = 'professor'
  AND p.id_escola = 1
  AND NOT EXISTS (
      SELECT 1 FROM public.professor_turma AS vinculo
      WHERE vinculo.id_professor = p.id_perfil
  )
  AND NOT EXISTS (
      SELECT 1 FROM public.aluno_turma AS vinculo
      WHERE vinculo.id_aluno = p.id_perfil
  )
RETURNING p.role AS papel, p.id_escola;
