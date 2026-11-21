SET
    client_encoding = 'UTF8';


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
-- 0. Schema privado e gerador de código público único da Escola (ADR-010 / M15)
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS nexusclass_private;
REVOKE ALL ON SCHEMA nexusclass_private FROM PUBLIC;

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
-- 1. Tabela: Escola
-- ----------------------------------------------------------------------------
CREATE TABLE
    Escola (
        id_escola SERIAL,
        nome VARCHAR(150) NOT NULL,
        ano_letivo INTEGER NOT NULL,
        codigo_publico VARCHAR(16) NOT NULL DEFAULT nexusclass_private.gerar_codigo_publico_escola(),
        created_at TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT pk_escola PRIMARY KEY (id_escola),
            CONSTRAINT uq_escola_codigo_publico UNIQUE (codigo_publico),
            CONSTRAINT ck_escola_codigo_publico_formato CHECK (
                codigo_publico ~ '^[A-Z0-9-]{4,16}$'
            ),
            CONSTRAINT ck_escola_ano_letivo CHECK (
                ano_letivo >= 2000
                AND ano_letivo <= 2100
            )
    );

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

DROP TRIGGER IF EXISTS normalizar_codigo_publico_escola ON Escola;
CREATE TRIGGER normalizar_codigo_publico_escola
    BEFORE INSERT OR UPDATE OF codigo_publico ON Escola
    FOR EACH ROW EXECUTE FUNCTION nexusclass_private.normalizar_codigo_publico_escola();

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
        CONSTRAINT ck_turma_banner_url_http CHECK (
            banner_url IS NULL
            OR banner_url ~ '^https?://[^\s<>"'']+$'
        ),
        CONSTRAINT fk_turma_escola FOREIGN KEY (id_escola) REFERENCES Escola (id_escola) ON UPDATE CASCADE ON DELETE RESTRICT
    );

-- ----------------------------------------------------------------------------
-- 3. Tabela: Perfil (Generalização: Aluno, Professor, Master via Tabela Única)
-- RN11: aluno e professor pertencem a uma escola; master não pertence a nenhuma.
-- ----------------------------------------------------------------------------
CREATE TABLE
    Perfil (
        id_perfil UUID NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'aluno',
        nome VARCHAR(150) NOT NULL,
        email VARCHAR(180) NOT NULL,
        bio TEXT,
        foto_url TEXT,
        created_at TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            id_escola INTEGER,
            CONSTRAINT pk_perfil PRIMARY KEY (id_perfil),
            CONSTRAINT fk_perfil_escola FOREIGN KEY (id_escola) REFERENCES Escola (id_escola) ON UPDATE CASCADE ON DELETE RESTRICT,
            CONSTRAINT fk_perfil_auth_users FOREIGN KEY (id_perfil) REFERENCES auth.users (id) ON DELETE CASCADE,
            CONSTRAINT uq_perfil_email UNIQUE (email),
            CONSTRAINT ck_perfil_role CHECK (role IN ('aluno', 'professor', 'master')),
            CONSTRAINT ck_perfil_escola_por_role CHECK (
                (role = 'master' AND id_escola IS NULL)
                OR (role IN ('aluno', 'professor') AND id_escola IS NOT NULL)
            ),
            CONSTRAINT ck_perfil_foto_url_http CHECK (
                foto_url IS NULL
                OR foto_url ~ '^https?://[^\s<>"'']+$'
            ),
            CONSTRAINT ck_perfil_texto_sem_controle CHECK (
                nome !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
                AND (bio IS NULL OR bio !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]')
            )
    );

-- ----------------------------------------------------------------------------
-- 4. Tabela: Professor_Turma (Relacionamento N:M Leciona)
-- ----------------------------------------------------------------------------
CREATE TABLE
    Professor_Turma (
        id_professor UUID NOT NULL,
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
        id_aluno UUID NOT NULL,
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
            id_professor UUID NOT NULL,
            CONSTRAINT pk_atividade PRIMARY KEY (id_atividade),
            CONSTRAINT ck_atividade_texto_sem_controle CHECK (
                titulo !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
                AND descricao !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
            ),
            CONSTRAINT fk_atividade_turma FOREIGN KEY (id_turma) REFERENCES Turma (id_turma) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_atividade_professor FOREIGN KEY (id_professor) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE RESTRICT
    );

-- ----------------------------------------------------------------------------
-- 7. Tabela: Atividade_Anexo (1FN - Decomposição de anexos_urls)
-- ----------------------------------------------------------------------------
CREATE TABLE
    Atividade_Anexo (
        id_anexo SERIAL,
        id_objeto_storage UUID NOT NULL,
        id_atividade INTEGER NOT NULL,
        CONSTRAINT pk_atividade_anexo PRIMARY KEY (id_anexo),
        CONSTRAINT fk_ativ_anexo_atividade FOREIGN KEY (id_atividade) REFERENCES Atividade (id_atividade) ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_ativ_anexo_storage FOREIGN KEY (id_objeto_storage) REFERENCES storage.objects (id) ON DELETE CASCADE
    );

-- ----------------------------------------------------------------------------
-- 8. Tabela: Entrega_Atividade (Domínio de nota 0 a 100 e RN01)
-- ----------------------------------------------------------------------------
CREATE TABLE
    Entrega_Atividade (
        id_entrega SERIAL,
        id_objeto_storage UUID NOT NULL,
        nota NUMERIC(5, 2),
        feedback TEXT,
        atraso BOOLEAN,
        entregue_em TIMESTAMP
        WITH
            TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            id_atividade INTEGER NOT NULL,
            id_aluno UUID NOT NULL,
            CONSTRAINT pk_entrega_atividade PRIMARY KEY (id_entrega),
            CONSTRAINT uq_entrega_atividade_aluno UNIQUE (id_atividade, id_aluno),
            CONSTRAINT ck_entrega_nota_intervalo CHECK (
                nota IS NULL
                OR (
                    nota >= 0
                    AND nota <= 100
                )
            ),
            CONSTRAINT ck_entrega_feedback_avaliacao CHECK (
                nota IS NULL
                OR (
                    feedback IS NOT NULL
                    AND char_length(regexp_replace(feedback, '^[[:space:]]+|[[:space:]]+$', '', 'g'))
                        >= CASE WHEN nota < 60 THEN 20 ELSE 1 END
                )
            ),
            CONSTRAINT fk_entrega_atividade FOREIGN KEY (id_atividade) REFERENCES Atividade (id_atividade) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_entrega_aluno FOREIGN KEY (id_aluno) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_entrega_storage FOREIGN KEY (id_objeto_storage) REFERENCES storage.objects (id) ON DELETE CASCADE
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
            id_aluno UUID NOT NULL,
            id_turma INTEGER NOT NULL,
            id_professor UUID,
            CONSTRAINT pk_duvida PRIMARY KEY (id_duvida),
            CONSTRAINT ck_duvida_texto_sem_controle CHECK (
                assunto !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
                AND descricao !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
                AND (resposta IS NULL OR resposta !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]')
            ),
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
        id_objeto_storage UUID NOT NULL,
        id_duvida INTEGER NOT NULL,
        CONSTRAINT pk_duvida_anexo PRIMARY KEY (id_anexo),
        CONSTRAINT fk_duvida_anexo_duvida FOREIGN KEY (id_duvida) REFERENCES Duvida (id_duvida) ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_duvida_anexo_storage FOREIGN KEY (id_objeto_storage) REFERENCES storage.objects (id) ON DELETE CASCADE
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
            id_autor UUID NOT NULL,
            CONSTRAINT pk_mural_post PRIMARY KEY (id_post),
            CONSTRAINT ck_mural_post_texto_sem_controle CHECK (
                conteudo !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
            ),
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
            id_autor UUID NOT NULL,
            CONSTRAINT pk_comentario_mural PRIMARY KEY (id_comentario),
            CONSTRAINT ck_comentario_mural_texto_sem_controle CHECK (
                conteudo !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
            ),
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
        id_autor UUID NOT NULL,
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
            id_remetente UUID NOT NULL,
            id_destinatario UUID NOT NULL,
            CONSTRAINT pk_mensagem PRIMARY KEY (id_mensagem),
            CONSTRAINT ck_mensagem_autoria_distinta CHECK (id_remetente <> id_destinatario),
            CONSTRAINT ck_mensagem_texto_sem_controle CHECK (
                conteudo !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
            ),
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
            id_autor UUID NOT NULL,
            id_denunciado UUID NOT NULL,
            id_master UUID,
            CONSTRAINT pk_denuncia PRIMARY KEY (id_denuncia),
            CONSTRAINT ck_denuncia_status CHECK (status IN ('pendente', 'em_analise', 'resolvido')),
            CONSTRAINT ck_denuncia_partes_distintas CHECK (id_autor <> id_denunciado),
            CONSTRAINT ck_denuncia_texto_sem_controle CHECK (
                motivo !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
                AND descricao !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
            ),
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
            id_perfil UUID NOT NULL,
            id_master UUID,
            CONSTRAINT pk_ticket_suporte PRIMARY KEY (id_suporte),
            CONSTRAINT ck_ticket_status CHECK (status IN ('pendente', 'em_analise', 'resolvido')),
            CONSTRAINT ck_ticket_suporte_texto_sem_controle CHECK (
                assunto !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
                AND mensagem !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
            ),
            CONSTRAINT fk_ticket_perfil FOREIGN KEY (id_perfil) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE CASCADE,
            CONSTRAINT fk_ticket_master FOREIGN KEY (id_master) REFERENCES Perfil (id_perfil) ON UPDATE CASCADE ON DELETE SET NULL
    );

-- ----------------------------------------------------------------------------
-- 18. Tabela: Ticket_Suporte_Anexo (1FN - Decomposição de anexos_urls)
-- ----------------------------------------------------------------------------
CREATE TABLE
    Ticket_Suporte_Anexo (
        id_anexo SERIAL,
        id_objeto_storage UUID NOT NULL,
        id_suporte INTEGER NOT NULL,
        CONSTRAINT pk_ticket_suporte_anexo PRIMARY KEY (id_anexo),
        CONSTRAINT fk_ticket_anexo_suporte FOREIGN KEY (id_suporte) REFERENCES Ticket_Suporte (id_suporte) ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_ticket_anexo_storage FOREIGN KEY (id_objeto_storage) REFERENCES storage.objects (id) ON DELETE CASCADE
    );

-- ----------------------------------------------------------------------------
-- 19. Buckets do Supabase Storage
-- ----------------------------------------------------------------------------
INSERT INTO
    storage.buckets (id, name, public)
VALUES
    ('anexos_atividades', 'anexos_atividades', FALSE),
    ('entregas_atividades', 'entregas_atividades', FALSE),
    ('duvidasalunostoprofessor', 'duvidasalunostoprofessor', FALSE),
    ('anexos_suporte', 'anexos_suporte', FALSE)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 20. Gatilhos da RN12: aluno e professor só se vinculam a turmas da própria escola
--     SECURITY DEFINER para ler Perfil e Turma sem ser bloqueado pelo RLS.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_valida_escola_aluno_turma()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF (SELECT id_escola FROM public.Perfil WHERE id_perfil = NEW.id_aluno)
       IS DISTINCT FROM
       (SELECT id_escola FROM public.Turma WHERE id_turma = NEW.id_turma)
    THEN
        RAISE EXCEPTION 'Aluno e turma pertencem a escolas diferentes (RN12)';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_aluno_turma_escola ON Aluno_Turma;
CREATE TRIGGER trg_aluno_turma_escola
    BEFORE INSERT OR UPDATE ON Aluno_Turma
    FOR EACH ROW EXECUTE FUNCTION public.fn_valida_escola_aluno_turma();

CREATE OR REPLACE FUNCTION public.fn_valida_escola_professor_turma()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF (SELECT id_escola FROM public.Perfil WHERE id_perfil = NEW.id_professor)
       IS DISTINCT FROM
       (SELECT id_escola FROM public.Turma WHERE id_turma = NEW.id_turma)
    THEN
        RAISE EXCEPTION 'Professor e turma pertencem a escolas diferentes (RN12)';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_professor_turma_escola ON Professor_Turma;
CREATE TRIGGER trg_professor_turma_escola
    BEFORE INSERT OR UPDATE ON Professor_Turma
    FOR EACH ROW EXECUTE FUNCTION public.fn_valida_escola_professor_turma();