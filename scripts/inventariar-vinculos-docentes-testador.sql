-- Gabriel Lineker, 2026-11-20. Triagem somente leitura da turma sem docente.
SELECT t.codigo_acesso, t.materia,
       count(DISTINCT pt.id_professor) AS vinculos_docentes,
       count(DISTINCT docente.id_perfil) FILTER (
           WHERE docente.role = 'professor' AND docente.id_escola = t.id_escola
       ) AS docentes_validos
FROM public.perfil AS aluno
JOIN public.aluno_turma AS al ON al.id_aluno = aluno.id_perfil
JOIN public.turma AS t ON t.id_turma = al.id_turma
LEFT JOIN public.professor_turma AS pt ON pt.id_turma = t.id_turma
LEFT JOIN public.perfil AS docente ON docente.id_perfil = pt.id_professor
WHERE aluno.nome = 'Testador Noturno' AND aluno.role = 'aluno' AND al.situacao = 'ativa'
GROUP BY t.id_turma, t.codigo_acesso, t.materia
ORDER BY t.codigo_acesso;
