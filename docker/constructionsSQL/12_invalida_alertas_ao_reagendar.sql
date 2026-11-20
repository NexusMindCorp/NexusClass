-- Aplicar depois de 11_alinha_fuso_alertas_calendario.sql.
BEGIN;

CREATE OR REPLACE FUNCTION public.fn_invalidar_alertas_ao_reagendar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    DELETE FROM public.alerta_calendario
    WHERE id_evento = NEW.id_evento;
    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_invalidar_alertas_ao_reagendar()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS invalidar_alertas_ao_reagendar ON public.evento_calendario;
CREATE TRIGGER invalidar_alertas_ao_reagendar
    AFTER UPDATE OF data, horario ON public.evento_calendario
    FOR EACH ROW
    WHEN (OLD.data IS DISTINCT FROM NEW.data OR OLD.horario IS DISTINCT FROM NEW.horario)
    EXECUTE FUNCTION public.fn_invalidar_alertas_ao_reagendar();

COMMIT;
