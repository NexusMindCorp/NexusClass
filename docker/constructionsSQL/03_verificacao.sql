-- ============================================================================
-- DCC060 - Banco de Dados (2026.3) - Grupo 24: Sistema NexusClass
-- Arquivo: 03_verificacao.sql
-- Revisão: Gianlucca Paiva (GianluccaPaiva) — 2026-11-21
-- Pré-requisitos:
--   Executar após 01_esquema.sql, 04_supabase_auth_rls.sql, 02_carga.sql,
--   05_supabase_funcoes_realtime.sql e migrações 06 a 14.
-- Descrição:
--   Suíte reversível (BEGIN ... ROLLBACK) com 16 testes de integridade
--   cobrindo as 11 verificações originais do relatório (adaptadas para UUIDs
--   determinísticos e datas relativas) e as 5 regras adicionadas no esquema
--   vigente e migrações 08 a 13 (RN11, RN12, RN01 feedback, RN04 data passada
--   e invalidação de alertas ao reagendar).
-- ============================================================================

SET client_encoding = 'UTF8';

BEGIN;

-- ============================================================================
-- TESTE 1: RN01 / Domínio de Nota (CHECK ck_entrega_nota_intervalo)
-- Operação: UPDATE tentando atribuir nota = 150.00 à entrega da Alice na Ativ. 1.
-- Resultado esperado: Rejeição por check_violation (SQLSTATE 23514).
-- ============================================================================
DO $$
DECLARE
    v_constraint TEXT;
BEGIN
    UPDATE public.Entrega_Atividade
    SET nota = 150.00
    WHERE id_atividade = 1
      AND id_aluno = '00000000-0000-0000-0000-000000000008'::uuid;

    RAISE EXCEPTION '[TESTE 1 FALHOU] A nota 150.00 deveria ter sido barrada por ck_entrega_nota_intervalo.';
EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
    IF v_constraint IS DISTINCT FROM 'ck_entrega_nota_intervalo' THEN
        RAISE EXCEPTION '[TESTE 1 FALHOU] Constraint inesperada: % (esperado ck_entrega_nota_intervalo).', v_constraint;
    END IF;
    RAISE NOTICE '[TESTE 1 - RN01 NOTA 0..100 BARRADO COM SUCESSO] SQLSTATE % (%): %', SQLSTATE, v_constraint, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 2: RN02 / Domínio de Escopo de Evento (CHECK ck_evento_tipo)
-- Operação: INSERT de evento futuro com tipo = 'publico_externo'.
-- Resultado esperado: Rejeição por check_violation (SQLSTATE 23514).
-- ============================================================================
DO $$
DECLARE
    v_constraint TEXT;
    v_data_futura DATE := (statement_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date + 10;
BEGIN
    INSERT INTO public.Evento_Calendario (titulo, descricao, data, horario, tipo, id_autor, id_turma)
    VALUES (
        'Palestra Aberta',
        'Evento inválido',
        v_data_futura,
        '10:00:00',
        'publico_externo',
        '00000000-0000-0000-0000-000000000004'::uuid,
        1
    );

    RAISE EXCEPTION '[TESTE 2 FALHOU] O tipo publico_externo deveria ter sido barrado por ck_evento_tipo.';
EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
    IF v_constraint IS DISTINCT FROM 'ck_evento_tipo' THEN
        RAISE EXCEPTION '[TESTE 2 FALHOU] Constraint inesperada: % (esperado ck_evento_tipo).', v_constraint;
    END IF;
    RAISE NOTICE '[TESTE 2 - RN02 TIPO EVENTO BARRADO COM SUCESSO] SQLSTATE % (%): %', SQLSTATE, v_constraint, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 3: RN03 / Unicidade de Matrícula (PRIMARY KEY pk_aluno_turma)
-- Operação: INSERT duplicado da aluna Alice (...000000000008) na turma DCC000 (1).
-- Resultado esperado: Rejeição por unique_violation (SQLSTATE 23505).
-- ============================================================================
DO $$
DECLARE
    v_constraint TEXT;
BEGIN
    INSERT INTO public.Aluno_Turma (id_aluno, id_turma, situacao)
    VALUES ('00000000-0000-0000-0000-000000000008'::uuid, 1, 'ativa');

    RAISE EXCEPTION '[TESTE 3 FALHOU] Matrícula duplicada deveria ter sido barrada por pk_aluno_turma.';
EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
    IF v_constraint IS DISTINCT FROM 'pk_aluno_turma' THEN
        RAISE EXCEPTION '[TESTE 3 FALHOU] Constraint inesperada: % (esperado pk_aluno_turma).', v_constraint;
    END IF;
    RAISE NOTICE '[TESTE 3 - RN03 PK MATRÍCULA BARRADO COM SUCESSO] SQLSTATE % (%): %', SQLSTATE, v_constraint, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 4: RF02 / RN03 — Domínio de Situação de Matrícula (CHECK ck_aluno_turma_situacao)
-- Operação: UPDATE alterando situacao da matrícula da Alice na turma 1 para 'trancada'.
-- Resultado esperado: Rejeição por check_violation (SQLSTATE 23514).
-- ============================================================================
DO $$
DECLARE
    v_constraint TEXT;
BEGIN
    UPDATE public.Aluno_Turma
    SET situacao = 'trancada'
    WHERE id_aluno = '00000000-0000-0000-0000-000000000008'::uuid
      AND id_turma = 1;

    RAISE EXCEPTION '[TESTE 4 FALHOU] A situação trancada deveria ter sido barrada por ck_aluno_turma_situacao.';
EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
    IF v_constraint IS DISTINCT FROM 'ck_aluno_turma_situacao' THEN
        RAISE EXCEPTION '[TESTE 4 FALHOU] Constraint inesperada: % (esperado ck_aluno_turma_situacao).', v_constraint;
    END IF;
    RAISE NOTICE '[TESTE 4 - RF02/RN03 SITUAÇÃO BARRADO COM SUCESSO] SQLSTATE % (%): %', SQLSTATE, v_constraint, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 5: RN02 / Domínio de Antecedência de Alerta (CHECK ck_alerta_minutos_antes)
-- Operação: INSERT de alerta com minutos_antes = 15 no evento 1.
-- Resultado esperado: Rejeição por check_violation (SQLSTATE 23514).
-- ============================================================================
DO $$
DECLARE
    v_constraint TEXT;
BEGIN
    INSERT INTO public.Alerta_Calendario (mensagem, minutos_antes, lembrete_para, id_evento)
    VALUES ('Alerta fora do padrão', 15, '2030-12-31 13:45:00-03', 1);

    RAISE EXCEPTION '[TESTE 5 FALHOU] Antecedência de 15 min deveria ter sido barrada por ck_alerta_minutos_antes.';
EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
    IF v_constraint IS DISTINCT FROM 'ck_alerta_minutos_antes' THEN
        RAISE EXCEPTION '[TESTE 5 FALHOU] Constraint inesperada: % (esperado ck_alerta_minutos_antes).', v_constraint;
    END IF;
    RAISE NOTICE '[TESTE 5 - DOMÍNIO ALERTA BARRADO COM SUCESSO] SQLSTATE % (%): %', SQLSTATE, v_constraint, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 6: RN05 / Prevenção de Alertas Duplicados (UNIQUE uq_alerta_evento_tempo_dest)
-- Operação: INSERT duplicado de (id_evento = 1, minutos_antes = 5, lembrete_para = '2030-12-31 13:55:00-03').
-- Resultado esperado: Rejeição por unique_violation (SQLSTATE 23505).
-- ============================================================================
DO $$
DECLARE
    v_constraint TEXT;
BEGIN
    INSERT INTO public.Alerta_Calendario (mensagem, minutos_antes, lembrete_para, id_evento)
    VALUES ('Disparo duplicado de 5 min', 5, '2030-12-31 13:55:00-03', 1);

    RAISE EXCEPTION '[TESTE 6 FALHOU] Alerta duplicado deveria ter sido barrado por uq_alerta_evento_tempo_dest.';
EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
    IF v_constraint IS DISTINCT FROM 'uq_alerta_evento_tempo_dest' THEN
        RAISE EXCEPTION '[TESTE 6 FALHOU] Constraint inesperada: % (esperado uq_alerta_evento_tempo_dest).', v_constraint;
    END IF;
    RAISE NOTICE '[TESTE 6 - RN05 ALERTA DUPLICADO BARRADO COM SUCESSO] SQLSTATE % (%): %', SQLSTATE, v_constraint, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 7: RN06 / Exclusão em Cascata de Alertas (FK fk_alerta_evento ON DELETE CASCADE)
-- Operação: Cria evento futuro com 2 alertas, exclui o evento e confere 2 -> 0 alertas.
-- Resultado esperado: Operação aceita com remoção automática dos 2 alertas.
-- ============================================================================
DO $$
DECLARE
    v_id_evento INTEGER;
    v_qtd_antes INTEGER;
    v_qtd_depois INTEGER;
    v_data_futura DATE := (statement_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date + 10;
BEGIN
    INSERT INTO public.Evento_Calendario (titulo, descricao, data, horario, tipo, id_autor, id_turma)
    VALUES (
        'Evento Teste Cascata RN06',
        'Teste de exclusão em cascata',
        v_data_futura,
        '16:00:00',
        'turma',
        '00000000-0000-0000-0000-000000000004'::uuid,
        1
    )
    RETURNING id_evento INTO v_id_evento;

    INSERT INTO public.Alerta_Calendario (mensagem, minutos_antes, lembrete_para, id_evento) VALUES
        ('Alerta 5 min teste RN06', 5, (v_data_futura + TIME '15:55:00') AT TIME ZONE 'America/Sao_Paulo', v_id_evento),
        ('Alerta 1 min teste RN06', 1, (v_data_futura + TIME '15:59:00') AT TIME ZONE 'America/Sao_Paulo', v_id_evento);

    SELECT COUNT(*) INTO v_qtd_antes FROM public.Alerta_Calendario WHERE id_evento = v_id_evento;
    IF v_qtd_antes <> 2 THEN
        RAISE EXCEPTION '[TESTE 7 FALHOU] Esperado 2 alertas antes do DELETE, encontrado %.', v_qtd_antes;
    END IF;

    DELETE FROM public.Evento_Calendario WHERE id_evento = v_id_evento;

    SELECT COUNT(*) INTO v_qtd_depois FROM public.Alerta_Calendario WHERE id_evento = v_id_evento;
    IF v_qtd_depois <> 0 THEN
        RAISE EXCEPTION '[TESTE 7 FALHOU] Esperado 0 alertas após DELETE do evento, encontrado %.', v_qtd_depois;
    END IF;

    RAISE NOTICE '[TESTE 7 - RN06 CASCADE EXECUTADO COM SUCESSO] Alertas antes: % | Alertas após DELETE: %', v_qtd_antes, v_qtd_depois;
END $$;


-- ============================================================================
-- TESTE 8: Integridade Referencial Escola -> Turma/Perfil (ON DELETE RESTRICT)
-- Operação: DELETE da Escola 1 ('João XXIII'), que possui turmas e perfis vinculados.
-- Resultado esperado: Rejeição por foreign_key_violation (SQLSTATE 23503).
-- ============================================================================
DO $$
DECLARE
    v_constraint TEXT;
BEGIN
    DELETE FROM public.Escola WHERE id_escola = 1;

    RAISE EXCEPTION '[TESTE 8 FALHOU] Exclusão da Escola 1 deveria ter sido barrada por ON DELETE RESTRICT.';
EXCEPTION WHEN foreign_key_violation THEN
    GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
    IF v_constraint NOT IN ('fk_turma_escola', 'fk_perfil_escola') THEN
        RAISE EXCEPTION '[TESTE 8 FALHOU] Constraint inesperada: %.', v_constraint;
    END IF;
    RAISE NOTICE '[TESTE 8 - FK ON DELETE RESTRICT BARRADO COM SUCESSO] SQLSTATE % (%): %', SQLSTATE, v_constraint, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 9: RF01 / Nome Obrigatório em Perfil (NOT NULL)
-- Operação: INSERT em Perfil com nome = NULL.
-- Resultado esperado: Rejeição por not_null_violation (SQLSTATE 23502).
-- ============================================================================
DO $$
DECLARE
    v_coluna TEXT;
BEGIN
    INSERT INTO public.Perfil (id_perfil, role, nome, email, id_escola)
    VALUES (
        '99999999-0000-0000-0000-000000000009'::uuid,
        'aluno',
        NULL,
        'teste-nome-nulo@nexusclass.edu.br',
        1
    );

    RAISE EXCEPTION '[TESTE 9 FALHOU] Inserção de Perfil com nome nulo deveria ter sido barrada.';
EXCEPTION WHEN not_null_violation THEN
    GET STACKED DIAGNOSTICS v_coluna = COLUMN_NAME;
    IF v_coluna IS DISTINCT FROM 'nome' THEN
        RAISE EXCEPTION '[TESTE 9 FALHOU] Coluna inesperada: % (esperado nome).', v_coluna;
    END IF;
    RAISE NOTICE '[TESTE 9 - RF01 NOME NOT NULL BARRADO COM SUCESSO] SQLSTATE % (coluna %): %', SQLSTATE, v_coluna, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 10: RF04 / Existência da Turma em Atividade (FK fk_atividade_turma)
-- Operação: INSERT em Atividade referenciando turma inexistente (-1).
-- Resultado esperado: Rejeição por foreign_key_violation (SQLSTATE 23503).
-- ============================================================================
DO $$
DECLARE
    v_constraint TEXT;
BEGIN
    INSERT INTO public.Atividade (titulo, descricao, data_entrega, id_turma, id_professor)
    VALUES (
        'Atividade Turma Inexistente',
        'Teste de FK de turma inexistente',
        now() + interval '10 days',
        -1,
        '00000000-0000-0000-0000-000000000004'::uuid
    );

    RAISE EXCEPTION '[TESTE 10 FALHOU] Atividade em turma -1 deveria ter sido barrada por fk_atividade_turma.';
EXCEPTION WHEN foreign_key_violation THEN
    GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
    IF v_constraint IS DISTINCT FROM 'fk_atividade_turma' THEN
        RAISE EXCEPTION '[TESTE 10 FALHOU] Constraint inesperada: % (esperado fk_atividade_turma).', v_constraint;
    END IF;
    RAISE NOTICE '[TESTE 10 - RF04 FK TURMA BARRADO COM SUCESSO] SQLSTATE % (%): %', SQLSTATE, v_constraint, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 11: RF05 / Unicidade de Entrega por Aluno e Atividade (UNIQUE uq_entrega_atividade_aluno)
-- Operação: INSERT de segunda entrega da aluna Alice (...000000000008) na Atividade 1.
-- Resultado esperado: Rejeição por unique_violation (SQLSTATE 23505).
-- ============================================================================
DO $$
DECLARE
    v_constraint TEXT;
BEGIN
    INSERT INTO public.Entrega_Atividade (id_objeto_storage, nota, feedback, entregue_em, id_atividade, id_aluno)
    VALUES (
        '20000000-0000-0001-0000-000000000008'::uuid,
        NULL,
        NULL,
        now(),
        1,
        '00000000-0000-0000-0000-000000000008'::uuid
    );

    RAISE EXCEPTION '[TESTE 11 FALHOU] Entrega duplicada deveria ter sido barrada por uq_entrega_atividade_aluno.';
EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
    IF v_constraint IS DISTINCT FROM 'uq_entrega_atividade_aluno' THEN
        RAISE EXCEPTION '[TESTE 11 FALHOU] Constraint inesperada: % (esperado uq_entrega_atividade_aluno).', v_constraint;
    END IF;
    RAISE NOTICE '[TESTE 11 - RF05 UNIQUE ENTREGA BARRADO COM SUCESSO] SQLSTATE % (%): %', SQLSTATE, v_constraint, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 12: RN11 / Escola Obrigatória por Papel (CHECK ck_perfil_escola_por_role)
-- Operação: (12a) aluno com id_escola NULL e (12b) master com id_escola = 1.
-- Resultado esperado: Ambas rejeitadas por check_violation (SQLSTATE 23514).
-- ============================================================================
DO $$
DECLARE
    v_constraint TEXT;
BEGIN
    BEGIN
        INSERT INTO public.Perfil (id_perfil, role, nome, email, id_escola)
        VALUES (
            '99999999-0000-0000-0000-000000000012'::uuid,
            'aluno',
            'Aluno Sem Escola',
            'aluno-sem-escola@nexusclass.edu.br',
            NULL
        );
        RAISE EXCEPTION '[TESTE 12a FALHOU] Aluno com id_escola NULL deveria ter sido barrado.';
    EXCEPTION WHEN check_violation THEN
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        IF v_constraint IS DISTINCT FROM 'ck_perfil_escola_por_role' THEN
            RAISE EXCEPTION '[TESTE 12a FALHOU] Constraint inesperada: %.', v_constraint;
        END IF;
        RAISE NOTICE '[TESTE 12a - RN11 ALUNO SEM ESCOLA BARRADO COM SUCESSO] SQLSTATE % (%): %', SQLSTATE, v_constraint, SQLERRM;
    END;

    BEGIN
        INSERT INTO public.Perfil (id_perfil, role, nome, email, id_escola)
        VALUES (
            '99999999-0000-0000-0000-000000000013'::uuid,
            'master',
            'Master Com Escola',
            'master-com-escola@nexusclass.edu.br',
            1
        );
        RAISE EXCEPTION '[TESTE 12b FALHOU] Master com id_escola = 1 deveria ter sido barrado.';
    EXCEPTION WHEN check_violation THEN
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        IF v_constraint IS DISTINCT FROM 'ck_perfil_escola_por_role' THEN
            RAISE EXCEPTION '[TESTE 12b FALHOU] Constraint inesperada: %.', v_constraint;
        END IF;
        RAISE NOTICE '[TESTE 12b - RN11 MASTER COM ESCOLA BARRADO COM SUCESSO] SQLSTATE % (%): %', SQLSTATE, v_constraint, SQLERRM;
    END;
END $$;


-- ============================================================================
-- TESTE 13: RN12 / Isolamento de Escola na Matrícula (TRIGGER trg_aluno_turma_escola)
-- Operação: Aluna Alice (escola 1) tenta matricular-se na turma MAT101 (id_turma = 4, escola 3).
-- Resultado esperado: Rejeição por raise_exception (SQLSTATE P0001).
-- ============================================================================
DO $$
DECLARE
    v_barrado BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO public.Aluno_Turma (id_aluno, id_turma, situacao)
        VALUES ('00000000-0000-0000-0000-000000000008'::uuid, 4, 'ativa');
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM NOT LIKE '%RN12%' THEN
            RAISE EXCEPTION '[TESTE 13 FALHOU] Mensagem inesperada: %.', SQLERRM;
        END IF;
        v_barrado := TRUE;
        RAISE NOTICE '[TESTE 13 - RN12 ESCOLA DIFERENTE BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
    END;

    IF NOT v_barrado THEN
        RAISE EXCEPTION '[TESTE 13 FALHOU] Matrícula entre escolas diferentes deveria ter sido barrada por trg_aluno_turma_escola.';
    END IF;
END $$;


-- ============================================================================
-- TESTE 14: RN01 Feedback Pedagógico (Migração 09 — CHECK ck_entrega_feedback_avaliacao)
-- Operação: UPDATE com nota = 50.00 (< 60) e feedback curto (< 20 caracteres).
-- Resultado esperado: Rejeição por check_violation (SQLSTATE 23514).
-- ============================================================================
DO $$
DECLARE
    v_constraint TEXT;
BEGIN
    UPDATE public.Entrega_Atividade
    SET nota = 50.00,
        feedback = 'Curto demais'
    WHERE id_atividade = 1
      AND id_aluno = '00000000-0000-0000-0000-000000000008'::uuid;

    RAISE EXCEPTION '[TESTE 14 FALHOU] Nota < 60 com feedback curto deveria ter sido barrada por ck_entrega_feedback_avaliacao.';
EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
    IF v_constraint IS DISTINCT FROM 'ck_entrega_feedback_avaliacao' THEN
        RAISE EXCEPTION '[TESTE 14 FALHOU] Constraint inesperada: % (esperado ck_entrega_feedback_avaliacao).', v_constraint;
    END IF;
    RAISE NOTICE '[TESTE 14 - RN01 FEEDBACK CURTO BARRADO COM SUCESSO] SQLSTATE % (%): %', SQLSTATE, v_constraint, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 15: RN04 / Bloqueio de Evento em Data Passada (Migração 13 — TRIGGER validar_data_evento_insercao)
-- Operação: INSERT de evento pessoal com data de ontem (fuso America/Sao_Paulo).
-- Resultado esperado: Rejeição por check_violation (SQLSTATE 23514).
-- ============================================================================
DO $$
DECLARE
    v_data_ontem DATE := (statement_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date - 1;
BEGIN
    INSERT INTO public.Evento_Calendario (titulo, descricao, data, horario, tipo, id_autor, id_turma)
    VALUES (
        'Evento Passado Teste',
        'Deve ser barrado pela migração 13',
        v_data_ontem,
        '10:00:00',
        'pessoal',
        '00000000-0000-0000-0000-000000000004'::uuid,
        NULL
    );

    RAISE EXCEPTION '[TESTE 15 FALHOU] Evento em data passada deveria ter sido barrado por validar_data_evento_insercao.';
EXCEPTION WHEN check_violation THEN
    IF SQLERRM NOT LIKE '%anterior a hoje%' THEN
        RAISE EXCEPTION '[TESTE 15 FALHOU] Mensagem inesperada: %.', SQLERRM;
    END IF;
    RAISE NOTICE '[TESTE 15 - RN04 DATA PASSADA BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 16: Reagendamento Invalida Alertas Antigos (Migração 12 — TRIGGER invalidar_alertas_ao_reagendar)
-- Operação: Cria evento futuro com 1 alerta, altera horario e verifica 1 -> 0 alertas.
-- Resultado esperado: Trigger remove automaticamente o alerta do horário anterior.
-- ============================================================================
DO $$
DECLARE
    v_id_evento INTEGER;
    v_qtd_antes INTEGER;
    v_qtd_depois INTEGER;
    v_data_futura DATE := (statement_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date + 15;
BEGIN
    INSERT INTO public.Evento_Calendario (titulo, descricao, data, horario, tipo, id_autor, id_turma)
    VALUES (
        'Evento Teste Reagendamento M12',
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
        'Alerta antigo de 5 min (M12)',
        5,
        (v_data_futura + TIME '13:55:00') AT TIME ZONE 'America/Sao_Paulo',
        v_id_evento
    );

    SELECT COUNT(*) INTO v_qtd_antes FROM public.Alerta_Calendario WHERE id_evento = v_id_evento;
    IF v_qtd_antes <> 1 THEN
        RAISE EXCEPTION '[TESTE 16 FALHOU] Esperado 1 alerta antes do reagendamento, encontrado %.', v_qtd_antes;
    END IF;

    UPDATE public.Evento_Calendario
    SET horario = '16:00:00'
    WHERE id_evento = v_id_evento;

    SELECT COUNT(*) INTO v_qtd_depois FROM public.Alerta_Calendario WHERE id_evento = v_id_evento;
    IF v_qtd_depois <> 0 THEN
        RAISE EXCEPTION '[TESTE 16 FALHOU] Esperado 0 alertas após reagendamento, encontrado %.', v_qtd_depois;
    END IF;

    RAISE NOTICE '[TESTE 16 - MIGRAÇÃO 12 REAGENDAMENTO EXECUTADO COM SUCESSO] Alertas antes: % | Alertas após reagendar: %', v_qtd_antes, v_qtd_depois;
END $$;

ROLLBACK;
