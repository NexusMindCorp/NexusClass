-- Aplicar depois da migração 07. Os registros antigos ficam com atraso nulo.
BEGIN;

ALTER TABLE public.entrega_atividade ADD COLUMN IF NOT EXISTS atraso boolean;

CREATE OR REPLACE FUNCTION nexusclass_private.registrar_atraso_entrega()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    prazo timestamptz;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.id_objeto_storage IS NOT DISTINCT FROM OLD.id_objeto_storage
           AND NEW.id_atividade IS NOT DISTINCT FROM OLD.id_atividade
           AND NEW.entregue_em IS NOT DISTINCT FROM OLD.entregue_em THEN
            NEW.atraso := OLD.atraso;
            RETURN NEW;
        END IF;
    END IF;

    SELECT atividade.data_entrega INTO STRICT prazo
    FROM public.atividade
    WHERE atividade.id_atividade = NEW.id_atividade;

    NEW.entregue_em := statement_timestamp();
    NEW.atraso := NEW.entregue_em > prazo;
    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION nexusclass_private.registrar_atraso_entrega() FROM PUBLIC;

DROP TRIGGER IF EXISTS registrar_atraso_entrega ON public.entrega_atividade;
CREATE TRIGGER registrar_atraso_entrega
    BEFORE INSERT OR UPDATE ON public.entrega_atividade
    FOR EACH ROW EXECUTE FUNCTION nexusclass_private.registrar_atraso_entrega();

COMMIT;
