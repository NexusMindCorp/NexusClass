-- Gabriel Lineker, 2026-11-20. Executar no Supabase de teste.
-- Esperado: uma linha com papel professor e id_escola 1.
UPDATE public.perfil AS p
SET role = 'professor'
FROM auth.users AS u, public.turma AS t
WHERE p.id_perfil = u.id
  AND u.email = 'descarte@nexus.com'
  AND u.email_confirmed_at IS NOT NULL
  AND p.role = 'aluno'
  AND p.id_escola = 1
  AND t.codigo_acesso = 'DCC000'
  AND t.id_escola = p.id_escola
  AND NOT EXISTS (
      SELECT 1 FROM public.professor_turma AS pt
      WHERE pt.id_professor = p.id_perfil AND pt.id_turma = t.id_turma
  )
  AND NOT EXISTS (
      SELECT 1 FROM public.aluno_turma AS al
      WHERE al.id_aluno = p.id_perfil AND al.id_turma = t.id_turma
        AND al.situacao = 'ativa'
  )
RETURNING p.role AS papel, p.id_escola;
