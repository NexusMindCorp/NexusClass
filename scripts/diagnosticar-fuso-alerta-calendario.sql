-- Gabriel Lineker, 2026-11-20. Leitura do horário do evento de teste e do cron.
SELECT
    current_setting('transaction_read_only') AS somente_leitura,
    current_setting('TimeZone') AS fuso_da_consulta,
    job.schedule AS agendamento,
    evento.data + evento.horario AS horario_gravado,
    (evento.data + evento.horario) AT TIME ZONE current_setting('TimeZone') AS instante_no_fuso_da_consulta,
    (evento.data + evento.horario) AT TIME ZONE 'America/Sao_Paulo' AS instante_em_sao_paulo,
    (
        SELECT jsonb_agg(config ORDER BY s.setdatabase, s.setrole, config)
        FROM pg_catalog.pg_db_role_setting AS s
        CROSS JOIN LATERAL unnest(s.setconfig) AS config
        WHERE s.setdatabase IN (
            0, (SELECT oid FROM pg_catalog.pg_database WHERE datname = job.database)
        )
          AND s.setrole IN (
            0, (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = job.username)
        )
          AND lower(config) LIKE 'timezone=%'
    ) AS ajustes_do_banco_ou_papel_do_cron,
    (
        SELECT count(*) FROM public.alerta_calendario AS alerta
        WHERE alerta.id_evento = evento.id_evento
    ) AS alertas_presentes
FROM public.evento_calendario AS evento
JOIN cron.job AS job ON job.jobname = 'processar_alertas_calendario'
WHERE evento.id_evento = 7
  AND evento.titulo LIKE '[Teste descartável Fase 6] Aviso DCC000 %';
