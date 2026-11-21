-- Aplicar depois da migração 08. Preserva avaliações anteriores à regra.
BEGIN;

ALTER TABLE public.entrega_atividade
    DROP CONSTRAINT IF EXISTS ck_entrega_feedback_avaliacao;
ALTER TABLE public.entrega_atividade
    ADD CONSTRAINT ck_entrega_feedback_avaliacao
    CHECK (
        nota IS NULL
        OR (
            feedback IS NOT NULL
            AND char_length(regexp_replace(feedback, '^[[:space:]]+|[[:space:]]+$', '', 'g'))
                >= CASE WHEN nota < 60 THEN 20 ELSE 1 END
        )
    ) NOT VALID;

COMMIT;
