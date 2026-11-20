-- Gabriel Lineker, 2026-11-20. Verificação somente leitura da migração 11.
SELECT
    current_setting('transaction_read_only') AS somente_leitura,
    p.proconfig AS configuracao_da_funcao,
    EXISTS (
        SELECT 1
        FROM unnest(p.proconfig) AS parametro
        WHERE lower(parametro) = 'timezone=america/sao_paulo'
    ) AS fuso_sao_paulo_configurado
FROM pg_catalog.pg_proc AS p
WHERE p.oid = to_regprocedure('public.fn_processar_alertas_calendario()');
