-- Gabriel Lineker, 2026-11-20. Conferência somente leitura das duas entregas de teste.
SELECT
    a.id_atividade,
    a.titulo,
    e.nota,
    COALESCE(e.feedback LIKE 'Parecer de teste após migração 10.%', false) AS parecer_do_reteste,
    COALESCE(o.name LIKE '%-reteste-migracao-10.png', false) AS anexo_do_reteste
FROM public.atividade AS a
JOIN public.entrega_atividade AS e ON e.id_atividade = a.id_atividade
JOIN public.perfil AS p ON p.id_perfil = e.id_aluno
LEFT JOIN storage.objects AS o ON o.id = e.id_objeto_storage
WHERE a.id_atividade IN (26, 28)
  AND p.nome = 'Testador Noturno'
ORDER BY a.id_atividade;
