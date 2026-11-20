-- Gabriel Lineker, 2026-11-20. Confirmação de perfil para a matriz de escolas.
SELECT
    perfil.role AS papel,
    perfil.id_escola AS escola,
    turma.id_escola AS escola_dcc000,
    EXISTS (
        SELECT 1 FROM public.aluno_turma AS matricula
        WHERE matricula.id_aluno = perfil.id_perfil
          AND matricula.id_turma = turma.id_turma
          AND matricula.situacao = 'ativa'
    ) AS matricula_ativa_dcc000
FROM auth.users AS usuario
JOIN public.perfil ON perfil.id_perfil = usuario.id
CROSS JOIN public.turma
WHERE usuario.email = 'jae@nexus.com'
  AND turma.codigo_acesso = 'DCC000';
