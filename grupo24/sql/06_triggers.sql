-- ============================================================================
-- DCC060 - Banco de Dados (2026.3) - Grupo 24: Sistema NexusClass
-- Arquivo: 06_triggers.sql (Seções 7.2 e 7.3 do modelo_trabalho_v3.pdf — Entrega E6)
-- Reconciliado por: Gianlucca Paiva (GianluccaPaiva) — 2026-11-22
-- Pré-requisitos:
--   Executar após 01_esquema.sql, 02_carga.sql, 03_verificacao.sql,
--   (04_consultas.sql) e 05_visoes.sql.
--   (Instalar on_auth_user_created aqui garante compatibilidade com a carga
--    em lote de auth.users + Perfil executada em 02_carga.sql.)
-- Origem consolidada:
--   docker/constructionsSQL/01 (bloco 20), 05 (blocos 1 e 4), 08, 10, 11, 12,
--   13, 15 (normalização + handle_new_user) e 17 (S-03 RN12 REVOKE EXECUTE).
-- ============================================================================

SET client_encoding = 'UTF8';

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. RN12 — Isolamento de matrícula e docência por escola
--    Por que CHECK não resolve: exige cruzar id_escola em public.Perfil com
--    id_escola em public.Turma (subconsultas entre tabelas são vedadas em CHECK).
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
-- 2. ADR-010 — Normalização automática de Escola.codigo_publico (Migração 15)
--    Por que CHECK não resolve: precisa gerar/normalizar o valor (UPPER/BTRIM)
--    antes da gravação, não apenas rejeitar a tupla.
-- ----------------------------------------------------------------------------
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
    FOR EACH ROW EXECUTE FUNCTION nexusclass_private.normalizar_codigo_publico_escola();

-- ----------------------------------------------------------------------------
-- 3. RN08 — Restrição de edição docente a nota e feedback (Migração 10)
--    Por que CHECK não resolve: compara OLD vs. NEW e verifica papel da sessão
--    (auth.uid() -> Perfil.role = 'professor'). Executa alfabeticamente antes
--    de registrar_atraso_entrega.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION nexusclass_private.limitar_edicao_docente_entrega()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF ROW(NEW.id_entrega, NEW.id_aluno, NEW.id_atividade,
           NEW.id_objeto_storage, NEW.entregue_em, NEW.atraso)
       IS DISTINCT FROM
       ROW(OLD.id_entrega, OLD.id_aluno, OLD.id_atividade,
           OLD.id_objeto_storage, OLD.entregue_em, OLD.atraso)
       AND current_user = 'authenticated'
       AND EXISTS (
           SELECT 1
           FROM public.perfil AS perfil
           WHERE perfil.id_perfil = (SELECT auth.uid())
             AND perfil.role = 'professor'
       ) THEN
        RAISE EXCEPTION 'A avaliação docente só pode alterar nota e feedback.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION nexusclass_private.limitar_edicao_docente_entrega() FROM PUBLIC;

DROP TRIGGER IF EXISTS limitar_edicao_docente_entrega ON public.entrega_atividade;
CREATE TRIGGER limitar_edicao_docente_entrega
    BEFORE UPDATE ON public.entrega_atividade
    FOR EACH ROW EXECUTE FUNCTION nexusclass_private.limitar_edicao_docente_entrega();

-- ----------------------------------------------------------------------------
-- 4. RN07 — Registro automático de atraso na entrega (Migração 08)
--    Por que CHECK não resolve: compara statement_timestamp() com o prazo em
--    outra tabela (public.Atividade.data_entrega) e preserva OLD.atraso quando
--    a atualização altera apenas nota/feedback.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION nexusclass_private.registrar_atraso_entrega()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    prazo timestamptz;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.id_objeto_storage IS NOT DISTINCT FROM OLD.id_objeto_storage
           AND NEW.id_atividade IS NOT DISTINCT FROM OLD.id_atividade
           AND NEW.entregue_em IS NOT DISTINCT FROM OLD.entregue_em THEN
            NEW.atraso := OLD.atraso;
            RETURN NEW;
        END IF;
    END IF;

    SELECT atividade.data_entrega INTO STRICT prazo
    FROM public.atividade
    WHERE atividade.id_atividade = NEW.id_atividade;

    NEW.entregue_em := statement_timestamp();
    NEW.atraso := NEW.entregue_em > prazo;
    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION nexusclass_private.registrar_atraso_entrega() FROM PUBLIC;

DROP TRIGGER IF EXISTS registrar_atraso_entrega ON public.entrega_atividade;
CREATE TRIGGER registrar_atraso_entrega
    BEFORE INSERT OR UPDATE ON public.entrega_atividade
    FOR EACH ROW EXECUTE FUNCTION nexusclass_private.registrar_atraso_entrega();

-- ----------------------------------------------------------------------------
-- 5. RN02 — Invalidação automática de alertas ao reagendar evento (Migração 12)
--    Por que CHECK não resolve: exige efeito colateral transacional (DELETE em
--    public.Alerta_Calendario) quando data ou horario mudam em Evento_Calendario.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_invalidar_alertas_ao_reagendar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    DELETE FROM public.alerta_calendario
    WHERE id_evento = NEW.id_evento;
    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_invalidar_alertas_ao_reagendar()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS invalidar_alertas_ao_reagendar ON public.evento_calendario;
CREATE TRIGGER invalidar_alertas_ao_reagendar
    AFTER UPDATE OF data, horario ON public.evento_calendario
    FOR EACH ROW
    WHEN (OLD.data IS DISTINCT FROM NEW.data OR OLD.horario IS DISTINCT FROM NEW.horario)
    EXECUTE FUNCTION public.fn_invalidar_alertas_ao_reagendar();

-- ----------------------------------------------------------------------------
-- 6. RN04 — Bloqueio de evento em data passada (fuso America/Sao_Paulo — M13)
--    Por que CHECK não resolve: CHECK com data corrente é não-determinístico e
--    invalidaria eventos históricos já gravados ao alterar título/descrição.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_validar_data_evento_calendario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF NEW.data < (statement_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'A data do evento não pode ser anterior a hoje.';
    END IF;
    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_validar_data_evento_calendario()
    FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS validar_data_evento_insercao ON public.evento_calendario;
CREATE TRIGGER validar_data_evento_insercao
    BEFORE INSERT ON public.evento_calendario
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_validar_data_evento_calendario();

DROP TRIGGER IF EXISTS validar_data_evento_reagendamento ON public.evento_calendario;
CREATE TRIGGER validar_data_evento_reagendamento
    BEFORE UPDATE OF data, horario ON public.evento_calendario
    FOR EACH ROW
    WHEN (OLD.data IS DISTINCT FROM NEW.data OR OLD.horario IS DISTINCT FROM NEW.horario)
    EXECUTE FUNCTION public.fn_validar_data_evento_calendario();

-- ----------------------------------------------------------------------------
-- 7. RF01 / RN11 / ADR-010 — Provisionamento seguro de Perfil no cadastro (M05 + M15)
--    Sempre fixa role = 'aluno' e resolve id_escola pelo codigo_escola (ESC-XXXXXXXX).
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 8. RN02 — Rotina pg_cron de disparo de alertas (5 e 1 min antes, America/Sao_Paulo)
--    Consolida 05_supabase_funcoes_realtime.sql (bloco 4) + 11_alinha_fuso_alertas_calendario.sql.
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.fn_processar_alertas_calendario()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET TimeZone TO 'America/Sao_Paulo'
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

COMMIT;

-- ============================================================================
-- SEÇÃO 7.3 — VERIFICAÇÃO DOS GATILHOS (Transação reversível: BEGIN ... ROLLBACK)
-- Demonstra casos barrados (T1, T2, T3) e casos aceitos com efeito automático (T4, T5, T6).
-- ============================================================================
BEGIN;

-- ----------------------------------------------------------------------------
-- TESTE T1 (BARRADO): RN12 — Aluno de escola 1 tentando matricular-se na turma 4 (escola 3)
-- Mensagem de erro devolvida pelo SGBD:
--   ERROR:  Aluno e turma pertencem a escolas diferentes (RN12)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_barrado BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO public.Aluno_Turma (id_aluno, id_turma, situacao)
        VALUES ('00000000-0000-0000-0000-000000000008'::uuid, 4, 'ativa');
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM NOT LIKE '%RN12%' THEN
            RAISE EXCEPTION '[TESTE T1 FALHOU] Mensagem inesperada: %.', SQLERRM;
        END IF;
        v_barrado := TRUE;
        RAISE NOTICE '[TESTE T1 - RN12 ALUNO BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
    END;

    IF NOT v_barrado THEN
        RAISE EXCEPTION '[TESTE T1 FALHOU] Matrícula entre escolas diferentes deveria ter sido barrada.';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TESTE T2 (BARRADO): RN12 — Professor da escola 1 tentando vincular-se à turma 4 (escola 3)
-- Mensagem de erro devolvida pelo SGBD:
--   ERROR:  Professor e turma pertencem a escolas diferentes (RN12)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_barrado BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO public.Professor_Turma (id_professor, id_turma)
        VALUES ('00000000-0000-0000-0000-000000000004'::uuid, 4);
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM NOT LIKE '%RN12%' THEN
            RAISE EXCEPTION '[TESTE T2 FALHOU] Mensagem inesperada: %.', SQLERRM;
        END IF;
        v_barrado := TRUE;
        RAISE NOTICE '[TESTE T2 - RN12 PROFESSOR BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
    END;

    IF NOT v_barrado THEN
        RAISE EXCEPTION '[TESTE T2 FALHOU] Docência entre escolas diferentes deveria ter sido barrada.';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TESTE T3 (BARRADO): RN04 — Inserção de evento em data anterior a hoje (America/Sao_Paulo)
-- Mensagem de erro devolvida pelo SGBD:
--   ERROR:  A data do evento não pode ser anterior a hoje.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_data_ontem DATE := (statement_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date - 1;
BEGIN
    INSERT INTO public.Evento_Calendario (titulo, descricao, data, horario, tipo, id_autor, id_turma)
    VALUES (
        'Evento Passado Teste',
        'Deve ser barrado por validar_data_evento_insercao',
        v_data_ontem,
        '10:00:00',
        'pessoal',
        '00000000-0000-0000-0000-000000000004'::uuid,
        NULL
    );

    RAISE EXCEPTION '[TESTE T3 FALHOU] Evento em data passada deveria ter sido barrado.';
EXCEPTION WHEN check_violation THEN
    IF SQLERRM NOT LIKE '%anterior a hoje%' THEN
        RAISE EXCEPTION '[TESTE T3 FALHOU] Mensagem inesperada: %.', SQLERRM;
    END IF;
    RAISE NOTICE '[TESTE T3 - RN04 DATA PASSADA BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;

-- ----------------------------------------------------------------------------
-- TESTE T4 (ACEITO): RN02 — Reagendamento de horário invalida alertas antigos (1 -> 0)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_id_evento INTEGER;
    v_qtd_antes INTEGER;
    v_qtd_depois INTEGER;
    v_data_futura DATE := (statement_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date + 15;
BEGIN
    INSERT INTO public.Evento_Calendario (titulo, descricao, data, horario, tipo, id_autor, id_turma)
    VALUES (
        'Evento Teste Reagendamento RN02',
        'Valida invalidação automática de alertas ao reagendar',
        v_data_futura,
        '14:00:00',
        'turma',
        '00000000-0000-0000-0000-000000000004'::uuid,
        1
    )
    RETURNING id_evento INTO v_id_evento;

    INSERT INTO public.Alerta_Calendario (mensagem, minutos_antes, lembrete_para, id_evento)
    VALUES (
        'Alerta antigo de 5 min (RN02)',
        5,
        (v_data_futura + TIME '13:55:00') AT TIME ZONE 'America/Sao_Paulo',
        v_id_evento
    );

    SELECT COUNT(*) INTO v_qtd_antes FROM public.Alerta_Calendario WHERE id_evento = v_id_evento;
    UPDATE public.Evento_Calendario SET horario = '16:00:00' WHERE id_evento = v_id_evento;
    SELECT COUNT(*) INTO v_qtd_depois FROM public.Alerta_Calendario WHERE id_evento = v_id_evento;

    IF v_qtd_antes <> 1 OR v_qtd_depois <> 0 THEN
        RAISE EXCEPTION '[TESTE T4 FALHOU] Esperado 1 -> 0 alertas, obtido % -> %.', v_qtd_antes, v_qtd_depois;
    END IF;
    RAISE NOTICE '[TESTE T4 - RN02 REAGENDAMENTO ACEITO COM SUCESSO] Alertas: % -> %', v_qtd_antes, v_qtd_depois;
END $$;

-- ----------------------------------------------------------------------------
-- TESTE T5 (ACEITO): RN07 — Submissão após o prazo grava atraso = TRUE automaticamente
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_id_atividade INTEGER;
    v_atraso BOOLEAN;
BEGIN
    INSERT INTO public.Atividade (titulo, descricao, data_entrega, id_turma, id_professor)
    VALUES (
        'Atividade Prazo Expirado RN07',
        'Teste de cálculo automático de atraso',
        now() - interval '2 hours',
        1,
        '00000000-0000-0000-0000-000000000004'::uuid
    )
    RETURNING id_atividade INTO v_id_atividade;

    INSERT INTO public.Entrega_Atividade (id_objeto_storage, id_atividade, id_aluno)
    VALUES (
        '20000000-0000-0001-0000-000000000008'::uuid,
        v_id_atividade,
        '00000000-0000-0000-0000-000000000008'::uuid
    )
    RETURNING atraso INTO v_atraso;

    IF v_atraso IS DISTINCT FROM TRUE THEN
        RAISE EXCEPTION '[TESTE T5 FALHOU] Esperado atraso = TRUE, obtido %.', v_atraso;
    END IF;
    RAISE NOTICE '[TESTE T5 - RN07 ATRASO AUTOMÁTICO ACEITO COM SUCESSO] atraso = %', v_atraso;
END $$;

-- ----------------------------------------------------------------------------
-- TESTE T6 (ACEITO): ADR-010 — Normalização automática de Escola.codigo_publico
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_codigo TEXT;
BEGIN
    INSERT INTO public.Escola (nome, ano_letivo, codigo_publico)
    VALUES ('Escola Teste Normalização', 2026, '  esc-ab23cd45  ')
    RETURNING codigo_publico INTO v_codigo;

    IF v_codigo IS DISTINCT FROM 'ESC-AB23CD45' THEN
        RAISE EXCEPTION '[TESTE T6 FALHOU] Esperado ESC-AB23CD45, obtido %.', v_codigo;
    END IF;
    RAISE NOTICE '[TESTE T6 - ADR-010 NORMALIZAÇÃO ACEITA COM SUCESSO] codigo_publico = %', v_codigo;
END $$;

ROLLBACK;
