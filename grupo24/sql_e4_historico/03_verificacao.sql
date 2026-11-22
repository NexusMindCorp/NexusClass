-- ============================================================================
-- Grupo 24 - NexusClass | 03_verificacao.sql
-- ============================================================================

SET client_encoding = 'UTF8';

BEGIN;

-- ============================================================================
-- TESTE 1: Nota fora do intervalo (CHECK)
-- Regra: RN01 / Seção 3.2: nota entre 0 e 100.
-- Resultado esperado: operação barrada.
-- Mensagem de erro:
-- ERROR:  new row for relation "entrega_atividade" violates check constraint "ck_entrega_nota_intervalo"
-- ============================================================================
DO $$
BEGIN
    UPDATE Entrega_Atividade
    SET nota = 150.00
    WHERE id_entrega = 1;
    RAISE EXCEPTION '[TESTE 1 FALHOU] A operação que deveria ser barrada foi aceita.';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE '[TESTE 1 - RN01 BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;

-- ============================================================================
-- TESTE 2: Tipo de evento inválido (CHECK)
-- Regra: RN02 / Seção 3.2: tipo do evento pessoal ou turma.
-- Resultado esperado: operação barrada.
-- Mensagem de erro:
-- ERROR:  new row for relation "evento_calendario" violates check constraint "ck_evento_tipo"
-- ============================================================================
DO $$
BEGIN
    INSERT INTO Evento_Calendario (titulo, descricao, data, horario, tipo, id_autor, id_turma)
    VALUES ('Palestra Aberta', 'Evento inválido', '2026-12-01', '10:00:00', 'publico_externo', 4, 1);
    RAISE EXCEPTION '[TESTE 2 FALHOU] A operação que deveria ser barrada foi aceita.';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE '[TESTE 2 - RN02 BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;

-- ============================================================================
-- TESTE 3: Matrícula duplicada (PRIMARY KEY)
-- Regra: RN03: um único vínculo por aluno e turma.
-- Resultado esperado: operação barrada.
-- Mensagem de erro:
-- ERROR:  duplicate key value violates unique constraint "pk_aluno_turma"
-- DETAIL:  Key (id_aluno, id_turma)=(8, 1) already exists.
-- ============================================================================
DO $$
BEGIN
    INSERT INTO Aluno_Turma (id_aluno, id_turma, situacao)
    VALUES (8, 1, 'ativa');
    RAISE EXCEPTION '[TESTE 3 FALHOU] A operação que deveria ser barrada foi aceita.';
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '[TESTE 3 - RN03 BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;

-- ============================================================================
-- TESTE 4: Situação de matrícula inválida (CHECK)
-- Regra: RF02 e RN03: situação ativa ou cancelada.
-- Resultado esperado: operação barrada.
-- Mensagem de erro:
-- ERROR:  new row for relation "aluno_turma" violates check constraint "ck_aluno_turma_situacao"
-- ============================================================================
DO $$
BEGIN
    UPDATE Aluno_Turma
    SET situacao = 'trancada'
    WHERE id_aluno = 8 AND id_turma = 1;
    RAISE EXCEPTION '[TESTE 4 FALHOU] A operação que deveria ser barrada foi aceita.';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE '[TESTE 4 - RF02/RN03 BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;

-- ============================================================================
-- TESTE 5: Antecedência de alerta inválida (CHECK)
-- Regra: RN02 / Seção 3.2: antecedência de 1 ou 5 minutos.
-- Resultado esperado: operação barrada.
-- Mensagem de erro:
-- ERROR:  new row for relation "alerta_calendario" violates check constraint "ck_alerta_minutos_antes"
-- ============================================================================
DO $$
BEGIN
    INSERT INTO Alerta_Calendario (mensagem, minutos_antes, lembrete_para, id_evento)
    VALUES ('Alerta fora do padrão', 15, '2030-12-31 13:45:00-03', 1);
    RAISE EXCEPTION '[TESTE 5 FALHOU] A operação que deveria ser barrada foi aceita.';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE '[TESTE 5 - DOMÍNIO ALERTA BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;

-- ============================================================================
-- TESTE 6: Alerta duplicado (UNIQUE)
-- Regra: RN05: um único alerta por evento e antecedência.
-- Resultado esperado: operação barrada.
-- Mensagem de erro:
-- ERROR:  duplicate key value violates unique constraint "uq_alerta_evento_antecedencia"
-- DETAIL:  Key (id_evento, minutos_antes)=(1, 5) already exists.
-- ============================================================================
DO $$
BEGIN
    INSERT INTO Alerta_Calendario (mensagem, minutos_antes, lembrete_para, id_evento)
    VALUES ('Disparo duplicado de 5 min', 5, '2030-12-31 13:54:00-03', 1);
    RAISE EXCEPTION '[TESTE 6 FALHOU] A operação que deveria ser barrada foi aceita.';
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '[TESTE 6 - RN05 BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;

-- ============================================================================
-- TESTE 7: Exclusão em cascata dos alertas
-- Regra: RN06: excluir o evento remove seus alertas.
-- Resultado esperado: exclusão aceita; 2 alertas antes e 0 depois.
-- ============================================================================
DO $$
DECLARE
    v_id_evento INTEGER;
    v_qtd_antes INTEGER;
    v_qtd_depois INTEGER;
BEGIN
    INSERT INTO Evento_Calendario (titulo, descricao, data, horario, tipo, id_autor, id_turma)
    VALUES ('Evento Teste Cascata RN06', 'Teste de exclusão em cascata', '2026-12-10', '16:00:00', 'turma', 4, 1)
    RETURNING id_evento INTO v_id_evento;

    INSERT INTO Alerta_Calendario (mensagem, minutos_antes, lembrete_para, id_evento) VALUES
        ('Alerta 5 min teste RN06', 5, '2026-12-10 15:55:00-03', v_id_evento),
        ('Alerta 1 min teste RN06', 1, '2026-12-10 15:59:00-03', v_id_evento);

    SELECT COUNT(*) INTO v_qtd_antes FROM Alerta_Calendario WHERE id_evento = v_id_evento;

    DELETE FROM Evento_Calendario WHERE id_evento = v_id_evento;

    SELECT COUNT(*) INTO v_qtd_depois FROM Alerta_Calendario WHERE id_evento = v_id_evento;

    IF v_qtd_antes <> 2 OR v_qtd_depois <> 0 THEN
        RAISE EXCEPTION '[TESTE 7 FALHOU] Esperados 2 alertas antes e 0 depois; obtidos % e %.',
            v_qtd_antes, v_qtd_depois;
    END IF;

    RAISE NOTICE '[TESTE 7 - RN06 CASCADE EXECUTADO COM SUCESSO] Alertas antes do DELETE: % | Alertas após DELETE do Evento: %', v_qtd_antes, v_qtd_depois;
END $$;

-- ============================================================================
-- TESTE 8: Exclusão de escola com turmas (FOREIGN KEY)
-- Regra: Seção 3.2: escola referenciada por turmas não pode ser excluída.
-- Resultado esperado: operação barrada.
-- Mensagem de erro:
-- ERROR:  update or delete on table "escola" violates foreign key constraint "fk_turma_escola" on table "turma"
-- DETAIL:  Key (id_escola)=(1) is still referenced from table "turma".
-- ============================================================================
DO $$
BEGIN
    DELETE FROM Escola WHERE id_escola = 1;
    RAISE EXCEPTION '[TESTE 8 FALHOU] A operação que deveria ser barrada foi aceita.';
EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE '[TESTE 8 - FK ON DELETE RESTRICT BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;
-- ============================================================================
-- TESTE 9: Nome obrigatório (NOT NULL)
-- Regra: RF01 / Seção 3.2: o nome do perfil é obrigatório.
-- Resultado esperado: operação barrada.
-- Mensagem de erro:
-- ERROR:  null value in column "nome" of relation "perfil" violates not-null constraint
-- ============================================================================
DO $$
BEGIN
    INSERT INTO Perfil (role, nome, email)
    VALUES ('aluno', NULL, 'teste.notnull@nexusclass.edu.br');
    RAISE EXCEPTION '[TESTE 9 FALHOU] A operação que deveria ser barrada foi aceita.';
EXCEPTION WHEN not_null_violation THEN
    RAISE NOTICE '[TESTE 9 BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;

-- ============================================================================
-- TESTE 10: Atividade com turma inexistente (FOREIGN KEY)
-- Regra: RF04 / Seção 3.2: a turma da atividade deve existir.
-- Resultado esperado: operação barrada.
-- Mensagem de erro:
-- ERROR:  insert or update on table "atividade" violates foreign key constraint "fk_atividade_turma"
-- ============================================================================
DO $$
BEGIN
    INSERT INTO Atividade (titulo, descricao, data_entrega, id_turma, id_professor)
    VALUES ('Teste FK', 'Turma inexistente', '2030-12-31 23:59:00-03', -1, 4);
    RAISE EXCEPTION '[TESTE 10 FALHOU] A operação que deveria ser barrada foi aceita.';
EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE '[TESTE 10 BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;

-- ============================================================================
-- TESTE 11: Entrega duplicada (UNIQUE)
-- Regra: RF05 / Seções 3.2 e 3.3: uma entrega por aluno e atividade.
-- Resultado esperado: operação barrada.
-- Mensagem de erro:
-- ERROR:  duplicate key value violates unique constraint "uq_entrega_atividade_aluno"
-- ============================================================================
DO $$
BEGIN
    INSERT INTO Entrega_Atividade (entrega_url, id_atividade, id_aluno)
    VALUES ('https://nexusclass.edu.br/entregas/teste_duplicado.pdf', 1, 8);
    RAISE EXCEPTION '[TESTE 11 FALHOU] A operação que deveria ser barrada foi aceita.';
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '[TESTE 11 BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;


ROLLBACK;
