-- Gabriel Lineker, 2026-11-20. Inventário somente leitura do Passo 9-B.
WITH turma_alvo AS (
    SELECT id_turma, id_escola
    FROM public.turma
    WHERE codigo_acesso = 'DCC000'
),
perfis AS (
    SELECT
        p.role,
        CASE
            WHEN p.id_escola IS NULL THEN 'sem_escola'
            WHEN p.id_escola = t.id_escola THEN 'mesma_escola'
            ELSE 'outra_escola'
        END AS escopo_escola,
        CASE
            WHEN p.role = 'aluno' THEN EXISTS (
                SELECT 1 FROM public.aluno_turma AS al
                WHERE al.id_aluno = p.id_perfil AND al.id_turma = t.id_turma
                  AND al.situacao = 'ativa'
            )
            WHEN p.role = 'professor' THEN EXISTS (
                SELECT 1 FROM public.professor_turma AS pt
                WHERE pt.id_professor = p.id_perfil AND pt.id_turma = t.id_turma
            )
            ELSE NULL
        END AS vinculo_dcc000,
        CASE
            WHEN p.role = 'aluno' AND p.nome = 'Testador Noturno' THEN 'aluno_atual'
            WHEN p.role = 'professor' AND p.email = 'prof@nexusclass.edu.br' THEN 'professor_atual'
            ELSE NULL
        END AS conta_de_teste
    FROM public.perfil AS p
    CROSS JOIN turma_alvo AS t
),
opcoes AS (
    SELECT role, escopo_escola, vinculo_dcc000, count(*) AS perfis
    FROM perfis
    GROUP BY role, escopo_escola, vinculo_dcc000
)
SELECT jsonb_build_object(
    'somente_leitura', current_setting('transaction_read_only'),
    'dcc000_encontrada', EXISTS (SELECT 1 FROM turma_alvo),
    'contas_atuais', (SELECT jsonb_agg(to_jsonb(p) ORDER BY conta_de_teste)
                      FROM perfis AS p WHERE conta_de_teste IS NOT NULL),
    'perfis_por_escopo', (SELECT jsonb_agg(to_jsonb(o) ORDER BY role, escopo_escola, vinculo_dcc000)
                         FROM opcoes AS o),
    'objetos_06_07_08_09', jsonb_build_object(
        '06_funcao', to_regprocedure(
            'nexusclass_private.reenvio_preserva_avaliacao(integer,integer,numeric,text)'
        ) IS NOT NULL,
        '07_total_politicas', (
            SELECT count(*) FROM pg_catalog.pg_policies
            WHERE (schemaname, tablename) IN (
                ('public', 'entrega_atividade'), ('storage', 'objects')
            ) AND policyname LIKE 'entrega_avaliada_%'
        ),
        '08_coluna', EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'entrega_atividade'
              AND column_name = 'atraso'
        ),
        '08_trigger_ativo', EXISTS (
            SELECT 1 FROM pg_catalog.pg_trigger
            WHERE tgrelid = to_regclass('public.entrega_atividade')
              AND tgname = 'registrar_atraso_entrega' AND tgenabled IN ('O', 'A')
        ),
        '09_restricao', EXISTS (
            SELECT 1 FROM pg_catalog.pg_constraint
            WHERE conrelid = to_regclass('public.entrega_atividade')
              AND conname = 'ck_entrega_feedback_avaliacao' AND contype = 'c'
        )
    )
) AS inventario;
