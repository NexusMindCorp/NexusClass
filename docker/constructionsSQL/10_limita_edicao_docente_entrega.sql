-- Aplicar depois de 09_valida_feedback_avaliacao.sql.
BEGIN;

CREATE OR REPLACE FUNCTION nexusclass_private.limitar_edicao_docente_entrega()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF ROW(NEW.id_entrega, NEW.id_aluno, NEW.id_atividade,
           NEW.id_objeto_storage, NEW.entregue_em, NEW.atraso)
       IS DISTINCT FROM
       ROW(OLD.id_entrega, OLD.id_aluno, OLD.id_atividade,
           OLD.id_objeto_storage, OLD.entregue_em, OLD.atraso)
       AND current_user = 'authenticated'
       AND EXISTS (
           SELECT 1
           FROM public.perfil AS perfil
           WHERE perfil.id_perfil = (SELECT auth.uid())
             AND perfil.role = 'professor'
       ) THEN
        RAISE EXCEPTION 'A avaliação docente só pode alterar nota e feedback.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION nexusclass_private.limitar_edicao_docente_entrega() FROM PUBLIC;

-- Gatilhos BEFORE UPDATE da mesma tabela executam em ordem alfabética.
-- A conferência precisa ocorrer antes de registrar_atraso_entrega.
DROP TRIGGER IF EXISTS limitar_edicao_docente_entrega ON public.entrega_atividade;
CREATE TRIGGER limitar_edicao_docente_entrega
    BEFORE UPDATE ON public.entrega_atividade
    FOR EACH ROW EXECUTE FUNCTION nexusclass_private.limitar_edicao_docente_entrega();

COMMIT;
