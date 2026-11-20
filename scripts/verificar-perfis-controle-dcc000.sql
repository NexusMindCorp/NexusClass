-- Gabriel Lineker, 2026-11-20. Perfis e vínculos para a matriz da DCC000.
WITH alvo AS (
    SELECT id_turma, id_escola
    FROM public.turma
    WHERE codigo_acesso = 'DCC000'
), candidatos AS (
    SELECT
        perfil.role AS papel,
        CASE
            WHEN perfil.role = 'master' THEN 'master'
            WHEN perfil.id_escola = alvo.id_escola THEN 'mesma_escola_sem_vinculo'
            ELSE 'outra_escola'
        END AS cenario,
        perfil.id_escola,
        usuario.id IS NOT NULL AS existe_no_auth,
        COALESCE(usuario.encrypted_password <> '', false) AS tem_senha_configurada,
        usuario.email_confirmed_at IS NOT NULL AS email_confirmado
    FROM public.perfil
    CROSS JOIN alvo
    LEFT JOIN auth.users AS usuario ON usuario.id = perfil.id_perfil
    WHERE perfil.role = 'master'
       OR (
           perfil.role = 'professor'
           AND NOT EXISTS (
               SELECT 1
               FROM public.professor_turma AS vinculo
               WHERE vinculo.id_professor = perfil.id_perfil
                 AND vinculo.id_turma = alvo.id_turma
           )
       )
       OR (perfil.role = 'aluno' AND perfil.id_escola <> alvo.id_escola)
)
SELECT cenario, papel, id_escola, existe_no_auth, tem_senha_configurada,
       email_confirmado, count(*) AS perfis
FROM candidatos
GROUP BY cenario, papel, id_escola, existe_no_auth, tem_senha_configurada, email_confirmado
ORDER BY cenario, papel, id_escola;
