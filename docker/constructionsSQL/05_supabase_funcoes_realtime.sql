-- ============================================================================
-- NexusClass - Funções, Triggers, Realtime, Storage Policy e Cron (Supabase)
-- Arquivo: 05_supabase_funcoes_realtime.sql
-- Pré-requisitos:
--   Executar após 01_esquema.sql e 04_supabase_auth_rls.sql.
--   Em ambiente com massa de testes: 01 -> 04 -> 02_carga.sql -> 05 (pois
--   02_carga.sql pré-popula auth.users e Perfil para master/professor/aluno).
--   Em produção limpa (sem 02_carga.sql): 01 -> 04 -> 05.
-- Referência: ADR-009 (.agents/decisions/adr-009-camada-acesso-dados-esquema-normalizado.md)
-- ============================================================================

SET client_encoding = 'UTF8';

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Trigger de cadastro: cria Perfil automaticamente ao registrar em auth.users
--    Papel é sempre fixado em 'aluno' (nunca confia em role vindo do metadata).
--    id_escola é obrigatório pela constraint ck_perfil_escola_por_role:
--    se ausente ou não numérico, permanece NULL e a inserção falha no CHECK.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_id_escola INTEGER;
    v_nome VARCHAR(150);
BEGIN
    IF (NEW.raw_user_meta_data ->> 'id_escola') ~ '^\d+$' THEN
        v_id_escola := (NEW.raw_user_meta_data ->> 'id_escola')::INTEGER;
    ELSE
        v_id_escola := NULL;
    END IF;

    v_nome := LEFT(
        COALESCE(
            NULLIF(TRIM(NEW.raw_user_meta_data ->> 'nome'), ''),
            split_part(COALESCE(NEW.email, ''), '@', 1),
            'Usuário'
        ),
        150
    );

    INSERT INTO public.Perfil (id_perfil, role, nome, email, id_escola)
    VALUES (NEW.id, 'aluno', v_nome, NEW.email, v_id_escola)
    ON CONFLICT (id_perfil) DO NOTHING;

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. Publicação Realtime para os 5 canais do NotificacaoSubject
--    REPLICA IDENTITY FULL em Entrega_Atividade garante que eventos DELETE
--    filtrados por coluna não-PK (id_aluno=eq.<uuid>) sejam propagados.
-- ----------------------------------------------------------------------------
ALTER TABLE public.Entrega_Atividade REPLICA IDENTITY FULL;

DO $$
DECLARE
    v_tabela TEXT;
    v_tabelas TEXT[] := ARRAY[
        'mural_post',
        'atividade',
        'entrega_atividade',
        'mensagem',
        'alerta_calendario'
    ];
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        FOREACH v_tabela IN ARRAY v_tabelas LOOP
            IF NOT EXISTS (
                SELECT 1
                FROM pg_publication_tables
                WHERE pubname = 'supabase_realtime'
                  AND schemaname = 'public'
                  AND tablename = v_tabela
            ) THEN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_tabela);
            END IF;
        END LOOP;
    END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Storage (entregas_atividades): permitir que o professor da turma remova
--    arquivos de entregas ao excluir uma atividade da própria turma.
--    (Política aditiva às definidas em 04_supabase_auth_rls.sql.)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Storage entregas_atividades: exclusao professor da turma" ON storage.objects;
CREATE POLICY "Storage entregas_atividades: exclusao professor da turma"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'entregas_atividades'
        AND EXISTS (
            SELECT 1
            FROM public.Entrega_Atividade ea
            JOIN public.Atividade a ON a.id_atividade = ea.id_atividade
            JOIN public.Professor_Turma pt ON pt.id_turma = a.id_turma
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE ea.id_objeto_storage = objects.id
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
    );

-- ----------------------------------------------------------------------------
-- 4. Gerador de alertas de calendário via pg_cron (5 e 1 minuto antes)
--    Adaptação idempotente de processar_alertas_antecedencia para o esquema novo.
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.fn_processar_alertas_calendario()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    DELETE FROM public.Alerta_Calendario
    WHERE lembrete_para <= now() - interval '1 minute';

    INSERT INTO public.Alerta_Calendario (mensagem, minutos_antes, lembrete_para, id_evento)
    SELECT
        format(
            'Lembrete: "%s" começa em %s minuto%s.',
            e.titulo,
            alvo.m,
            CASE WHEN alvo.m = 1 THEN '' ELSE 's' END
        ),
        alvo.m,
        (e.data::timestamp + e.horario) - make_interval(mins => alvo.m),
        e.id_evento
    FROM public.Evento_Calendario e
    CROSS JOIN (VALUES (5), (1)) AS alvo(m)
    WHERE (e.data::timestamp + e.horario)
        BETWEEN now() + make_interval(mins => alvo.m)
            AND now() + make_interval(mins => alvo.m + 1)
      AND NOT EXISTS (
          SELECT 1
          FROM public.Alerta_Calendario ac
          WHERE ac.id_evento = e.id_evento
            AND ac.minutos_antes = alvo.m
      )
    ON CONFLICT ON CONSTRAINT uq_alerta_evento_tempo_dest DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_processar_alertas_calendario() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_processar_alertas_calendario() TO service_role;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'processar_alertas_antecedencia') THEN
        PERFORM cron.unschedule('processar_alertas_antecedencia');
    END IF;

    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'processar_alertas_calendario') THEN
        PERFORM cron.unschedule('processar_alertas_calendario');
    END IF;

    PERFORM cron.schedule(
        'processar_alertas_calendario',
        '* * * * *',
        'SELECT public.fn_processar_alertas_calendario();'
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. View segura (security_invoker = true) para resolver id_objeto_storage -> name
--    As tabelas de anexo em public armazenam apenas o UUID (storage.objects.id);
--    esta view permite consultar os caminhos no bucket aplicando integralmente
--    as políticas RLS de storage.objects definidas em 04_supabase_auth_rls.sql.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_storage_objetos
WITH (security_invoker = true) AS
SELECT
    id,
    bucket_id,
    name
FROM storage.objects;

REVOKE ALL ON public.v_storage_objetos FROM PUBLIC, anon;
GRANT SELECT ON public.v_storage_objetos TO authenticated;

COMMIT;

-- Atualiza o cache de schema do PostgREST após alterações de DDL/funções
SELECT pg_notify('pgrst', 'reload schema');
