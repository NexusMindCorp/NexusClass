-- Aplicar depois de 05_supabase_funcoes_realtime.sql.
-- Evento_Calendario guarda data e hora civis do calendário de São Paulo.
-- A configuração se aplica somente durante a execução da função de alertas.
BEGIN;

ALTER FUNCTION public.fn_processar_alertas_calendario()
    SET TimeZone TO 'America/Sao_Paulo';

COMMIT;
