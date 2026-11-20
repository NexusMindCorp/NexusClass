-- Gabriel Lineker, 2026-11-20. Consulta somente leitura do agendador.
SELECT
    job.active AS ativo,
    job.schedule AS expressao_cron,
    ultima.status AS ultima_execucao,
    ultima.end_time AS ultimo_termino
FROM cron.job AS job
LEFT JOIN LATERAL (
    SELECT execucao.status, execucao.end_time
    FROM cron.job_run_details AS execucao
    WHERE execucao.jobid = job.jobid
    ORDER BY execucao.runid DESC
    LIMIT 1
) AS ultima ON true
WHERE job.jobname = 'processar_alertas_calendario';
