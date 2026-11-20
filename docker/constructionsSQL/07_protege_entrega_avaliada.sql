-- Aplicar depois de 06_corrige_rls_reenvio_entrega.sql.
BEGIN;

-- A nota registrada marca a avaliação, inclusive quando não há feedback.
-- As políticas permissivas existentes continuam decidindo quem pode operar.
DROP POLICY IF EXISTS entrega_avaliada_bloqueia_aluno_update ON public.entrega_atividade;
CREATE POLICY entrega_avaliada_bloqueia_aluno_update
    ON public.entrega_atividade AS RESTRICTIVE FOR UPDATE TO authenticated
    USING (id_aluno <> (SELECT auth.uid()) OR nota IS NULL);

DROP POLICY IF EXISTS entrega_avaliada_bloqueia_aluno_delete ON public.entrega_atividade;
CREATE POLICY entrega_avaliada_bloqueia_aluno_delete
    ON public.entrega_atividade AS RESTRICTIVE FOR DELETE TO authenticated
    USING (id_aluno <> (SELECT auth.uid()) OR nota IS NULL);

-- O aluno tem leitura da própria entrega pelas políticas existentes.
-- A consulta usa as permissões da sessão e se limita ao bucket de entregas.
DROP POLICY IF EXISTS entrega_avaliada_protege_arquivo_update ON storage.objects;
CREATE POLICY entrega_avaliada_protege_arquivo_update
    ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
    USING (
        bucket_id <> 'entregas_atividades'
        OR NOT EXISTS (
            SELECT 1
            FROM public.entrega_atividade AS entrega
            WHERE entrega.id_objeto_storage = objects.id
              AND entrega.id_aluno = (SELECT auth.uid())
              AND entrega.nota IS NOT NULL
        )
    );

DROP POLICY IF EXISTS entrega_avaliada_protege_arquivo_delete ON storage.objects;
CREATE POLICY entrega_avaliada_protege_arquivo_delete
    ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
    USING (
        bucket_id <> 'entregas_atividades'
        OR NOT EXISTS (
            SELECT 1
            FROM public.entrega_atividade AS entrega
            WHERE entrega.id_objeto_storage = objects.id
              AND entrega.id_aluno = (SELECT auth.uid())
              AND entrega.nota IS NOT NULL
        )
    );

COMMIT;
