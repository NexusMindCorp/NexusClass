-- Checagem de leitura para o Supabase de teste, após a migração 07.
-- A coluna "bloqueio_esperado_para_o_aluno" avalia a condição da migração
-- para a própria entrega. Ela não executa uma operação de escrita.
BEGIN READ ONLY;

SELECT
    atividade.titulo,
    turma.codigo_acesso AS turma,
    perfil.nome AS aluno,
    entrega.nota,
    entrega.feedback,
    storage_objeto.name AS arquivo,
    COALESCE(
        entrega.nota = 67
        AND entrega.feedback = 'muito bom'
        AND storage_objeto.bucket_id = 'entregas_atividades'
        AND right(storage_objeto.name, length('APEX_LOGO.jpg')) = 'APEX_LOGO.jpg',
        false
    ) AS evidencia_preservada,
    entrega.nota IS NOT NULL AS bloqueio_esperado_para_o_aluno
FROM public.atividade
JOIN public.turma ON turma.id_turma = atividade.id_turma
JOIN public.entrega_atividade AS entrega ON entrega.id_atividade = atividade.id_atividade
JOIN public.perfil ON perfil.id_perfil = entrega.id_aluno
LEFT JOIN storage.objects AS storage_objeto ON storage_objeto.id = entrega.id_objeto_storage
WHERE turma.codigo_acesso = 'DCC000'
  AND atividade.titulo = 'Teste RN08 — entrega avaliada'
  AND perfil.nome = 'Testador Noturno';

SELECT p.schemaname, p.tablename, p.policyname, p.cmd,
       p.permissive, p.roles, t.rowsecurity AS rls_habilitada,
       p.qual AS condicao_da_politica
FROM pg_catalog.pg_policies AS p
JOIN pg_catalog.pg_tables AS t USING (schemaname, tablename)
WHERE (p.schemaname, p.tablename) IN (
    ('public', 'entrega_atividade'),
    ('storage', 'objects')
)
AND p.policyname IN (
    'entrega_avaliada_bloqueia_aluno_update',
    'entrega_avaliada_bloqueia_aluno_delete',
    'entrega_avaliada_protege_arquivo_update',
    'entrega_avaliada_protege_arquivo_delete'
)
ORDER BY p.schemaname, p.tablename, p.cmd;

COMMIT;
