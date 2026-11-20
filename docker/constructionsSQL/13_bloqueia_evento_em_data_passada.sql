-- Aplicar depois de 12_invalida_alertas_ao_reagendar.sql.
BEGIN;

CREATE OR REPLACE FUNCTION public.fn_validar_data_evento_calendario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF NEW.data < (statement_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'A data do evento não pode ser anterior a hoje.';
    END IF;
    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_validar_data_evento_calendario()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS validar_data_evento_insercao ON public.evento_calendario;
CREATE TRIGGER validar_data_evento_insercao
    BEFORE INSERT ON public.evento_calendario
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_validar_data_evento_calendario();

DROP TRIGGER IF EXISTS validar_data_evento_reagendamento ON public.evento_calendario;
CREATE TRIGGER validar_data_evento_reagendamento
    BEFORE UPDATE OF data, horario ON public.evento_calendario
    FOR EACH ROW
    WHEN (OLD.data IS DISTINCT FROM NEW.data OR OLD.horario IS DISTINCT FROM NEW.horario)
    EXECUTE FUNCTION public.fn_validar_data_evento_calendario();

COMMIT;
