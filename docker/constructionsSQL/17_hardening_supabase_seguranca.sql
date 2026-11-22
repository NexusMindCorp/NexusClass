-- ============================================================================
-- NexusClass - Migração 17: Hardening de Segurança no Supabase (S-01 a S-06)
-- Referência: relatorios/2026-11/2026-11-22-auditoria-seguranca-supabase.md
-- Aplicar depois de 16_protecao_urls_e_entradas.sql.
-- Idempotente e compatível com Supabase hospedado e PostgreSQL/Docker local.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- S-01: Revogar EXECUTE de public.rls_auto_enable() para anon e authenticated
--       (elimina alertas 0028 e 0029 do Supabase Security Advisor)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
    END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- S-02 (Parte 1): Restringir SELECT de Escola e Turma apenas a authenticated
--                 (fecha listagem anônima de escolas e códigos de acesso)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Escola: leitura publica" ON public.escola;
CREATE POLICY "Escola: leitura publica"
    ON public.escola FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Turma: leitura publica" ON public.turma;
CREATE POLICY "Turma: leitura publica"
    ON public.turma FOR SELECT
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- S-02 (Parte 2): Isolar SELECT de Perfil por escola (+ próprio perfil + master)
--                 Usa função auxiliar SECURITY DEFINER em schema privado
--                 (sem recursão RLS e sem exposição na API PostgREST)
-- ----------------------------------------------------------------------------
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

DROP POLICY IF EXISTS "Perfil: leitura para autenticados" ON public.perfil;
CREATE POLICY "Perfil: leitura para autenticados"
    ON public.perfil FOR SELECT
    TO authenticated
    USING (
        nexusclass_private.perfil_visivel_para_atual(
            id_perfil,
            id_escola,
            role
        )
    );

-- ----------------------------------------------------------------------------
-- S-03: Garantir triggers RN12 (isolamento escola em Aluno_Turma e Professor_Turma)
--       Idempotente; revoga EXECUTE de anon/authenticated para evitar alertas Advisor
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_valida_escola_aluno_turma()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF (SELECT id_escola FROM public.perfil WHERE id_perfil = NEW.id_aluno)
       IS DISTINCT FROM
       (SELECT id_escola FROM public.turma WHERE id_turma = NEW.id_turma)
    THEN
        RAISE EXCEPTION 'Aluno e turma pertencem a escolas diferentes (RN12)';
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_valida_escola_aluno_turma()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_aluno_turma_escola ON public.aluno_turma;
CREATE TRIGGER trg_aluno_turma_escola
    BEFORE INSERT OR UPDATE ON public.aluno_turma
    FOR EACH ROW EXECUTE FUNCTION public.fn_valida_escola_aluno_turma();

CREATE OR REPLACE FUNCTION public.fn_valida_escola_professor_turma()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF (SELECT id_escola FROM public.perfil WHERE id_perfil = NEW.id_professor)
       IS DISTINCT FROM
       (SELECT id_escola FROM public.turma WHERE id_turma = NEW.id_turma)
    THEN
        RAISE EXCEPTION 'Professor e turma pertencem a escolas diferentes (RN12)';
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_valida_escola_professor_turma()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_professor_turma_escola ON public.professor_turma;
CREATE TRIGGER trg_professor_turma_escola
    BEFORE INSERT OR UPDATE ON public.professor_turma
    FOR EACH ROW EXECUTE FUNCTION public.fn_valida_escola_professor_turma();

-- ----------------------------------------------------------------------------
-- S-04: Definir file_size_limit = 10 MB (10485760 bytes) nos 4 buckets privados
--       (mantém allowed_mime_types flexível para arquivos acadêmicos de Computação)
-- ----------------------------------------------------------------------------
UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id IN (
    'anexos_atividades',
    'entregas_atividades',
    'duvidasalunostoprofessor',
    'anexos_suporte'
);

-- ----------------------------------------------------------------------------
-- S-06: Defesa em profundidade — revogar privilégios DDL de escrita do papel anon
--       em todas as tabelas do schema public (mantendo RLS como camada primária)
-- ----------------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
ON ALL TABLES IN SCHEMA public
FROM anon;

COMMIT;
