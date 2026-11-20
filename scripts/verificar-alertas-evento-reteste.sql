-- Gabriel Lineker, 2026-11-20. Leitura dos eventos descartáveis criados após a 11.
SELECT
    evento.id_evento,
    (evento.data + evento.horario) AT TIME ZONE 'America/Sao_Paulo' AS inicio,
    statement_timestamp() AS consultado_em,
    COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
            'antecedencia', alerta.minutos_antes, 'lembrete_para', alerta.lembrete_para
        ) ORDER BY alerta.minutos_antes DESC)
        FROM public.alerta_calendario AS alerta
        WHERE alerta.id_evento = evento.id_evento
    ), '[]'::jsonb) AS alertas_presentes
FROM public.evento_calendario AS evento
WHERE evento.id_evento IN (8, 9)
  AND evento.titulo LIKE '[Teste descartável Fase 6] Aviso DCC000 %'
ORDER BY evento.id_evento;
