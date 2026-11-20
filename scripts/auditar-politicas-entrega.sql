-- Gabriel Lineker, 2026-11-20. Auditoria do Passo 9-B.
-- Inspeciona a configuração ativa. Não executa alterações nem assume papéis.
WITH alvos (esquema, tabela) AS (
    VALUES ('public', 'entrega_atividade'), ('storage', 'objects')
),
politicas AS (
    SELECT p.*
    FROM pg_catalog.pg_policies AS p
    JOIN alvos AS a ON a.esquema = p.schemaname AND a.tabela = p.tablename
    WHERE p.schemaname = 'public'
       OR p.policyname LIKE 'Storage entregas_atividades:%'
       OR p.policyname LIKE 'entrega_avaliada_%'
       OR p.cmd IN ('ALL', 'UPDATE', 'DELETE')
)
SELECT jsonb_build_object(
    'somente_leitura', current_setting('transaction_read_only'),
    'tabelas', (
        SELECT jsonb_agg(jsonb_build_object(
            'esquema', a.esquema,
            'tabela', a.tabela,
            'rls', c.relrowsecurity
        ) ORDER BY a.esquema, a.tabela)
        FROM alvos AS a
        LEFT JOIN pg_catalog.pg_class AS c
          ON c.oid = to_regclass(format('%I.%I', a.esquema, a.tabela))
    ),
    'entrega', (
        SELECT jsonb_agg(jsonb_build_object(
            'nome', p.policyname, 'acao', p.cmd, 'tipo', p.permissive,
            'papeis', p.roles, 'using', p.qual, 'with_check', p.with_check
        ) ORDER BY p.cmd, p.policyname)
        FROM politicas AS p
        WHERE p.schemaname = 'public'
    ),
    'storage_entregas', (
        SELECT jsonb_agg(jsonb_build_object(
            'nome', p.policyname, 'acao', p.cmd, 'tipo', p.permissive,
            'papeis', p.roles, 'using', p.qual, 'with_check', p.with_check
        ) ORDER BY p.cmd, p.policyname)
        FROM politicas AS p
        WHERE p.schemaname = 'storage'
          AND (p.policyname LIKE 'Storage entregas_atividades:%'
               OR p.policyname LIKE 'entrega_avaliada_%')
    ),
    'outras_politicas_de_escrita_storage', (
        SELECT jsonb_agg(p.policyname ORDER BY p.policyname)
        FROM politicas AS p
        WHERE p.schemaname = 'storage' AND p.cmd IN ('ALL', 'UPDATE', 'DELETE')
          AND p.policyname NOT LIKE 'Storage entregas_atividades:%'
          AND p.policyname NOT LIKE 'entrega_avaliada_%'
    )
) AS auditoria;
