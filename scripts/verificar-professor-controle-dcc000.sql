-- Gabriel Lineker, 2026-11-20. Prontidão do perfil descartável.
SELECT
    p.role AS papel,
    p.id_escola AS escola,
    t.id_escola AS escola_dcc000,
    u.email_confirmed_at IS NOT NULL AS email_confirmado,
    EXISTS (
        SELECT 1 FROM public.professor_turma AS pt
        WHERE pt.id_professor = p.id_perfil AND pt.id_turma = t.id_turma
    ) AS vinculo_docente,
    EXISTS (
        SELECT 1 FROM public.aluno_turma AS al
        WHERE al.id_aluno = p.id_perfil AND al.id_turma = t.id_turma
          AND al.situacao = 'ativa'
    ) AS matricula_ativa
FROM auth.users AS u
JOIN public.perfil AS p ON p.id_perfil = u.id
CROSS JOIN public.turma AS t
WHERE u.email = 'descarte@nexus.com'
  AND t.codigo_acesso = 'DCC000';
