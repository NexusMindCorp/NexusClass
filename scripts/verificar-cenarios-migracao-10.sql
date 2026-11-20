-- Gabriel Lineker, 2026-11-20. Prontidão das entregas descartáveis.
SELECT a.id_atividade, a.titulo, e.id_entrega IS NOT NULL AS tem_entrega, e.nota
FROM public.atividade AS a
JOIN public.turma AS t ON t.id_turma = a.id_turma
LEFT JOIN public.entrega_atividade AS e
  ON e.id_atividade = a.id_atividade
 AND e.id_aluno IN (
     SELECT p.id_perfil FROM public.perfil AS p
     WHERE p.nome = 'Testador Noturno' AND p.role = 'aluno'
 )
WHERE t.codigo_acesso = 'DCC000'
  AND (a.titulo LIKE 'Teste RN07%' OR a.titulo LIKE 'Teste RN08%')
ORDER BY a.id_atividade;
