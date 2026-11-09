-- ============================================================================
-- DCC060 - Banco de Dados (2026.3) - Grupo 24: Sistema NexusClass
-- Arquivo: 02_carga.sql
-- Descrição: Carga de dados para todas as 18 tabelas do esquema, garantindo
--            resultados não vazios para todas as consultas (E3/E5) e gerando
--            mais de 200.000 linhas em Entrega_Atividade para a Seção 8.
--            Executa ANALYZE ao final para atualização das estatísticas.
-- ============================================================================

SET client_encoding = 'UTF8';

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Carga em Escola
-- ----------------------------------------------------------------------------
INSERT INTO Escola (id_escola, nome, ano_letivo) VALUES
    (1, 'João XXIII', 2026),
    (2, 'Instituto Tecnológico Nexus', 2026),
    (3, 'Colégio Estadual Minas Gerais', 2026);

SELECT setval(pg_get_serial_sequence('Escola', 'id_escola'), 3, true);

-- ----------------------------------------------------------------------------
-- 2. Carga em Turma (Inclui a turma DCC000 da escola João XXIII)
-- ----------------------------------------------------------------------------
INSERT INTO Turma (id_turma, codigo_acesso, materia, sala, periodo_escolar, banner_url, id_escola) VALUES
    (1, 'DCC000', 'Banco de Dados', 'Sala S301', '2026.3', 'https://nexusclass.edu.br/banners/dcc000.png', 1),
    (2, 'DCC001', 'Estrutura de Dados', 'Sala S302', '2026.3', 'https://nexusclass.edu.br/banners/dcc001.png', 1),
    (3, 'DCC002', 'Engenharia de Software', 'Sala S205', '2026.3', 'https://nexusclass.edu.br/banners/dcc002.png', 2),
    (4, 'MAT101', 'Cálculo Numérico', 'Sala A104', '2026.3', 'https://nexusclass.edu.br/banners/mat101.png', 3);

SELECT setval(pg_get_serial_sequence('Turma', 'id_turma'), 4, true);

-- ----------------------------------------------------------------------------
-- 3. Carga em Perfil (Usuários nominais das consultas + lote de 10.000 alunos)
-- ----------------------------------------------------------------------------
-- IDs 1 a 3: Administradores (Master)
-- IDs 4 a 7: Professores (Pietro, Ana Paula, Carlos Eduardo, Marcos)
-- IDs 8 a 13: Alunos nominais (Alice, Alberto, Olegário, Rebeca, Paulo, Mariana)
INSERT INTO Perfil (id_perfil, role, nome, email, bio, foto_url) VALUES
    (1, 'master', 'Coordenação Geral Nexus', 'master@nexusclass.edu.br', 'Gestão Educacional e Moderação', 'https://nexusclass.edu.br/avatars/m1.png'),
    (2, 'master', 'Helena Administradora', 'helena.master@nexusclass.edu.br', 'Suporte Técnico Nível 2', 'https://nexusclass.edu.br/avatars/m2.png'),
    (3, 'master', 'Roberto Diretor', 'roberto.master@nexusclass.edu.br', 'Diretoria Acadêmica', 'https://nexusclass.edu.br/avatars/m3.png'),
    (4, 'professor', 'Pietro', 'pietro@nexusclass.edu.br', 'Docente de Banco de Dados', 'https://nexusclass.edu.br/avatars/p1.png'),
    (5, 'professor', 'Ana Paula', 'anapaula@nexusclass.edu.br', 'Docente de Engenharia de Software', 'https://nexusclass.edu.br/avatars/p2.png'),
    (6, 'professor', 'Carlos Eduardo', 'carloseduardo@nexusclass.edu.br', 'Docente de Estrutura de Dados', 'https://nexusclass.edu.br/avatars/p3.png'),
    (7, 'professor', 'Marcos Vinícius', 'marcos@nexusclass.edu.br', 'Docente de Cálculo', 'https://nexusclass.edu.br/avatars/p4.png'),
    (8, 'aluno', 'Alice', 'alice@aluno.nexusclass.edu.br', 'Estudante de Sistemas de Informação', 'https://nexusclass.edu.br/avatars/a1.png'),
    (9, 'aluno', 'Alberto', 'alberto@aluno.nexusclass.edu.br', 'Estudante de Ciência da Computação', 'https://nexusclass.edu.br/avatars/a2.png'),
    (10, 'aluno', 'Olegário', 'olegario@aluno.nexusclass.edu.br', 'Monitor Acadêmico', 'https://nexusclass.edu.br/avatars/a3.png'),
    (11, 'aluno', 'Rebeca', 'rebeca@aluno.nexusclass.edu.br', 'Representante de Turma', 'https://nexusclass.edu.br/avatars/a4.png'),
    (12, 'aluno', 'Paulo', 'paulo@aluno.nexusclass.edu.br', 'Estudante de Graduação', 'https://nexusclass.edu.br/avatars/a5.png'),
    (13, 'aluno', 'Mariana', 'mariana@aluno.nexusclass.edu.br', 'Bolsista de Iniciação Científica', 'https://nexusclass.edu.br/avatars/a6.png');

-- Geração de mais 10.000 perfis de alunos (IDs 14 a 10013) para sustentar a carga massiva
INSERT INTO Perfil (id_perfil, role, nome, email, bio, foto_url)
SELECT
    g,
    'aluno',
    'Aluno Acadêmico ' || g,
    'aluno' || g || '@aluno.nexusclass.edu.br',
    'Discente matriculado na plataforma NexusClass',
    'https://nexusclass.edu.br/avatars/default.png'
FROM generate_series(14, 10013) AS g;

SELECT setval(pg_get_serial_sequence('Perfil', 'id_perfil'), 10013, true);

-- ----------------------------------------------------------------------------
-- 4. Carga em Professor_Turma
-- ----------------------------------------------------------------------------
INSERT INTO Professor_Turma (id_professor, id_turma) VALUES
    (4, 1), -- Pietro leciona na DCC000 (Escola João XXIII)
    (5, 1), -- Ana Paula também colabora na DCC000
    (6, 2), -- Carlos Eduardo leciona na DCC001 (Escola João XXIII)
    (5, 3), -- Ana Paula leciona na DCC002
    (7, 4); -- Marcos Vinícius leciona na MAT101

-- ----------------------------------------------------------------------------
-- 5. Carga em Aluno_Turma
-- ----------------------------------------------------------------------------
INSERT INTO Aluno_Turma (id_aluno, id_turma, situacao) VALUES
    (8, 1, 'ativa'),      -- Alice ativa na DCC000
    (8, 2, 'ativa'),      -- Alice ativa na DCC001
    (8, 3, 'cancelada'),  -- Alice teve matrícula cancelada na DCC002 (histórico RF02)
    (9, 1, 'ativa'),      -- Alberto ativo na DCC000
    (10, 1, 'ativa'),     -- Olegário ativo na DCC000
    (10, 2, 'ativa'),     -- Olegário ativo na DCC001
    (11, 1, 'ativa'),     -- Rebeca ativa na DCC000
    (12, 1, 'ativa'),     -- Paulo ativo na DCC000
    (13, 1, 'ativa');     -- Mariana ativa na DCC000

-- Matrícula dos alunos 14 a 10013 na Turma 1 (DCC000)
INSERT INTO Aluno_Turma (id_aluno, id_turma, situacao)
SELECT g, 1, CASE WHEN g % 20 = 0 THEN 'cancelada' ELSE 'ativa' END
FROM generate_series(14, 10013) AS g;

-- ----------------------------------------------------------------------------
-- 6. Carga em Atividade (25 atividades: 3 principais na DCC000 + 22 em lote)
-- ----------------------------------------------------------------------------
INSERT INTO Atividade (id_atividade, titulo, descricao, data_entrega, id_turma, id_professor) VALUES
    (1, 'E1 - Requisitos e Regras', 'Levantamento de requisitos funcionais e regras de negócio', '2026-10-01 23:59:00-03', 1, 4),
    (2, 'E2 - Modelagem Conceitual e Lógica', 'Elaboração do DER, Modelo Lógico e Normalização 3FN', '2026-10-20 23:59:00-03', 1, 4),
    (3, 'E3 - Álgebra Relacional', 'Especificação de 10 consultas em Álgebra Relacional', '2026-11-06 23:59:00-03', 1, 5),
    (4, 'Lista 1 - Árvores Binárias', 'Implementação de AVL em C++', '2026-11-15 23:59:00-03', 2, 6),
    (5, 'TP1 - Padrões de Projeto', 'Aplicação de padrões GoF em Java', '2026-11-20 23:59:00-03', 3, 5);

-- Mais 20 atividades (IDs 6 a 25) na turma 2 e 3 para compor as 200.000 entregas sem afetar a divisão da Turma 1
INSERT INTO Atividade (id_atividade, titulo, descricao, data_entrega, id_turma, id_professor)
SELECT
    g,
    'Atividade Avaliativa ' || g,
    'Descrição detalhada do exercício prático número ' || g,
    TIMESTAMP WITH TIME ZONE '2026-11-01 23:59:00-03' + (g || ' days')::INTERVAL,
    CASE WHEN g % 2 = 0 THEN 2 ELSE 3 END,
    CASE WHEN g % 2 = 0 THEN 6 ELSE 5 END
FROM generate_series(6, 25) AS g;

SELECT setval(pg_get_serial_sequence('Atividade', 'id_atividade'), 25, true);

-- ----------------------------------------------------------------------------
-- 7. Carga em Atividade_Anexo
-- ----------------------------------------------------------------------------
INSERT INTO Atividade_Anexo (url, id_atividade) VALUES
    ('https://nexusclass.edu.br/storage/atividades/modelo_trabalho_v3.pdf', 1),
    ('https://nexusclass.edu.br/storage/atividades/guia_normalizacao.pdf', 2),
    ('https://nexusclass.edu.br/storage/atividades/operadores_ar.pdf', 3),
    ('https://nexusclass.edu.br/storage/atividades/casos_teste_avl.zip', 4);

-- ----------------------------------------------------------------------------
-- 8. Carga em Entrega_Atividade (Casos específicos + 200.000 linhas via script)
-- ----------------------------------------------------------------------------
-- Alice (id=8) e Mariana (id=13) entregam TODAS as atividades do prof. Pietro (id=4) na DCC000 (Atividades 1 e 2) -> Consulta 3 (Divisão)
-- Alberto (id=9) entrega apenas a Atividade 1 na DCC000, faltando as Atividades 2 e 3 -> Consulta 4 (Diferença)
INSERT INTO Entrega_Atividade (entrega_url, nota, feedback, entregue_em, id_atividade, id_aluno) VALUES
    ('https://nexusclass.edu.br/entregas/alice_e1.pdf', 95.00, 'Excelente levantamento de requisitos.', '2026-09-29 18:00:00-03', 1, 8),
    ('https://nexusclass.edu.br/entregas/alice_e2.zip', 92.50, 'DER e normalização muito bem fundamentados.', '2026-10-18 20:30:00-03', 2, 8),
    ('https://nexusclass.edu.br/entregas/mariana_e1.pdf', 100.00, 'Trabalho completo e sem ressalvas.', '2026-09-28 14:15:00-03', 1, 13),
    ('https://nexusclass.edu.br/entregas/mariana_e2.zip', 88.00, 'Bom modelo lógico e ótima justificativa 3FN.', '2026-10-19 21:00:00-03', 2, 13),
    ('https://nexusclass.edu.br/entregas/alberto_e1.pdf', 55.00, 'Faltou detalhar as regras de negócio de alertas e anexar o apêndice obrigatório.', '2026-09-30 22:10:00-03', 1, 9),
    ('https://nexusclass.edu.br/entregas/olegario_e1.pdf', 85.00, 'Requisitos claros e bem organizados.', '2026-09-30 19:00:00-03', 1, 10);

-- Carga massiva: 200.000 linhas geradas cruzando 10.000 alunos (IDs 14 a 10013) com 20 atividades (IDs 6 a 25)
INSERT INTO Entrega_Atividade (entrega_url, nota, feedback, entregue_em, id_atividade, id_aluno)
SELECT
    'https://nexusclass.edu.br/entregas/lote/aluno_' || a.id_aluno || '_ativ_' || atv.id_atividade || '.pdf',
    ROUND((( (a.id_aluno + atv.id_atividade) % 41 ) + 60)::NUMERIC, 2),
    'Avaliação processada com feedback pedagógico regular para a entrega.',
    TIMESTAMP WITH TIME ZONE '2026-10-15 10:00:00-03' + ((a.id_aluno % 30) || ' days')::INTERVAL + ((atv.id_atividade % 12) || ' hours')::INTERVAL,
    atv.id_atividade,
    a.id_aluno
FROM generate_series(14, 10013) AS a(id_aluno)
CROSS JOIN generate_series(6, 25) AS atv(id_atividade);

-- ----------------------------------------------------------------------------
-- 9. Carga em Duvida (Com dúvidas respondidas e dúvidas sem resposta para Left Join)
-- ----------------------------------------------------------------------------
INSERT INTO Duvida (id_duvida, assunto, descricao, resolveu, resposta, id_aluno, id_turma, id_professor) VALUES
    (1, 'Notação da Divisão na E3', 'Como representar o dividendo e o divisor na consulta 3?', TRUE, 'Mantenha o par (id_aluno, id_atividade) no dividendo.', 8, 1, 4),
    (2, 'Dúvida sobre BCNF vs 3FN', 'Precisamos decompor relações que já estão em 3FN?', TRUE, 'Apenas demonstre as dependências funcionais na tabela.', 10, 1, 4),
    (3, 'Prazo de envio do script SQL', 'O arquivo 02_carga.sql deve conter exatamente 200 mil linhas?', FALSE, NULL, 9, 1, NULL),
    (4, 'Uso de ponteiros em AVL', 'A rotação dupla está gerando falha de segmentação.', FALSE, NULL, 8, 2, NULL);

SELECT setval(pg_get_serial_sequence('Duvida', 'id_duvida'), 4, true);

-- ----------------------------------------------------------------------------
-- 10. Carga em Duvida_Anexo (Garante retorno para a Consulta 7 - Interseção)
-- ----------------------------------------------------------------------------
INSERT INTO Duvida_Anexo (url, id_duvida) VALUES
    ('https://nexusclass.edu.br/storage/duvidas/print_expressao_divisao.png', 1),
    ('https://nexusclass.edu.br/storage/duvidas/rascunho_df.pdf', 2),
    ('https://nexusclass.edu.br/storage/duvidas/log_segfault.txt', 4);

-- ----------------------------------------------------------------------------
-- 11. Carga em Mural_Post
-- ----------------------------------------------------------------------------
INSERT INTO Mural_Post (id_post, conteudo, id_turma, id_autor) VALUES
    (1, 'Bem-vindos à disciplina DCC000 - Banco de Dados! O cronograma de entregas já está disponível.', 1, 4),
    (2, 'Lembrete: A entrega da Etapa E4 encerra no dia 15/11 às 23:59.', 1, 5),
    (3, 'Pessoal, criamos um grupo de estudos para revisar Álgebra Relacional hoje às 19h.', 1, 8),
    (4, 'Material sobre Árvores B+ publicado nos anexos da turma.', 2, 6);

SELECT setval(pg_get_serial_sequence('Mural_Post', 'id_post'), 4, true);

-- ----------------------------------------------------------------------------
-- 12. Carga em Comentario_Mural
-- ----------------------------------------------------------------------------
INSERT INTO Comentario_Mural (conteudo, id_post, id_autor) VALUES
    ('Obrigado pelo aviso, professor Pietro!', 1, 8),
    ('Já estamos finalizando os scripts de carga e verificação.', 2, 10),
    ('Eu vou participar do grupo de estudos!', 3, 9),
    ('Excelente material de apoio.', 4, 8);

-- ----------------------------------------------------------------------------
-- 13. Carga em Evento_Calendario (Inclui eventos em 31/12/2030 para Consulta 5)
-- ----------------------------------------------------------------------------
INSERT INTO Evento_Calendario (id_evento, titulo, descricao, data, horario, tipo, id_autor, id_turma) VALUES
    (1, 'Apresentação Final do TP de Banco de Dados', 'Defesa presencial do protótipo e arguição', '2030-12-31', '14:00:00', 'turma', 4, 1),
    (2, 'Fechamento de Notas do Semestre', 'Consolidação das avaliações no sistema', '2030-12-31', '18:00:00', 'turma', 6, 2),
    (3, 'Revisão Individual de Conteúdo', 'Estudo particular de indexação e planos de consulta', '2030-12-31', '09:00:00', 'pessoal', 10, NULL),
    (4, 'Entrega da Etapa E4', 'Submissão dos scripts SQL no Classroom', '2026-11-15', '23:59:00', 'turma', 4, 1);

SELECT setval(pg_get_serial_sequence('Evento_Calendario', 'id_evento'), 4, true);

-- ----------------------------------------------------------------------------
-- 14. Carga em Alerta_Calendario
-- ----------------------------------------------------------------------------
INSERT INTO Alerta_Calendario (mensagem, minutos_antes, lembrete_para, id_evento) VALUES
    ('Lembrete (5 min): Apresentação Final do TP de Banco de Dados', 5, '2030-12-31 13:55:00-03', 1),
    ('Lembrete (1 min): Apresentação Final do TP de Banco de Dados', 1, '2030-12-31 13:59:00-03', 1),
    ('Lembrete (5 min): Fechamento de Notas do Semestre', 5, '2030-12-31 17:55:00-03', 2),
    ('Lembrete (5 min): Entrega da Etapa E4', 5, '2026-11-15 23:54:00-03', 4);

-- ----------------------------------------------------------------------------
-- 15. Carga em Mensagem (Inclui mensagens não lidas para Paulo - id=12)
-- ----------------------------------------------------------------------------
INSERT INTO Mensagem (conteudo, lida, id_remetente, id_destinatario) VALUES
    ('Olá Paulo, você pode revisar a parte de normalização do relatório?', FALSE, 8, 12),
    ('Paulo, enviei as observações sobre a sua entrega no portal.', FALSE, 4, 12),
    ('Combinado, Alice! Já revisei o documento.', TRUE, 12, 8),
    ('Professor Pietro, confirmei minha presença na apresentação.', TRUE, 10, 4);

-- ----------------------------------------------------------------------------
-- 16. Carga em Denuncia (Inclui denúncia de Rebeca e contra professor da turma)
-- ----------------------------------------------------------------------------
INSERT INTO Denuncia (id_denuncia, motivo, descricao, status, parecer_moderacao, id_autor, id_denunciado, id_master) VALUES
    (1, 'Atraso na divulgação de critérios', 'Os critérios detalhados da atividade demoraram a ser postados no mural.', 'em_analise', 'A coordenação solicitou esclarecimentos ao docente responsável.', 11, 4, 1),
    (2, 'Spam no fórum da disciplina', 'Publicação repetitiva de links externos nos comentários do mural.', 'resolvido', 'Comentários removidos e usuário orientado pela moderação.', 8, 9, 2),
    (3, 'Linguagem inadequada em mensagem', 'Relato de conduta imprópria no chat privado.', 'pendente', NULL, 11, 12, NULL);

SELECT setval(pg_get_serial_sequence('Denuncia', 'id_denuncia'), 3, true);

-- ----------------------------------------------------------------------------
-- 17. Carga em Ticket_Suporte (Inclui chamados abertos por Rebeca - id=11)
-- ----------------------------------------------------------------------------
INSERT INTO Ticket_Suporte (id_suporte, assunto, mensagem, status, resposta_suporte, id_perfil, id_master) VALUES
    (1, 'Erro ao anexar arquivo PDF', 'O sistema retornou timeout ao tentar subir um PDF de 12MB na atividade.', 'resolvido', 'Limite do bucket ajustado para 25MB pela equipe técnica.', 11, 2),
    (2, 'Atualização de e-mail institucional', 'Solicito apoio para sincronização do meu endereço de e-mail acadêmico.', 'em_analise', 'Em verificação junto ao diretório de autenticação.', 11, 1),
    (3, 'Dificuldade na visualização do calendário', 'Os eventos do mês seguinte não carregam no navegador mobile.', 'pendente', NULL, 8, NULL);

SELECT setval(pg_get_serial_sequence('Ticket_Suporte', 'id_suporte'), 3, true);

-- ----------------------------------------------------------------------------
-- 18. Carga em Ticket_Suporte_Anexo
-- ----------------------------------------------------------------------------
INSERT INTO Ticket_Suporte_Anexo (url, id_suporte) VALUES
    ('https://nexusclass.edu.br/storage/suporte/print_timeout_upload.png', 1),
    ('https://nexusclass.edu.br/storage/suporte/comprovante_matricula.pdf', 2),
    ('https://nexusclass.edu.br/storage/suporte/erro_calendario_mobile.jpg', 3);

COMMIT;

-- ============================================================================
-- Atualização das estatísticas do catálogo para o otimizador de consultas
-- ============================================================================
ANALYZE;