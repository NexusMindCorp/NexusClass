
BEGIN;

CREATE SCHEMA IF NOT EXISTS nexusclass_private;
REVOKE ALL ON SCHEMA nexusclass_private FROM PUBLIC;

CREATE OR REPLACE FUNCTION nexusclass_private.reenvio_preserva_avaliacao(
    entrega_id integer,
    atividade_id integer,
    nova_nota numeric,
    novo_feedback text
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.entrega_atividade AS entrega
        WHERE entrega.id_entrega = entrega_id
          AND entrega.id_atividade = atividade_id
          AND entrega.id_aluno = (SELECT auth.uid())
          AND entrega.nota IS NOT DISTINCT FROM nova_nota
          AND entrega.feedback IS NOT DISTINCT FROM novo_feedback
    );
$$;

REVOKE ALL ON FUNCTION nexusclass_private.reenvio_preserva_avaliacao(integer, integer, numeric, text)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION nexusclass_private.reenvio_preserva_avaliacao(integer, integer, numeric, text)
    TO authenticated;

ALTER POLICY "Entrega_Atividade: reenvio pelo aluno sem alterar nota"
    ON public.entrega_atividade
    WITH CHECK (
        (SELECT auth.uid()) = id_aluno
        AND nexusclass_private.reenvio_preserva_avaliacao(
            id_entrega, id_atividade, nota, feedback
        )
    );

COMMIT;
