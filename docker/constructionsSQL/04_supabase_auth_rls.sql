-- ============================================================================
-- NexusClass - Políticas de Row Level Security (RLS) para Supabase
-- Arquivo: 04_supabase_auth_rls.sql
-- Pré-requisito:
--   Executar após 01_esquema.sql (onde Perfil.id_perfil é UUID vinculado
--   a auth.users(id)).
-- ============================================================================

SET client_encoding = 'UTF8';

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Escola
-- ----------------------------------------------------------------------------
ALTER TABLE public.Escola ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Escola: leitura publica" ON public.Escola;
CREATE POLICY "Escola: leitura publica"
    ON public.Escola FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Escola: insercao apenas master" ON public.Escola;
CREATE POLICY "Escola: insercao apenas master"
    ON public.Escola FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Escola: atualizacao apenas master" ON public.Escola;
CREATE POLICY "Escola: atualizacao apenas master"
    ON public.Escola FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Escola: exclusao apenas master" ON public.Escola;
CREATE POLICY "Escola: exclusao apenas master"
    ON public.Escola FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 2. Turma
-- ----------------------------------------------------------------------------
ALTER TABLE public.Turma ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Turma: leitura publica" ON public.Turma;
CREATE POLICY "Turma: leitura publica"
    ON public.Turma FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Turma: insercao apenas master" ON public.Turma;
CREATE POLICY "Turma: insercao apenas master"
    ON public.Turma FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Turma: atualizacao apenas master" ON public.Turma;
CREATE POLICY "Turma: atualizacao apenas master"
    ON public.Turma FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Turma: exclusao apenas master" ON public.Turma;
CREATE POLICY "Turma: exclusao apenas master"
    ON public.Turma FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 3. Perfil
-- ----------------------------------------------------------------------------
ALTER TABLE public.Perfil ENABLE ROW LEVEL SECURITY;

CREATE SCHEMA IF NOT EXISTS nexusclass_private;
REVOKE ALL ON SCHEMA nexusclass_private FROM PUBLIC;
GRANT USAGE ON SCHEMA nexusclass_private TO authenticated;

CREATE OR REPLACE FUNCTION nexusclass_private.perfil_visivel_para_atual(
    p_id_alvo UUID,
    p_id_escola_alvo INTEGER,
    p_role_alvo VARCHAR
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        p_id_alvo = (SELECT auth.uid())
        OR p_role_alvo = 'master'
        OR EXISTS (
            SELECT 1
            FROM public.perfil AS eu
            WHERE eu.id_perfil = (SELECT auth.uid())
              AND (
                  eu.role = 'master'
                  OR (
                      eu.id_escola IS NOT NULL
                      AND eu.id_escola = p_id_escola_alvo
                  )
              )
        );
$$;

REVOKE ALL ON FUNCTION nexusclass_private.perfil_visivel_para_atual(UUID, INTEGER, VARCHAR)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION nexusclass_private.perfil_visivel_para_atual(UUID, INTEGER, VARCHAR)
    TO authenticated;

DROP POLICY IF EXISTS "Perfil: leitura para autenticados" ON public.Perfil;
CREATE POLICY "Perfil: leitura para autenticados"
    ON public.Perfil FOR SELECT
    TO authenticated
    USING (
        nexusclass_private.perfil_visivel_para_atual(
            id_perfil,
            id_escola,
            role
        )
    );

DROP POLICY IF EXISTS "Perfil: insercao proprio usuario ou master" ON public.Perfil;
CREATE POLICY "Perfil: insercao proprio usuario ou master"
    ON public.Perfil FOR INSERT
    TO authenticated
    WITH CHECK (
        (
            (SELECT auth.uid()) = id_perfil
            AND role = 'aluno'
            AND id_escola IS NOT NULL
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Perfil: atualizacao proprio perfil sem escalar role ou master" ON public.Perfil;
CREATE POLICY "Perfil: atualizacao proprio perfil sem escalar role ou master"
    ON public.Perfil FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_perfil
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        (
            (SELECT auth.uid()) = id_perfil
            AND Perfil.role = (
                SELECT p.role FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid())
            )
            AND Perfil.id_escola IS NOT DISTINCT FROM (
                SELECT p.id_escola FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid())
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Perfil: exclusao proprio aluno ou master" ON public.Perfil;
CREATE POLICY "Perfil: exclusao proprio aluno ou master"
    ON public.Perfil FOR DELETE
    TO authenticated
    USING (
        ((SELECT auth.uid()) = id_perfil AND role = 'aluno')
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 4. Professor_Turma
-- ----------------------------------------------------------------------------
ALTER TABLE public.Professor_Turma ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professor_Turma: leitura para autenticados" ON public.Professor_Turma;
CREATE POLICY "Professor_Turma: leitura para autenticados"
    ON public.Professor_Turma FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Professor_Turma: insercao apenas master" ON public.Professor_Turma;
CREATE POLICY "Professor_Turma: insercao apenas master"
    ON public.Professor_Turma FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Professor_Turma: atualizacao apenas master" ON public.Professor_Turma;
CREATE POLICY "Professor_Turma: atualizacao apenas master"
    ON public.Professor_Turma FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Professor_Turma: exclusao apenas master" ON public.Professor_Turma;
CREATE POLICY "Professor_Turma: exclusao apenas master"
    ON public.Professor_Turma FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 5. Aluno_Turma
-- ----------------------------------------------------------------------------
ALTER TABLE public.Aluno_Turma ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Aluno_Turma: leitura aluno professor da turma ou master" ON public.Aluno_Turma;
CREATE POLICY "Aluno_Turma: leitura aluno professor da turma ou master"
    ON public.Aluno_Turma FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Aluno_Turma.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Aluno_Turma: insercao proprio aluno ou master" ON public.Aluno_Turma;
CREATE POLICY "Aluno_Turma: insercao proprio aluno ou master"
    ON public.Aluno_Turma FOR INSERT
    TO authenticated
    WITH CHECK (
        (
            (SELECT auth.uid()) = id_aluno
            AND EXISTS (
                SELECT 1
                FROM public.Perfil p
                JOIN public.Turma t ON t.id_escola = p.id_escola
                WHERE p.id_perfil = (SELECT auth.uid())
                  AND t.id_turma = Aluno_Turma.id_turma
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Aluno_Turma: atualizacao proprio aluno ou master" ON public.Aluno_Turma;
CREATE POLICY "Aluno_Turma: atualizacao proprio aluno ou master"
    ON public.Aluno_Turma FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        (
            (SELECT auth.uid()) = id_aluno
            AND EXISTS (
                SELECT 1
                FROM public.Perfil p
                JOIN public.Turma t ON t.id_escola = p.id_escola
                WHERE p.id_perfil = (SELECT auth.uid())
                  AND t.id_turma = Aluno_Turma.id_turma
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Aluno_Turma: exclusao proprio aluno ou master" ON public.Aluno_Turma;
CREATE POLICY "Aluno_Turma: exclusao proprio aluno ou master"
    ON public.Aluno_Turma FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 6. Atividade
-- ----------------------------------------------------------------------------
ALTER TABLE public.Atividade ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Atividade: leitura para membros da turma" ON public.Atividade;
CREATE POLICY "Atividade: leitura para membros da turma"
    ON public.Atividade FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Atividade.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Aluno_Turma al
            WHERE al.id_turma = Atividade.id_turma
              AND al.id_aluno = (SELECT auth.uid())
              AND al.situacao = 'ativa'
        )
    );

DROP POLICY IF EXISTS "Atividade: insercao professor da turma ou master" ON public.Atividade;
CREATE POLICY "Atividade: insercao professor da turma ou master"
    ON public.Atividade FOR INSERT
    TO authenticated
    WITH CHECK (
        (
            id_professor = (SELECT auth.uid())
            AND EXISTS (
                SELECT 1
                FROM public.Professor_Turma pt
                JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                WHERE pt.id_turma = Atividade.id_turma
                  AND pt.id_professor = (SELECT auth.uid())
                  AND p.role IN ('professor', 'master')
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Atividade: atualizacao professor da turma ou master" ON public.Atividade;
CREATE POLICY "Atividade: atualizacao professor da turma ou master"
    ON public.Atividade FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Atividade.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Atividade.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Atividade: exclusao professor da turma ou master" ON public.Atividade;
CREATE POLICY "Atividade: exclusao professor da turma ou master"
    ON public.Atividade FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Atividade.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 7. Atividade_Anexo
-- ----------------------------------------------------------------------------
ALTER TABLE public.Atividade_Anexo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Atividade_Anexo: leitura membros da turma" ON public.Atividade_Anexo;
CREATE POLICY "Atividade_Anexo: leitura membros da turma"
    ON public.Atividade_Anexo FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Atividade a
            WHERE a.id_atividade = Atividade_Anexo.id_atividade
              AND (
                  EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
                  OR EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = a.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Aluno_Turma al
                      WHERE al.id_turma = a.id_turma
                        AND al.id_aluno = (SELECT auth.uid())
                        AND al.situacao = 'ativa'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Atividade_Anexo: insercao professor da turma ou master" ON public.Atividade_Anexo;
CREATE POLICY "Atividade_Anexo: insercao professor da turma ou master"
    ON public.Atividade_Anexo FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Atividade a
            WHERE a.id_atividade = Atividade_Anexo.id_atividade
              AND (
                  EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = a.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Atividade_Anexo: atualizacao professor da turma ou master" ON public.Atividade_Anexo;
CREATE POLICY "Atividade_Anexo: atualizacao professor da turma ou master"
    ON public.Atividade_Anexo FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Atividade a
            WHERE a.id_atividade = Atividade_Anexo.id_atividade
              AND (
                  EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = a.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Atividade a
            WHERE a.id_atividade = Atividade_Anexo.id_atividade
              AND (
                  EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = a.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Atividade_Anexo: exclusao professor da turma ou master" ON public.Atividade_Anexo;
CREATE POLICY "Atividade_Anexo: exclusao professor da turma ou master"
    ON public.Atividade_Anexo FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Atividade a
            WHERE a.id_atividade = Atividade_Anexo.id_atividade
              AND (
                  EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = a.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

-- ----------------------------------------------------------------------------
-- 8. Entrega_Atividade
-- ----------------------------------------------------------------------------
ALTER TABLE public.Entrega_Atividade ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Entrega_Atividade: leitura dono professor da turma ou master" ON public.Entrega_Atividade;
CREATE POLICY "Entrega_Atividade: leitura dono professor da turma ou master"
    ON public.Entrega_Atividade FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
        OR EXISTS (
            SELECT 1
            FROM public.Atividade a
            JOIN public.Professor_Turma pt ON pt.id_turma = a.id_turma
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE a.id_atividade = Entrega_Atividade.id_atividade
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
    );

DROP POLICY IF EXISTS "Entrega_Atividade: insercao aluno ativo da turma" ON public.Entrega_Atividade;
CREATE POLICY "Entrega_Atividade: insercao aluno ativo da turma"
    ON public.Entrega_Atividade FOR INSERT
    TO authenticated
    WITH CHECK (
        (
            (SELECT auth.uid()) = id_aluno
            AND nota IS NULL
            AND feedback IS NULL
            AND EXISTS (
                SELECT 1
                FROM public.Atividade a
                JOIN public.Aluno_Turma al ON al.id_turma = a.id_turma
                WHERE a.id_atividade = Entrega_Atividade.id_atividade
                  AND al.id_aluno = (SELECT auth.uid())
                  AND al.situacao = 'ativa'
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Entrega_Atividade: reenvio pelo aluno sem alterar nota" ON public.Entrega_Atividade;
CREATE POLICY "Entrega_Atividade: reenvio pelo aluno sem alterar nota"
    ON public.Entrega_Atividade FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        AND EXISTS (
            SELECT 1
            FROM public.Atividade a
            JOIN public.Aluno_Turma al ON al.id_turma = a.id_turma
            WHERE a.id_atividade = Entrega_Atividade.id_atividade
              AND al.id_aluno = (SELECT auth.uid())
              AND al.situacao = 'ativa'
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = id_aluno
        AND EXISTS (
            SELECT 1
            FROM public.Entrega_Atividade ea
            WHERE ea.id_entrega = Entrega_Atividade.id_entrega
              AND ea.id_aluno = (SELECT auth.uid())
              AND ea.nota IS NOT DISTINCT FROM Entrega_Atividade.nota
              AND ea.feedback IS NOT DISTINCT FROM Entrega_Atividade.feedback
        )
    );

DROP POLICY IF EXISTS "Entrega_Atividade: avaliacao por professor da turma ou master" ON public.Entrega_Atividade;
CREATE POLICY "Entrega_Atividade: avaliacao por professor da turma ou master"
    ON public.Entrega_Atividade FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
        OR EXISTS (
            SELECT 1
            FROM public.Atividade a
            JOIN public.Professor_Turma pt ON pt.id_turma = a.id_turma
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE a.id_atividade = Entrega_Atividade.id_atividade
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
        OR EXISTS (
            SELECT 1
            FROM public.Atividade a
            JOIN public.Professor_Turma pt ON pt.id_turma = a.id_turma
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE a.id_atividade = Entrega_Atividade.id_atividade
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
    );

DROP POLICY IF EXISTS "Entrega_Atividade: exclusao aluno dono ou master" ON public.Entrega_Atividade;
CREATE POLICY "Entrega_Atividade: exclusao aluno dono ou master"
    ON public.Entrega_Atividade FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 9. Duvida
-- ----------------------------------------------------------------------------
ALTER TABLE public.Duvida ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Duvida: leitura aluno professor da turma ou master" ON public.Duvida;
CREATE POLICY "Duvida: leitura aluno professor da turma ou master"
    ON public.Duvida FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR (SELECT auth.uid()) = id_professor
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Duvida.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Duvida: insercao aluno ativo da turma" ON public.Duvida;
CREATE POLICY "Duvida: insercao aluno ativo da turma"
    ON public.Duvida FOR INSERT
    TO authenticated
    WITH CHECK (
        (
            (SELECT auth.uid()) = id_aluno
            AND EXISTS (
                SELECT 1 FROM public.Aluno_Turma al
                WHERE al.id_turma = Duvida.id_turma
                  AND al.id_aluno = (SELECT auth.uid())
                  AND al.situacao = 'ativa'
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Duvida: atualizacao aluno professor da turma ou master" ON public.Duvida;
CREATE POLICY "Duvida: atualizacao aluno professor da turma ou master"
    ON public.Duvida FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR (SELECT auth.uid()) = id_professor
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Duvida.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = id_aluno
        OR (SELECT auth.uid()) = id_professor
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Duvida.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Duvida: exclusao aluno professor da turma ou master" ON public.Duvida;
CREATE POLICY "Duvida: exclusao aluno professor da turma ou master"
    ON public.Duvida FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR (SELECT auth.uid()) = id_professor
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Duvida.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 10. Duvida_Anexo
-- ----------------------------------------------------------------------------
ALTER TABLE public.Duvida_Anexo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Duvida_Anexo: leitura vinculados a duvida" ON public.Duvida_Anexo;
CREATE POLICY "Duvida_Anexo: leitura vinculados a duvida"
    ON public.Duvida_Anexo FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Duvida d
            WHERE d.id_duvida = Duvida_Anexo.id_duvida
              AND (
                  (SELECT auth.uid()) = d.id_aluno
                  OR (SELECT auth.uid()) = d.id_professor
                  OR EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = d.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Duvida_Anexo: insercao aluno autor ou master" ON public.Duvida_Anexo;
CREATE POLICY "Duvida_Anexo: insercao aluno autor ou master"
    ON public.Duvida_Anexo FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Duvida d
            WHERE d.id_duvida = Duvida_Anexo.id_duvida
              AND (
                  (SELECT auth.uid()) = d.id_aluno
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Duvida_Anexo: atualizacao vinculados a duvida" ON public.Duvida_Anexo;
CREATE POLICY "Duvida_Anexo: atualizacao vinculados a duvida"
    ON public.Duvida_Anexo FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Duvida d
            WHERE d.id_duvida = Duvida_Anexo.id_duvida
              AND (
                  (SELECT auth.uid()) = d.id_aluno
                  OR (SELECT auth.uid()) = d.id_professor
                  OR EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = d.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Duvida d
            WHERE d.id_duvida = Duvida_Anexo.id_duvida
              AND (
                  (SELECT auth.uid()) = d.id_aluno
                  OR (SELECT auth.uid()) = d.id_professor
                  OR EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = d.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Duvida_Anexo: exclusao vinculados a duvida" ON public.Duvida_Anexo;
CREATE POLICY "Duvida_Anexo: exclusao vinculados a duvida"
    ON public.Duvida_Anexo FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Duvida d
            WHERE d.id_duvida = Duvida_Anexo.id_duvida
              AND (
                  (SELECT auth.uid()) = d.id_aluno
                  OR (SELECT auth.uid()) = d.id_professor
                  OR EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = d.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

-- ----------------------------------------------------------------------------
-- 11. Mural_Post
-- ----------------------------------------------------------------------------
ALTER TABLE public.Mural_Post ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mural_Post: leitura membros da turma" ON public.Mural_Post;
CREATE POLICY "Mural_Post: leitura membros da turma"
    ON public.Mural_Post FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Mural_Post.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Aluno_Turma al
            WHERE al.id_turma = Mural_Post.id_turma
              AND al.id_aluno = (SELECT auth.uid())
              AND al.situacao = 'ativa'
        )
    );

DROP POLICY IF EXISTS "Mural_Post: insercao membros da turma" ON public.Mural_Post;
CREATE POLICY "Mural_Post: insercao membros da turma"
    ON public.Mural_Post FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = id_autor
        AND (
            EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Professor_Turma pt
                JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                WHERE pt.id_turma = Mural_Post.id_turma
                  AND pt.id_professor = (SELECT auth.uid())
                  AND p.role IN ('professor', 'master')
            )
            OR EXISTS (
                SELECT 1 FROM public.Aluno_Turma al
                WHERE al.id_turma = Mural_Post.id_turma
                  AND al.id_aluno = (SELECT auth.uid())
                  AND al.situacao = 'ativa'
            )
        )
    );

DROP POLICY IF EXISTS "Mural_Post: atualizacao apenas autor ou master" ON public.Mural_Post;
CREATE POLICY "Mural_Post: atualizacao apenas autor ou master"
    ON public.Mural_Post FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_autor
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = id_autor
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Mural_Post: exclusao autor professor da turma ou master" ON public.Mural_Post;
CREATE POLICY "Mural_Post: exclusao autor professor da turma ou master"
    ON public.Mural_Post FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_autor
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Mural_Post.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 12. Comentario_Mural
-- ----------------------------------------------------------------------------
ALTER TABLE public.Comentario_Mural ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comentario_Mural: leitura membros da turma" ON public.Comentario_Mural;
CREATE POLICY "Comentario_Mural: leitura membros da turma"
    ON public.Comentario_Mural FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Mural_Post mp
            WHERE mp.id_post = Comentario_Mural.id_post
              AND (
                  EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
                  OR EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = mp.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Aluno_Turma al
                      WHERE al.id_turma = mp.id_turma
                        AND al.id_aluno = (SELECT auth.uid())
                        AND al.situacao = 'ativa'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Comentario_Mural: insercao membros da turma" ON public.Comentario_Mural;
CREATE POLICY "Comentario_Mural: insercao membros da turma"
    ON public.Comentario_Mural FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = id_autor
        AND EXISTS (
            SELECT 1
            FROM public.Mural_Post mp
            WHERE mp.id_post = Comentario_Mural.id_post
              AND (
                  EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
                  OR EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = mp.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Aluno_Turma al
                      WHERE al.id_turma = mp.id_turma
                        AND al.id_aluno = (SELECT auth.uid())
                        AND al.situacao = 'ativa'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Comentario_Mural: atualizacao autor ou master" ON public.Comentario_Mural;
CREATE POLICY "Comentario_Mural: atualizacao autor ou master"
    ON public.Comentario_Mural FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_autor
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = id_autor
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Comentario_Mural: exclusao autor professor da turma ou master" ON public.Comentario_Mural;
CREATE POLICY "Comentario_Mural: exclusao autor professor da turma ou master"
    ON public.Comentario_Mural FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_autor
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
        OR EXISTS (
            SELECT 1
            FROM public.Mural_Post mp
            JOIN public.Professor_Turma pt ON pt.id_turma = mp.id_turma
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE mp.id_post = Comentario_Mural.id_post
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
    );

-- ----------------------------------------------------------------------------
-- 13. Evento_Calendario
-- ----------------------------------------------------------------------------
ALTER TABLE public.Evento_Calendario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Evento_Calendario: leitura pessoal ou membros da turma" ON public.Evento_Calendario;
CREATE POLICY "Evento_Calendario: leitura pessoal ou membros da turma"
    ON public.Evento_Calendario FOR SELECT
    TO authenticated
    USING (
        (tipo = 'pessoal' AND (SELECT auth.uid()) = id_autor)
        OR (
            tipo = 'turma'
            AND (
                EXISTS (
                    SELECT 1 FROM public.Perfil p
                    WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.Professor_Turma pt
                    JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                    WHERE pt.id_turma = Evento_Calendario.id_turma
                      AND pt.id_professor = (SELECT auth.uid())
                      AND p.role IN ('professor', 'master')
                )
                OR EXISTS (
                    SELECT 1 FROM public.Aluno_Turma al
                    WHERE al.id_turma = Evento_Calendario.id_turma
                      AND al.id_aluno = (SELECT auth.uid())
                      AND al.situacao = 'ativa'
                )
            )
        )
    );

DROP POLICY IF EXISTS "Evento_Calendario: insercao pessoal ou professor/master" ON public.Evento_Calendario;
CREATE POLICY "Evento_Calendario: insercao pessoal ou professor/master"
    ON public.Evento_Calendario FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = id_autor
        AND (
            tipo = 'pessoal'
            OR (
                tipo = 'turma'
                AND (
                    EXISTS (
                        SELECT 1
                        FROM public.Professor_Turma pt
                        JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                        WHERE pt.id_turma = Evento_Calendario.id_turma
                          AND pt.id_professor = (SELECT auth.uid())
                          AND p.role IN ('professor', 'master')
                    )
                    OR EXISTS (
                        SELECT 1 FROM public.Perfil p
                        WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                    )
                )
            )
        )
    );

DROP POLICY IF EXISTS "Evento_Calendario: atualizacao autor professor ou master" ON public.Evento_Calendario;
CREATE POLICY "Evento_Calendario: atualizacao autor professor ou master"
    ON public.Evento_Calendario FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_autor
        OR (
            tipo = 'turma'
            AND EXISTS (
                SELECT 1
                FROM public.Professor_Turma pt
                JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                WHERE pt.id_turma = Evento_Calendario.id_turma
                  AND pt.id_professor = (SELECT auth.uid())
                  AND p.role IN ('professor', 'master')
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = id_autor
        OR (
            tipo = 'turma'
            AND EXISTS (
                SELECT 1
                FROM public.Professor_Turma pt
                JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                WHERE pt.id_turma = Evento_Calendario.id_turma
                  AND pt.id_professor = (SELECT auth.uid())
                  AND p.role IN ('professor', 'master')
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Evento_Calendario: exclusao autor professor ou master" ON public.Evento_Calendario;
CREATE POLICY "Evento_Calendario: exclusao autor professor ou master"
    ON public.Evento_Calendario FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_autor
        OR (
            tipo = 'turma'
            AND EXISTS (
                SELECT 1
                FROM public.Professor_Turma pt
                JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                WHERE pt.id_turma = Evento_Calendario.id_turma
                  AND pt.id_professor = (SELECT auth.uid())
                  AND p.role IN ('professor', 'master')
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 14. Alerta_Calendario
-- ----------------------------------------------------------------------------
ALTER TABLE public.Alerta_Calendario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alerta_Calendario: leitura se acessa evento pai" ON public.Alerta_Calendario;
CREATE POLICY "Alerta_Calendario: leitura se acessa evento pai"
    ON public.Alerta_Calendario FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Evento_Calendario ec
            WHERE ec.id_evento = Alerta_Calendario.id_evento
              AND (
                  (ec.tipo = 'pessoal' AND (SELECT auth.uid()) = ec.id_autor)
                  OR (
                      ec.tipo = 'turma'
                      AND (
                          EXISTS (
                              SELECT 1 FROM public.Perfil p
                              WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                          )
                          OR EXISTS (
                              SELECT 1
                              FROM public.Professor_Turma pt
                              JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                              WHERE pt.id_turma = ec.id_turma
                                AND pt.id_professor = (SELECT auth.uid())
                                AND p.role IN ('professor', 'master')
                          )
                          OR EXISTS (
                              SELECT 1 FROM public.Aluno_Turma al
                              WHERE al.id_turma = ec.id_turma
                                AND al.id_aluno = (SELECT auth.uid())
                                AND al.situacao = 'ativa'
                          )
                      )
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Alerta_Calendario: insercao criador professor ou master" ON public.Alerta_Calendario;
CREATE POLICY "Alerta_Calendario: insercao criador professor ou master"
    ON public.Alerta_Calendario FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Evento_Calendario ec
            WHERE ec.id_evento = Alerta_Calendario.id_evento
              AND (
                  (SELECT auth.uid()) = ec.id_autor
                  OR (
                      ec.tipo = 'turma'
                      AND EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = ec.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Alerta_Calendario: atualizacao criador professor ou master" ON public.Alerta_Calendario;
CREATE POLICY "Alerta_Calendario: atualizacao criador professor ou master"
    ON public.Alerta_Calendario FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Evento_Calendario ec
            WHERE ec.id_evento = Alerta_Calendario.id_evento
              AND (
                  (SELECT auth.uid()) = ec.id_autor
                  OR (
                      ec.tipo = 'turma'
                      AND EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = ec.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Evento_Calendario ec
            WHERE ec.id_evento = Alerta_Calendario.id_evento
              AND (
                  (SELECT auth.uid()) = ec.id_autor
                  OR (
                      ec.tipo = 'turma'
                      AND EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = ec.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Alerta_Calendario: exclusao criador professor ou master" ON public.Alerta_Calendario;
CREATE POLICY "Alerta_Calendario: exclusao criador professor ou master"
    ON public.Alerta_Calendario FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Evento_Calendario ec
            WHERE ec.id_evento = Alerta_Calendario.id_evento
              AND (
                  (SELECT auth.uid()) = ec.id_autor
                  OR (
                      ec.tipo = 'turma'
                      AND EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = ec.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

-- ----------------------------------------------------------------------------
-- 15. Mensagem
-- ----------------------------------------------------------------------------
ALTER TABLE public.Mensagem ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mensagem: leitura apenas participantes" ON public.Mensagem;
CREATE POLICY "Mensagem: leitura apenas participantes"
    ON public.Mensagem FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_remetente
        OR (SELECT auth.uid()) = id_destinatario
    );

DROP POLICY IF EXISTS "Mensagem: insercao apenas remetente" ON public.Mensagem;
CREATE POLICY "Mensagem: insercao apenas remetente"
    ON public.Mensagem FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = id_remetente);

DROP POLICY IF EXISTS "Mensagem: atualizacao remetente ou destinatario" ON public.Mensagem;
CREATE POLICY "Mensagem: atualizacao remetente ou destinatario"
    ON public.Mensagem FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_remetente
        OR (SELECT auth.uid()) = id_destinatario
    )
    WITH CHECK (
        (SELECT auth.uid()) = id_remetente
        OR (SELECT auth.uid()) = id_destinatario
    );

DROP POLICY IF EXISTS "Mensagem: exclusao remetente ou master" ON public.Mensagem;
CREATE POLICY "Mensagem: exclusao remetente ou master"
    ON public.Mensagem FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_remetente
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 16. Denuncia
-- ----------------------------------------------------------------------------
ALTER TABLE public.Denuncia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Denuncia: leitura autor ou master" ON public.Denuncia;
CREATE POLICY "Denuncia: leitura autor ou master"
    ON public.Denuncia FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_autor
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Denuncia: insercao autor como pendente" ON public.Denuncia;
CREATE POLICY "Denuncia: insercao autor como pendente"
    ON public.Denuncia FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = id_autor
        AND status = 'pendente'
        AND id_master IS NULL
        AND parecer_moderacao IS NULL
    );

DROP POLICY IF EXISTS "Denuncia: atualizacao apenas master" ON public.Denuncia;
CREATE POLICY "Denuncia: atualizacao apenas master"
    ON public.Denuncia FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Denuncia: exclusao apenas master" ON public.Denuncia;
CREATE POLICY "Denuncia: exclusao apenas master"
    ON public.Denuncia FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 17. Ticket_Suporte
-- ----------------------------------------------------------------------------
ALTER TABLE public.Ticket_Suporte ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ticket_Suporte: leitura dono ou master" ON public.Ticket_Suporte;
CREATE POLICY "Ticket_Suporte: leitura dono ou master"
    ON public.Ticket_Suporte FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_perfil
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Ticket_Suporte: insercao proprio usuario" ON public.Ticket_Suporte;
CREATE POLICY "Ticket_Suporte: insercao proprio usuario"
    ON public.Ticket_Suporte FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = id_perfil
        AND status = 'pendente'
        AND id_master IS NULL
        AND resposta_suporte IS NULL
    );

DROP POLICY IF EXISTS "Ticket_Suporte: atualizacao dono ou master" ON public.Ticket_Suporte;
CREATE POLICY "Ticket_Suporte: atualizacao dono ou master"
    ON public.Ticket_Suporte FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_perfil
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = id_perfil
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Ticket_Suporte: exclusao dono ou master" ON public.Ticket_Suporte;
CREATE POLICY "Ticket_Suporte: exclusao dono ou master"
    ON public.Ticket_Suporte FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_perfil
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 18. Ticket_Suporte_Anexo
-- ----------------------------------------------------------------------------
ALTER TABLE public.Ticket_Suporte_Anexo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ticket_Suporte_Anexo: leitura dono ou master" ON public.Ticket_Suporte_Anexo;
CREATE POLICY "Ticket_Suporte_Anexo: leitura dono ou master"
    ON public.Ticket_Suporte_Anexo FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Ticket_Suporte ts
            WHERE ts.id_suporte = Ticket_Suporte_Anexo.id_suporte
              AND (
                  (SELECT auth.uid()) = ts.id_perfil
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Ticket_Suporte_Anexo: insercao dono ou master" ON public.Ticket_Suporte_Anexo;
CREATE POLICY "Ticket_Suporte_Anexo: insercao dono ou master"
    ON public.Ticket_Suporte_Anexo FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Ticket_Suporte ts
            WHERE ts.id_suporte = Ticket_Suporte_Anexo.id_suporte
              AND (
                  (SELECT auth.uid()) = ts.id_perfil
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Ticket_Suporte_Anexo: atualizacao dono ou master" ON public.Ticket_Suporte_Anexo;
CREATE POLICY "Ticket_Suporte_Anexo: atualizacao dono ou master"
    ON public.Ticket_Suporte_Anexo FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Ticket_Suporte ts
            WHERE ts.id_suporte = Ticket_Suporte_Anexo.id_suporte
              AND (
                  (SELECT auth.uid()) = ts.id_perfil
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Ticket_Suporte ts
            WHERE ts.id_suporte = Ticket_Suporte_Anexo.id_suporte
              AND (
                  (SELECT auth.uid()) = ts.id_perfil
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Ticket_Suporte_Anexo: exclusao dono ou master" ON public.Ticket_Suporte_Anexo;
CREATE POLICY "Ticket_Suporte_Anexo: exclusao dono ou master"
    ON public.Ticket_Suporte_Anexo FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Ticket_Suporte ts
            WHERE ts.id_suporte = Ticket_Suporte_Anexo.id_suporte
              AND (
                  (SELECT auth.uid()) = ts.id_perfil
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

-- ----------------------------------------------------------------------------
-- 19. storage.objects (Buckets de Anexos e Entregas do Supabase Storage)
--     Obs.: RLS já vem habilitado por padrão em storage.objects no Supabase;
--           não executar ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY.
-- ----------------------------------------------------------------------------

-- Bucket: anexos_atividades (materiais publicados pelo professor em Atividade_Anexo)
DROP POLICY IF EXISTS "Storage anexos_atividades: leitura membros da turma" ON storage.objects;
CREATE POLICY "Storage anexos_atividades: leitura membros da turma"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'anexos_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Atividade_Anexo aa
                JOIN public.Atividade a ON a.id_atividade = aa.id_atividade
                WHERE aa.id_objeto_storage = objects.id
                  AND (
                      EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = a.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                      OR EXISTS (
                          SELECT 1 FROM public.Aluno_Turma al
                          WHERE al.id_turma = a.id_turma
                            AND al.id_aluno = (SELECT auth.uid())
                            AND al.situacao = 'ativa'
                      )
                  )
            )
        )
    );

DROP POLICY IF EXISTS "Storage anexos_atividades: upload professor ou master" ON storage.objects;
CREATE POLICY "Storage anexos_atividades: upload professor ou master"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'anexos_atividades'
        AND EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
    );

DROP POLICY IF EXISTS "Storage anexos_atividades: atualizacao dono ou master" ON storage.objects;
CREATE POLICY "Storage anexos_atividades: atualizacao dono ou master"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'anexos_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    )
    WITH CHECK (
        bucket_id = 'anexos_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    );

DROP POLICY IF EXISTS "Storage anexos_atividades: exclusao dono prof turma ou master" ON storage.objects;
CREATE POLICY "Storage anexos_atividades: exclusao dono prof turma ou master"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'anexos_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Atividade_Anexo aa
                JOIN public.Atividade a ON a.id_atividade = aa.id_atividade
                JOIN public.Professor_Turma pt ON pt.id_turma = a.id_turma
                JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                WHERE aa.id_objeto_storage = objects.id
                  AND pt.id_professor = (SELECT auth.uid())
                  AND p.role IN ('professor', 'master')
            )
        )
    );

-- Bucket: entregas_atividades (entregas privadas dos alunos em Entrega_Atividade)
DROP POLICY IF EXISTS "Storage entregas_atividades: leitura dono prof turma ou master" ON storage.objects;
CREATE POLICY "Storage entregas_atividades: leitura dono prof turma ou master"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'entregas_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Entrega_Atividade ea
                JOIN public.Atividade a ON a.id_atividade = ea.id_atividade
                WHERE ea.id_objeto_storage = objects.id
                  AND (
                      ea.id_aluno = (SELECT auth.uid())
                      OR EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = a.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                  )
            )
        )
    );

DROP POLICY IF EXISTS "Storage entregas_atividades: upload aluno ativo ou master" ON storage.objects;
CREATE POLICY "Storage entregas_atividades: upload aluno ativo ou master"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'entregas_atividades'
        AND (
            EXISTS (
                SELECT 1 FROM public.Aluno_Turma al
                WHERE al.id_aluno = (SELECT auth.uid()) AND al.situacao = 'ativa'
            )
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    );

DROP POLICY IF EXISTS "Storage entregas_atividades: atualizacao dono ou master" ON storage.objects;
CREATE POLICY "Storage entregas_atividades: atualizacao dono ou master"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'entregas_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    )
    WITH CHECK (
        bucket_id = 'entregas_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    );

DROP POLICY IF EXISTS "Storage entregas_atividades: exclusao dono ou master" ON storage.objects;
CREATE POLICY "Storage entregas_atividades: exclusao dono ou master"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'entregas_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1 FROM public.Entrega_Atividade ea
                WHERE ea.id_objeto_storage = objects.id
                  AND ea.id_aluno = (SELECT auth.uid())
            )
        )
    );

-- Bucket: duvidasalunostoprofessor (anexos de dúvidas em Duvida_Anexo)
DROP POLICY IF EXISTS "Storage duvidasalunostoprofessor: leitura vinculados ou master" ON storage.objects;
CREATE POLICY "Storage duvidasalunostoprofessor: leitura vinculados ou master"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'duvidasalunostoprofessor'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Duvida_Anexo da
                JOIN public.Duvida d ON d.id_duvida = da.id_duvida
                WHERE da.id_objeto_storage = objects.id
                  AND (
                      d.id_aluno = (SELECT auth.uid())
                      OR d.id_professor = (SELECT auth.uid())
                      OR EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = d.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                  )
            )
        )
    );

DROP POLICY IF EXISTS "Storage duvidasalunostoprofessor: upload aluno ativo ou master" ON storage.objects;
CREATE POLICY "Storage duvidasalunostoprofessor: upload aluno ativo ou master"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'duvidasalunostoprofessor'
        AND (
            EXISTS (
                SELECT 1 FROM public.Aluno_Turma al
                WHERE al.id_aluno = (SELECT auth.uid()) AND al.situacao = 'ativa'
            )
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    );

DROP POLICY IF EXISTS "Storage duvidasalunostoprofessor: atualizacao dono ou master" ON storage.objects;
CREATE POLICY "Storage duvidasalunostoprofessor: atualizacao dono ou master"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'duvidasalunostoprofessor'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    )
    WITH CHECK (
        bucket_id = 'duvidasalunostoprofessor'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    );

DROP POLICY IF EXISTS "Storage duvidasalunostoprofessor: exclusao vinculados ou master" ON storage.objects;
CREATE POLICY "Storage duvidasalunostoprofessor: exclusao vinculados ou master"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'duvidasalunostoprofessor'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Duvida_Anexo da
                JOIN public.Duvida d ON d.id_duvida = da.id_duvida
                WHERE da.id_objeto_storage = objects.id
                  AND (
                      d.id_aluno = (SELECT auth.uid())
                      OR d.id_professor = (SELECT auth.uid())
                      OR EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = d.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                  )
            )
        )
    );

-- Bucket: anexos_suporte (prints/anexos de tickets em Ticket_Suporte_Anexo)
DROP POLICY IF EXISTS "Storage anexos_suporte: leitura dono ou master" ON storage.objects;
CREATE POLICY "Storage anexos_suporte: leitura dono ou master"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'anexos_suporte'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Ticket_Suporte_Anexo tsa
                JOIN public.Ticket_Suporte ts ON ts.id_suporte = tsa.id_suporte
                WHERE tsa.id_objeto_storage = objects.id
                  AND ts.id_perfil = (SELECT auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "Storage anexos_suporte: upload usuario autenticado" ON storage.objects;
CREATE POLICY "Storage anexos_suporte: upload usuario autenticado"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'anexos_suporte'
        AND (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Storage anexos_suporte: atualizacao dono ou master" ON storage.objects;
CREATE POLICY "Storage anexos_suporte: atualizacao dono ou master"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'anexos_suporte'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    )
    WITH CHECK (
        bucket_id = 'anexos_suporte'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    );

DROP POLICY IF EXISTS "Storage anexos_suporte: exclusao dono ou master" ON storage.objects;
CREATE POLICY "Storage anexos_suporte: exclusao dono ou master"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'anexos_suporte'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Ticket_Suporte_Anexo tsa
                JOIN public.Ticket_Suporte ts ON ts.id_suporte = tsa.id_suporte
                WHERE tsa.id_objeto_storage = objects.id
                  AND ts.id_perfil = (SELECT auth.uid())
            )
        )
    );

COMMIT;