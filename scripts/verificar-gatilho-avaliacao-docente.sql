-- Gabriel Lineker, 2026-11-20. Verificação somente leitura da migração 10.
SELECT
    current_setting('transaction_read_only') AS somente_leitura,
    t.tgname AS gatilho,
    t.tgenabled IN ('O', 'A') AS ativo,
    pg_get_triggerdef(t.oid) AS definicao,
    NOT p.prosecdef AS usa_privilegios_do_invocador
FROM pg_catalog.pg_trigger AS t
JOIN pg_catalog.pg_proc AS p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'public.entrega_atividade'::regclass
  AND t.tgname IN ('limitar_edicao_docente_entrega', 'registrar_atraso_entrega')
  AND NOT t.tgisinternal
ORDER BY t.tgname COLLATE "C";
