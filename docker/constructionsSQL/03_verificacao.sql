-- ============================================================================
-- DCC060 - Banco de Dados (2026.3) - Grupo 24: Sistema NexusClass
-- Arquivo: 03_verificacao.sql
-- Descrição: Comandos de inserção, alteração e exclusão que demonstram o
--            comportamento correto dos controles de integridade do DDL.
--            Cada teste indica a regra da Seção 2 verificada, o resultado
--            esperado e a mensagem de erro oficial devolvida pelo PostgreSQL.
-- ============================================================================

SET client_encoding = 'UTF8';

-- ============================================================================
-- TESTE 1: Verificação da Regra RN01 / Domínio de Nota (CHECK constraint)
-- Regra da Seção 2: RN01 / Restrição de Domínio (Seção 3.2 - Item 1) - A nota
--                   atribuída em Entrega_Atividade deve estar entre 0 e 100.
-- Operação testada: UPDATE tentando atribuir nota = 150.00 a uma entrega.
-- Resultado esperado: Operação BARRADA pelo SGBD por violação de CHECK.
-- Mensagem de erro devolvida pelo SGBD:
-- ERROR:  new row for relation "entrega_atividade" violates check constraint "ck_entrega_nota_intervalo"
-- DETAIL:  Failing row contains (1, https://nexusclass.edu.br/entregas/alice_e1.pdf, 150.00, Excelente levantamento de requisitos., 2026-09-29 18:00:00-03, 1, 8).
-- ============================================================================
DO $$
BEGIN
    UPDATE Entrega_Atividade
    SET nota = 150.00
    WHERE id_entrega = 1;
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE '[TESTE 1 - RN01 BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 2: Verificação da Regra RN02 / Domínio de Escopo de Evento (CHECK)
-- Regra da Seção 2: RN02 / Restrição de Domínio (Seção 3.2 - Item 1) - O tipo
--                   de um Evento_Calendario só pode ser 'pessoal' ou 'turma'.
-- Operação testada: INSERT de evento com tipo = 'publico_externo'.
-- Resultado esperado: Operação BARRADA pelo SGBD por violação de CHECK.
-- Mensagem de erro devolvida pelo SGBD:
-- ERROR:  new row for relation "evento_calendario" violates check constraint "ck_evento_tipo"
-- DETAIL:  Failing row contains (5, Palestra Aberta, Evento inválido, 2026-12-01, 10:00:00, publico_externo, 4, 1).
-- ============================================================================
DO $$
BEGIN
    INSERT INTO Evento_Calendario (titulo, descricao, data, horario, tipo, id_autor, id_turma)
    VALUES ('Palestra Aberta', 'Evento inválido', '2026-12-01', '10:00:00', 'publico_externo', 4, 1);
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE '[TESTE 2 - RN02 BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 3: Verificação da Regra RN03 - Unicidade de Matrícula (PRIMARY KEY)
-- Regra da Seção 2: RN03 (Seção 3.2 - Item 5) - Um aluno não pode possuir mais
--                   de um vínculo de matrícula para a mesma turma (PK composta
--                   id_aluno, id_turma) e situacao restrita a ('ativa', 'cancelada').
-- Operação testada: INSERT duplicado da aluna Alice (id_aluno = 8) na turma
--                   DCC000 (id_turma = 1), na qual ela já está matriculada.
-- Resultado esperado: Operação BARRADA pelo SGBD por violação de chave primária.
-- Mensagem de erro devolvida pelo SGBD:
-- ERROR:  duplicate key value violates unique constraint "pk_aluno_turma"
-- DETAIL:  Key (id_aluno, id_turma)=(8, 1) already exists.
-- ============================================================================
DO $$
BEGIN
    INSERT INTO Aluno_Turma (id_aluno, id_turma, situacao)
    VALUES (8, 1, 'ativa');
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '[TESTE 3 - RN03 BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 4: Verificação da Regra RN03 / RF02 - Domínio de Situação de Matrícula
-- Regra da Seção 2: RF02 e RN03 (Seção 3.2 - Item 1) - A coluna situacao em
--                   Aluno_Turma aceita exclusivamente 'ativa' ou 'cancelada'.
-- Operação testada: UPDATE tentando alterar a situação da matrícula para 'trancada'.
-- Resultado esperado: Operação BARRADA pelo SGBD por violação de CHECK.
-- Mensagem de erro devolvida pelo SGBD:
-- ERROR:  new row for relation "aluno_turma" violates check constraint "ck_aluno_turma_situacao"
-- DETAIL:  Failing row contains (8, 1, trancada, ...).
-- ============================================================================
DO $$
BEGIN
    UPDATE Aluno_Turma
    SET situacao = 'trancada'
    WHERE id_aluno = 8 AND id_turma = 1;
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE '[TESTE 4 - RF02/RN03 BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 5: Verificação de Restrição de Domínio de Antecedência de Alerta (CHECK)
-- Regra da Seção 2: RN02 / Restrição de Domínio (Seção 3.2 - Item 1) - A coluna
--                   minutos_antes em Alerta_Calendario aceita apenas 1 ou 5.
-- Operação testada: INSERT de um alerta com minutos_antes = 15.
-- Resultado esperado: Operação BARRADA pelo SGBD por violação de CHECK.
-- Mensagem de erro devolvida pelo SGBD:
-- ERROR:  new row for relation "alerta_calendario" violates check constraint "ck_alerta_minutos_antes"
-- DETAIL:  Failing row contains (5, Alerta fora do padrão, 15, 2030-12-31 13:45:00-03, 1).
-- ============================================================================
DO $$
BEGIN
    INSERT INTO Alerta_Calendario (mensagem, minutos_antes, lembrete_para, id_evento)
    VALUES ('Alerta fora do padrão', 15, '2030-12-31 13:45:00-03', 1);
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE '[TESTE 5 - DOMÍNIO ALERTA BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 6: Verificação da Regra RN05 - Prevenção de Alertas Duplicados (UNIQUE)
-- Regra da Seção 2: RN05 (Seção 3.2 - Item 6) - Um mesmo evento do calendário
--                   não pode possuir múltiplos alertas cadastrados com o exato
--                   mesmo tempo de antecedência e horário de lembrete.
-- Operação testada: INSERT de alerta repetindo (id_evento = 1, minutos_antes = 5,
--                   lembrete_para = '2030-12-31 13:55:00-03').
-- Resultado esperado: Operação BARRADA pelo SGBD por violação de UNIQUE.
-- Mensagem de erro devolvida pelo SGBD:
-- ERROR:  duplicate key value violates unique constraint "uq_alerta_evento_tempo_dest"
-- DETAIL:  Key (id_evento, minutos_antes, lembrete_para)=(1, 5, 2030-12-31 13:55:00-03) already exists.
-- ============================================================================
DO $$
BEGIN
    INSERT INTO Alerta_Calendario (mensagem, minutos_antes, lembrete_para, id_evento)
    VALUES ('Disparo duplicado de 5 min', 5, '2030-12-31 13:55:00-03', 1);
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE '[TESTE 6 - RN05 BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;


-- ============================================================================
-- TESTE 7: Verificação da Regra RN06 - Exclusão em Cascata de Alertas (DELETE)
-- Regra da Seção 2: RN06 (Seção 3.2 - Item 7) - Os alertas temporais devem estar
--                   vinculados a um evento e devem ser removidos em cascata
--                   (ON DELETE CASCADE) caso o evento de origem seja excluído.
-- Operação testada: Criação de um evento temporário com 2 alertas vinculados,
--                   seguida do DELETE do evento pai e verificação da remoção
--                   automática dos alertas filhos.
-- Resultado esperado: Operação ACEITA e exclusão automática dos 2 alertas.
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

    -- Exclusão do evento pai (deve acionar ON DELETE CASCADE nos alertas filhos)
    DELETE FROM Evento_Calendario WHERE id_evento = v_id_evento;

    SELECT COUNT(*) INTO v_qtd_depois FROM Alerta_Calendario WHERE id_evento = v_id_evento;

    RAISE NOTICE '[TESTE 7 - RN06 CASCADE EXECUTADO COM SUCESSO] Alertas antes do DELETE: % | Alertas após DELETE do Evento: %', v_qtd_antes, v_qtd_depois;
END $$;


-- ============================================================================
-- TESTE 8: Verificação de Integridade Referencial (FOREIGN KEY e ON DELETE RESTRICT)
-- Regra da Seção 2: Restrições Estruturais do Modelo Lógico (Seção 3.2) - Uma
--                   Escola que possui Turmas vinculadas não pode ser excluída
--                   (ON DELETE RESTRICT), e uma Atividade não pode referenciar
--                   uma Turma inexistente.
-- Operação testada: DELETE da Escola 'João XXIII' (id_escola = 1), que possui
--                   turmas cadastradas.
-- Resultado esperado: Operação BARRADA pelo SGBD por violação de chave estrangeira.
-- Mensagem de erro devolvida pelo SGBD:
-- ERROR:  update or delete on table "escola" violates foreign key constraint "fk_turma_escola" on table "turma"
-- DETAIL:  Key (id_escola)=(1) is still referenced from table "turma".
-- ============================================================================
DO $$
BEGIN
    DELETE FROM Escola WHERE id_escola = 1;
EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE '[TESTE 8 - FK ON DELETE RESTRICT BARRADO COM SUCESSO] SQLSTATE %: %', SQLSTATE, SQLERRM;
END $$;