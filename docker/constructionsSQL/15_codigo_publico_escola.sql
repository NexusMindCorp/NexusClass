-- Aplicar depois de 14_rpc_storage_exclusao_conta.sql.
-- Referência: ADR-010 (.agents/decisions/adr-010-codigo-publico-escola.md)
-- Adiciona código público alfanumérico único (ESC-XXXXXXXX) em public.escola,
-- mantendo id_escola como chave interna, exige codigo_escola no cadastro via
-- handle_new_user() e restringe a leitura de codigo_publico ao próprio usuário
-- autenticado (via RPC), evitando enumeração por anon ou entre escolas.
BEGIN;

CREATE SCHEMA IF NOT EXISTS nexusclass_private;
REVOKE ALL ON SCHEMA nexusclass_private FROM PUBLIC;

-- ----------------------------------------------------------------------------
-- 1. Gerador de código público único no formato ESC-XXXXXXXX
--    Usa gen_random_uuid() nativo do PostgreSQL e alfabeto sem ambiguidade
--    (sem 0, O, 1, I, L) garantindo unicidade em public.escola.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION nexusclass_private.gerar_codigo_publico_escola()
RETURNS VARCHAR(16)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_alfabeto CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    v_hex TEXT;
    v_codigo TEXT;
    v_idx INTEGER;
    v_byte INTEGER;
    v_tentativa INTEGER := 0;
BEGIN
    LOOP
        v_tentativa := v_tentativa + 1;
        IF v_tentativa > 50 THEN
            RAISE EXCEPTION 'Não foi possível gerar um código público único para a escola.';
        END IF;

        v_hex := replace(gen_random_uuid()::text, '-', '');
        v_codigo := 'ESC-';

        FOR v_idx IN 0..7 LOOP
            v_byte := ('x' || substr(v_hex, (v_idx * 2) + 1, 2))::bit(8)::integer;
            v_codigo := v_codigo || substr(v_alfabeto, (v_byte % length(v_alfabeto)) + 1, 1);
        END LOOP;

        EXIT WHEN NOT EXISTS (
            SELECT 1
            FROM public.escola AS e
            WHERE e.codigo_publico = v_codigo
        );
    END LOOP;

    RETURN v_codigo::VARCHAR(16);
END;
$$;

REVOKE ALL ON FUNCTION nexusclass_private.gerar_codigo_publico_escola()
    FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. Coluna codigo_publico em public.escola + backfill idempotente + constraints
-- ----------------------------------------------------------------------------
ALTER TABLE public.escola
    ADD COLUMN IF NOT EXISTS codigo_publico VARCHAR(16);

UPDATE public.escola
SET codigo_publico = nexusclass_private.gerar_codigo_publico_escola()
WHERE codigo_publico IS NULL
   OR BTRIM(codigo_publico) = '';

UPDATE public.escola
SET codigo_publico = UPPER(BTRIM(codigo_publico))
WHERE codigo_publico <> UPPER(BTRIM(codigo_publico));

ALTER TABLE public.escola
    ALTER COLUMN codigo_publico SET DEFAULT nexusclass_private.gerar_codigo_publico_escola(),
    ALTER COLUMN codigo_publico SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.escola'::regclass
          AND conname = 'uq_escola_codigo_publico'
    ) THEN
        ALTER TABLE public.escola
            ADD CONSTRAINT uq_escola_codigo_publico UNIQUE (codigo_publico);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.escola'::regclass
          AND conname = 'ck_escola_codigo_publico_formato'
    ) THEN
        ALTER TABLE public.escola
            ADD CONSTRAINT ck_escola_codigo_publico_formato
            CHECK (codigo_publico ~ '^[A-Z0-9-]{4,16}$');
    END IF;
END;
$$;

-- Normaliza código informado manualmente e gera automaticamente se nulo/vazio
CREATE OR REPLACE FUNCTION nexusclass_private.normalizar_codigo_publico_escola()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.codigo_publico IS NULL OR BTRIM(NEW.codigo_publico) = '' THEN
        NEW.codigo_publico := nexusclass_private.gerar_codigo_publico_escola();
    ELSE
        NEW.codigo_publico := UPPER(BTRIM(NEW.codigo_publico));
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION nexusclass_private.normalizar_codigo_publico_escola()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS normalizar_codigo_publico_escola ON public.escola;
CREATE TRIGGER normalizar_codigo_publico_escola
    BEFORE INSERT OR UPDATE OF codigo_publico ON public.escola
    FOR EACH ROW
    EXECUTE FUNCTION nexusclass_private.normalizar_codigo_publico_escola();

-- ----------------------------------------------------------------------------
-- 3. Trigger de cadastro: exige codigo_escola (sem fallback para id_escola numérico)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_codigo_escola TEXT;
    v_id_escola INTEGER;
    v_nome VARCHAR(150);
BEGIN
    v_codigo_escola := UPPER(NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'codigo_escola', '')), ''));

    IF v_codigo_escola IS NOT NULL THEN
        SELECT e.id_escola
        INTO v_id_escola
        FROM public.escola AS e
        WHERE e.codigo_publico = v_codigo_escola
        LIMIT 1;
    ELSE
        v_id_escola := NULL;
    END IF;

    v_nome := LEFT(
        COALESCE(
            NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'nome'), ''),
            split_part(COALESCE(NEW.email, ''), '@', 1),
            'Usuário'
        ),
        150
    );

    INSERT INTO public.perfil (id_perfil, role, nome, email, id_escola)
    VALUES (NEW.id, 'aluno', v_nome, NEW.email, v_id_escola)
    ON CONFLICT (id_perfil) DO NOTHING;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. Proteção contra enumeração de codigo_publico (anon e outras escolas)
--    Mantém leitura das colunas públicas do catálogo, oculta codigo_publico
--    e expõe RPC exclusiva que devolve somente o código da própria escola.
-- ----------------------------------------------------------------------------
REVOKE SELECT ON public.escola FROM anon, authenticated;
GRANT SELECT (id_escola, nome, ano_letivo, created_at)
    ON public.escola TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.obter_codigo_publico_minha_escola()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT e.codigo_publico::TEXT
    FROM public.perfil AS p
    JOIN public.escola AS e ON e.id_escola = p.id_escola
    WHERE p.id_perfil = (SELECT auth.uid())
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.obter_codigo_publico_minha_escola()
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obter_codigo_publico_minha_escola()
    TO authenticated, service_role;

COMMIT;

-- Atualiza o cache do PostgREST para refletir coluna, privilégios e RPC
SELECT pg_notify('pgrst', 'reload schema');
