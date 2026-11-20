-- Gabriel Lineker, 2026-11-20. Inspeciona grants e gatilhos sem escrever dados.
SELECT jsonb_build_object(
    'somente_leitura', current_setting('transaction_read_only'),
    'update_na_tabela', has_table_privilege(
        'authenticated', 'public.entrega_atividade', 'UPDATE'
    ),
    'colunas', (
        SELECT jsonb_object_agg(a.attname, has_column_privilege(
            'authenticated', a.attrelid, a.attnum, 'UPDATE'
        ))
        FROM pg_catalog.pg_attribute AS a
        WHERE a.attrelid = 'public.entrega_atividade'::regclass
          AND a.attnum > 0 AND NOT a.attisdropped
    ),
    'gatilhos', (
        SELECT jsonb_agg(jsonb_build_object(
            'nome', t.tgname,
            'estado', t.tgenabled,
            'funcao', pg_get_functiondef(t.tgfoid)
        ) ORDER BY t.tgname)
        FROM pg_catalog.pg_trigger AS t
        WHERE t.tgrelid = 'public.entrega_atividade'::regclass
          AND NOT t.tgisinternal
    )
) AS auditoria;
