-- Gabriel Lineker, 2026-11-20.
-- Consulta executada via Codex CLI. O resultado está no plano de validação.
SELECT
    to_regclass('public.entrega_atividade') IS NOT NULL AS entrega_atividade_existe,
    pg_catalog.current_setting('transaction_read_only') AS somente_leitura;
