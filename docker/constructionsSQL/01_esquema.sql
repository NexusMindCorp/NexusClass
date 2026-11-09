-- ============================================================================
-- DCC060 - Banco de Dados (2026.3) - Grupo 24: Sistema NexusClass
-- Arquivo: 01_esquema.sql
-- Descrição: Criação das 18 tabelas do esquema lógico com todas as restrições
--            de integridade (PK, FK com ação referencial, NOT NULL, UNIQUE, CHECK).
-- Compatibilidade: PostgreSQL 14 ou superior (executa do zero em banco vazio).
-- ============================================================================
SET
    client_encoding = 'UTF8';

-- Limpeza preventiva para garantir execução limpa a partir de qualquer estado
DROP TABLE IF EXISTS Ticket_Suporte_Anexo CASCADE;

DROP TABLE IF EXISTS Ticket_Suporte CASCADE;

DROP TABLE IF EXISTS Denuncia CASCADE;

DROP TABLE IF EXISTS Mensagem CASCADE;

DROP TABLE IF EXISTS Alerta_Calendario CASCADE;

DROP TABLE IF EXISTS Evento_Calendario CASCADE;

DROP TABLE IF EXISTS Comentario_Mural CASCADE;

DROP TABLE IF EXISTS Mural_Post CASCADE;

DROP TABLE IF EXISTS Duvida_Anexo CASCADE;

DROP TABLE IF EXISTS Duvida CASCADE;

DROP TABLE IF EXISTS Entrega_Atividade CASCADE;

DROP TABLE IF EXISTS Atividade_Anexo CASCADE;

DROP TABLE IF EXISTS Atividade CASCADE;

DROP TABLE IF EXISTS Aluno_Turma CASCADE;

DROP TABLE IF EXISTS Professor_Turma CASCADE;

DROP TABLE IF EXISTS Perfil CASCADE;

DROP TABLE IF EXISTS Turma CASCADE;

DROP TABLE IF EXISTS Escola CASCADE;

-- ----------------------------------------------------------------------------
-- 1. Tabela: Escola
-- ----------------------------------------------------------------------------
CREATE TABLE
    Escola (
        id_escola SERIAL,
        nome VARCHAR(150) NOT NULL,
        ano_letivo INTEGER NOT NULL,
        created_at TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT pk_escola PRIMARY KEY (id_escola),
            CONSTRAINT ck_escola_ano_letivo CHECK (
                ano_letivo >= 2000
                AND ano_letivo <= 2100
            )
    );

-- ----------------------------------------------------------------------------
-- 2. Tabela: Turma
-- ----------------------------------------------------------------------------
CREATE TABLE
    Turma (
        id_turma SERIAL,
        codigo_acesso VARCHAR(30) NOT NULL,
        materia VARCHAR(120) NOT NULL,
        sala VARCHAR(50) NOT NULL,
        periodo_escolar VARCHAR(50) NOT NULL,
        banner_url TEXT,
        id_escola INTEGER NOT NULL,
        CONSTRAINT pk_turma PRIMARY KEY (id_turma),
        CONSTRAINT uq_turma_codigo_acesso UNIQUE (codigo_acesso),
        CONSTRAINT fk_turma_escola FOREIGN KEY (id_escola) REFERENCES Escola (id_escola) ON UPDATE CASCADE ON DELETE RESTRICT
    );

-- ----------------------------------------------------------------------------
-- 3. Tabela: Perfil (Generalização: Aluno, Professor, Master via Tabela Única)
-- ----------------------------------------------------------------------------
CREATE TABLE
    Perfil (
        id_perfil SERIAL,
        role VARCHAR(20) NOT NULL DEFAULT 'aluno',
        nome VARCHAR(150) NOT NULL,
        email VARCHAR(180) NOT NULL,
        bio TEXT,
        foto_url TEXT,
        created_at TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT pk_perfil PRIMARY KEY (id_perfil),
            CONSTRAINT uq_perfil_email UNIQUE (email),
            CONSTRAINT ck_perfil_role CHECK (role IN ('aluno', 'professor', 'master'))
    );

-- ----------------------------------------------------------------------------
-- 4. Tabela: Professor_Turma (Relacionamento N:M Leciona)
-- ----------------------------------------------------------------------------
CREATE TABLE
    Professor_Turma (
        id_professor INTEGER NOT NULL,
        id_turma INTEGER NOT NULL,
        created_at TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT pk_professor_turma PRIMARY KEY (id_professor, id_turma),
            CONSTRAINT fk_prof_turma_professor FOREIGN KEY (id_professor) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_prof_turma_turma FOREIGN KEY (id_turma) REFERENCES Turma (id_turma) ON UPDATE CASCADE ON DELETE CASCADE
    );

-- ----------------------------------------------------------------------------
-- 5. Tabela: Aluno_Turma (Relacionamento N:M Matricula-se - RN03 e RF02)
-- ----------------------------------------------------------------------------
CREATE TABLE
    Aluno_Turma (
        id_aluno INTEGER NOT NULL,
        id_turma INTEGER NOT NULL,
        situacao VARCHAR(20) NOT NULL DEFAULT 'ativa',
        created_at TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT pk_aluno_turma PRIMARY KEY (id_aluno, id_turma),
            CONSTRAINT ck_aluno_turma_situacao CHECK (situacao IN ('ativa', 'cancelada')),
            CONSTRAINT fk_aluno_turma_aluno FOREIGN KEY (id_aluno) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_aluno_turma_turma FOREIGN KEY (id_turma) REFERENCES Turma (id_turma) ON UPDATE CASCADE ON DELETE CASCADE
    );

-- ----------------------------------------------------------------------------
-- 6. Tabela: Atividade
-- ----------------------------------------------------------------------------
CREATE TABLE
    Atividade (
        id_atividade SERIAL,
        titulo VARCHAR(150) NOT NULL,
        descricao TEXT NOT NULL,
        data_entrega TIMESTAMP
        WITH
            TIME ZONE NOT NULL,
            id_turma INTEGER NOT NULL,
            id_professor INTEGER NOT NULL,
            CONSTRAINT pk_atividade PRIMARY KEY (id_atividade),
            CONSTRAINT fk_atividade_turma FOREIGN KEY (id_turma) REFERENCES Turma (id_turma) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_atividade_professor FOREIGN KEY (id_professor) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE RESTRICT
    );

-- ----------------------------------------------------------------------------
-- 7. Tabela: Atividade_Anexo (1FN - Decomposição de anexos_urls)
-- ----------------------------------------------------------------------------
CREATE TABLE
    Atividade_Anexo (
        id_anexo SERIAL,
        url TEXT NOT NULL,
        id_atividade INTEGER NOT NULL,
        CONSTRAINT pk_atividade_anexo PRIMARY KEY (id_anexo),
        CONSTRAINT fk_ativ_anexo_atividade FOREIGN KEY (id_atividade) REFERENCES Atividade (id_atividade) ON UPDATE CASCADE ON DELETE CASCADE
    );

-- ----------------------------------------------------------------------------
-- 8. Tabela: Entrega_Atividade (Domínio de nota 0 a 100 e RN01)
-- ----------------------------------------------------------------------------
CREATE TABLE
    Entrega_Atividade (
        id_entrega SERIAL,
        entrega_url TEXT NOT NULL,
        nota NUMERIC(5, 2),
        feedback TEXT,
        entregue_em TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            id_atividade INTEGER NOT NULL,
            id_aluno INTEGER NOT NULL,
            CONSTRAINT pk_entrega_atividade PRIMARY KEY (id_entrega),
            CONSTRAINT uq_entrega_atividade_aluno UNIQUE (id_atividade, id_aluno),
            CONSTRAINT ck_entrega_nota_intervalo CHECK (
                nota IS NULL
                OR (
                    nota >= 0
                    AND nota <= 100
                )
            ),
            CONSTRAINT fk_entrega_atividade FOREIGN KEY (id_atividade) REFERENCES Atividade (id_atividade) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_entrega_aluno FOREIGN KEY (id_aluno) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE
    );

-- ----------------------------------------------------------------------------
-- 9. Tabela: Duvida
-- ----------------------------------------------------------------------------
CREATE TABLE
    Duvida (
        id_duvida SERIAL,
        assunto VARCHAR(150) NOT NULL,
        descricao TEXT NOT NULL,
        resolveu BOOLEAN NOT NULL DEFAULT FALSE,
        resposta TEXT,
        created_at TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            id_aluno INTEGER NOT NULL,
            id_turma INTEGER NOT NULL,
            id_professor INTEGER,
            CONSTRAINT pk_duvida PRIMARY KEY (id_duvida),
            CONSTRAINT fk_duvida_aluno FOREIGN KEY (id_aluno) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_duvida_turma FOREIGN KEY (id_turma) REFERENCES Turma (id_turma) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_duvida_professor FOREIGN KEY (id_professor) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE SET NULL
    );

-- ----------------------------------------------------------------------------
-- 10. Tabela: Duvida_Anexo (1FN - Decomposição de anexos_urls)
-- ----------------------------------------------------------------------------
CREATE TABLE
    Duvida_Anexo (
        id_anexo SERIAL,
        url TEXT NOT NULL,
        id_duvida INTEGER NOT NULL,
        CONSTRAINT pk_duvida_anexo PRIMARY KEY (id_anexo),
        CONSTRAINT fk_duvida_anexo_duvida FOREIGN KEY (id_duvida) REFERENCES Duvida (id_duvida) ON UPDATE CASCADE ON DELETE CASCADE
    );

-- ----------------------------------------------------------------------------
-- 11. Tabela: Mural_Post
-- ----------------------------------------------------------------------------
CREATE TABLE
    Mural_Post (
        id_post SERIAL,
        conteudo TEXT NOT NULL,
        created_at TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            id_turma INTEGER NOT NULL,
            id_autor INTEGER NOT NULL,
            CONSTRAINT pk_mural_post PRIMARY KEY (id_post),
            CONSTRAINT fk_mural_post_turma FOREIGN KEY (id_turma) REFERENCES Turma (id_turma) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_mural_post_autor FOREIGN KEY (id_autor) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE
    );

-- ----------------------------------------------------------------------------
-- 12. Tabela: Comentario_Mural
-- ----------------------------------------------------------------------------
CREATE TABLE
    Comentario_Mural (
        id_comentario SERIAL,
        conteudo TEXT NOT NULL,
        created_at TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            id_post INTEGER NOT NULL,
            id_autor INTEGER NOT NULL,
            CONSTRAINT pk_comentario_mural PRIMARY KEY (id_comentario),
            CONSTRAINT fk_comentario_post FOREIGN KEY (id_post) REFERENCES Mural_Post (id_post) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_comentario_autor FOREIGN KEY (id_autor) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE
    );

-- ----------------------------------------------------------------------------
-- 13. Tabela: Evento_Calendario
-- ----------------------------------------------------------------------------
CREATE TABLE
    Evento_Calendario (
        id_evento SERIAL,
        titulo VARCHAR(150) NOT NULL,
        descricao TEXT NOT NULL DEFAULT '',
        data DATE NOT NULL,
        horario TIME WITHOUT TIME ZONE NOT NULL,
        tipo VARCHAR(20) NOT NULL DEFAULT 'pessoal',
        id_autor INTEGER NOT NULL,
        id_turma INTEGER,
        CONSTRAINT pk_evento_calendario PRIMARY KEY (id_evento),
        CONSTRAINT ck_evento_tipo CHECK (tipo IN ('pessoal', 'turma')),
        CONSTRAINT ck_evento_turma_obrigatoria CHECK (
            (
                tipo = 'pessoal'
                AND id_turma IS NULL
            )
            OR (
                tipo = 'turma'
                AND id_turma IS NOT NULL
            )
        ),
        CONSTRAINT fk_evento_autor FOREIGN KEY (id_autor) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_evento_turma FOREIGN KEY (id_turma) REFERENCES Turma (id_turma) ON UPDATE CASCADE ON DELETE CASCADE
    );

-- ----------------------------------------------------------------------------
-- 14. Tabela: Alerta_Calendario (RN05 e RN06 - ON DELETE CASCADE)
-- ----------------------------------------------------------------------------
CREATE TABLE
    Alerta_Calendario (
        id_alerta SERIAL,
        mensagem TEXT NOT NULL,
        minutos_antes INTEGER NOT NULL,
        lembrete_para TIMESTAMP
        WITH
            TIME ZONE NOT NULL,
            id_evento INTEGER NOT NULL,
            CONSTRAINT pk_alerta_calendario PRIMARY KEY (id_alerta),
            CONSTRAINT ck_alerta_minutos_antes CHECK (minutos_antes IN (1, 5)),
            CONSTRAINT uq_alerta_evento_tempo_dest UNIQUE (id_evento, minutos_antes, lembrete_para),
            CONSTRAINT fk_alerta_evento FOREIGN KEY (id_evento) REFERENCES Evento_Calendario (id_evento) ON UPDATE CASCADE ON DELETE CASCADE
    );

-- ----------------------------------------------------------------------------
-- 15. Tabela: Mensagem
-- ----------------------------------------------------------------------------
CREATE TABLE
    Mensagem (
        id_mensagem SERIAL,
        conteudo TEXT NOT NULL,
        lida BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            id_remetente INTEGER NOT NULL,
            id_destinatario INTEGER NOT NULL,
            CONSTRAINT pk_mensagem PRIMARY KEY (id_mensagem),
            CONSTRAINT ck_mensagem_autoria_distinta CHECK (id_remetente <> id_destinatario),
            CONSTRAINT fk_mensagem_remetente FOREIGN KEY (id_remetente) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_mensagem_destinatario FOREIGN KEY (id_destinatario) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE
    );

-- ----------------------------------------------------------------------------
-- 16. Tabela: Denuncia
-- ----------------------------------------------------------------------------
CREATE TABLE
    Denuncia (
        id_denuncia SERIAL,
        motivo VARCHAR(150) NOT NULL,
        descricao TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pendente',
        parecer_moderacao TEXT,
        created_at TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            id_autor INTEGER NOT NULL,
            id_denunciado INTEGER NOT NULL,
            id_master INTEGER,
            CONSTRAINT pk_denuncia PRIMARY KEY (id_denuncia),
            CONSTRAINT ck_denuncia_status CHECK (status IN ('pendente', 'em_analise', 'resolvido')),
            CONSTRAINT ck_denuncia_partes_distintas CHECK (id_autor <> id_denunciado),
            CONSTRAINT fk_denuncia_autor FOREIGN KEY (id_autor) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_denuncia_denunciado FOREIGN KEY (id_denunciado) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_denuncia_master FOREIGN KEY (id_master) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE SET NULL
    );

-- ----------------------------------------------------------------------------
-- 17. Tabela: Ticket_Suporte
-- ----------------------------------------------------------------------------
CREATE TABLE
    Ticket_Suporte (
        id_suporte SERIAL,
        assunto VARCHAR(150) NOT NULL,
        mensagem TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pendente',
        resposta_suporte TEXT,
        created_at TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            id_perfil INTEGER NOT NULL,
            id_master INTEGER,
            CONSTRAINT pk_ticket_suporte PRIMARY KEY (id_suporte),
            CONSTRAINT ck_ticket_status CHECK (status IN ('pendente', 'em_analise', 'resolvido')),
            CONSTRAINT fk_ticket_perfil FOREIGN KEY (id_perfil) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_ticket_master FOREIGN KEY (id_master) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE SET NULL
    );

-- ----------------------------------------------------------------------------
-- 18. Tabela: Ticket_Suporte_Anexo (1FN - Decomposição de anexos_urls)
-- ----------------------------------------------------------------------------
CREATE TABLE
    Ticket_Suporte_Anexo (
        id_anexo SERIAL,
        url TEXT NOT NULL,
        id_suporte INTEGER NOT NULL,
        CONSTRAINT pk_ticket_suporte_anexo PRIMARY KEY (id_anexo),
        CONSTRAINT fk_ticket_anexo_suporte FOREIGN KEY (id_suporte) REFERENCES Ticket_Suporte (id_suporte) ON UPDATE CASCADE ON DELETE CASCADE
    );