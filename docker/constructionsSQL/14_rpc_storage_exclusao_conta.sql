-- Aplicar depois de 13_bloqueia_evento_em_data_passada.sql.
-- Expõe uma única RPC somente-leitura (exclusiva para service_role) para que a
-- Edge Function deletar-conta liste todos os arquivos do aluno no Storage antes
-- de executar auth.admin.deleteUser(user.id), evitando expor o schema storage
-- no PostgREST (PGRST106) e sem criar tabelas ou triggers com efeitos colaterais.
BEGIN;

CREATE OR REPLACE FUNCTION public.listar_objetos_storage_perfil(
    p_id_perfil UUID
)
RETURNS TABLE (
    id_objeto_storage UUID,
    bucket_id TEXT,
    caminho TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT DISTINCT
        so.id AS id_objeto_storage,
        so.bucket_id,
        so.name AS caminho
    FROM storage.objects AS so
    WHERE so.bucket_id IS NOT NULL
      AND so.name IS NOT NULL
      AND (
          so.id IN (
              SELECT ea.id_objeto_storage
              FROM public.entrega_atividade AS ea
              WHERE ea.id_aluno = p_id_perfil
                AND ea.id_objeto_storage IS NOT NULL

              UNION

              SELECT da.id_objeto_storage
              FROM public.duvida AS d
              JOIN public.duvida_anexo AS da ON da.id_duvida = d.id_duvida
              WHERE d.id_aluno = p_id_perfil
                AND da.id_objeto_storage IS NOT NULL

              UNION

              SELECT tsa.id_objeto_storage
              FROM public.ticket_suporte AS ts
              JOIN public.ticket_suporte_anexo AS tsa ON tsa.id_suporte = ts.id_suporte
              WHERE ts.id_perfil = p_id_perfil
                AND tsa.id_objeto_storage IS NOT NULL
          )
          OR (
              (so.owner_id = p_id_perfil::text OR so.owner = p_id_perfil)
              AND so.bucket_id IN (
                  'entregas_atividades',
                  'duvidasalunostoprofessor',
                  'anexos_suporte'
              )
          )
      )
    ORDER BY so.bucket_id, so.name;
$$;

REVOKE ALL ON FUNCTION public.listar_objetos_storage_perfil(UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_objetos_storage_perfil(UUID)
    TO service_role;

COMMIT;

-- Atualiza o cache do PostgREST para reconhecer a nova RPC
SELECT pg_notify('pgrst', 'reload schema');
