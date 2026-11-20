-- Gabriel Lineker, 2026-11-20. Inspeção somente leitura do Passo 9-B.
WITH esperadas (tabela) AS (
    VALUES ('mural_post'), ('atividade'), ('entrega_atividade'),
           ('mensagem'), ('alerta_calendario')
)
SELECT jsonb_build_object(
    'somente_leitura', current_setting('transaction_read_only'),
    'publicacao_existe', EXISTS (
        SELECT 1 FROM pg_catalog.pg_publication WHERE pubname = 'supabase_realtime'
    ),
    'tabelas_publicadas', (
        SELECT jsonb_object_agg(e.tabela, p.tablename IS NOT NULL)
        FROM esperadas AS e
        LEFT JOIN pg_catalog.pg_publication_tables AS p
          ON p.pubname = 'supabase_realtime' AND p.schemaname = 'public'
         AND p.tablename = e.tabela
    ),
    'pg_cron_instalado', EXISTS (
        SELECT 1 FROM pg_catalog.pg_extension WHERE extname = 'pg_cron'
    ),
    'funcao_de_alertas_instalada',
        to_regprocedure('public.fn_processar_alertas_calendario()') IS NOT NULL
) AS configuracao;
