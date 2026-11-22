-- ============================================================================
-- DCC060 - Banco de Dados (2026.3) - Grupo 24: Sistema NexusClass
-- Arquivo: 01_esquema.sql (Consolidado no padrão modelo_trabalho_v3.pdf)
-- Reconciliado por: Gianlucca Paiva (GianluccaPaiva) — 2026-11-22
-- ============================================================================
-- Escopo consolidado (execução sequencial estrita: 01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07):
--   * Parte A: 18 tabelas, PKs, FKs, UNIQUEs, CHECKs (RN01/03/05/06/11, ADR-010, XSS M16) e 4 buckets privados.
--   * Parte B: 89 políticas RLS base sincronizadas com o hardening da Migração 17.
--   * Parte C: Políticas RLS aditivas/restritivas (RN08 — M06/M07 e Storage professor — M05).
--   * Parte D: Publicação Realtime, RPCs de suporte (M14/M15) e Hardening S-01/S-04/S-06 (M17).
-- Nota de separação por entrega (modelo_trabalho_v3.pdf):
--   * Visões residem em 05_visoes.sql (Seção 7.1).
--   * Gatilhos e pg_cron residem em 06_triggers.sql (Seções 7.2 e 7.3), executando após 02_carga.sql.
-- Requisito de ambiente: PostgreSQL 14+ com stack Supabase (schemas auth e storage).
-- ============================================================================

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

-- ============================================================================
-- PARTE B: Row Level Security (RLS — 89 políticas base sincronizadas com M17)
-- Origem: docker/constructionsSQL/04_supabase_auth_rls.sql
-- ============================================================================
-- ============================================================================
-- NexusClass - Políticas de Row Level Security (RLS) para Supabase
-- Arquivo: 04_supabase_auth_rls.sql
-- Pré-requisito:
--   Executar após 01_esquema.sql (onde Perfil.id_perfil é UUID vinculado
--   a auth.users(id)).
-- ============================================================================

SET client_encoding = 'UTF8';

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Escola
-- ----------------------------------------------------------------------------
ALTER TABLE public.Escola ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Escola: leitura publica" ON public.Escola;
CREATE POLICY "Escola: leitura publica"
    ON public.Escola FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Escola: insercao apenas master" ON public.Escola;
CREATE POLICY "Escola: insercao apenas master"
    ON public.Escola FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Escola: atualizacao apenas master" ON public.Escola;
CREATE POLICY "Escola: atualizacao apenas master"
    ON public.Escola FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Escola: exclusao apenas master" ON public.Escola;
CREATE POLICY "Escola: exclusao apenas master"
    ON public.Escola FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 2. Turma
-- ----------------------------------------------------------------------------
ALTER TABLE public.Turma ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Turma: leitura publica" ON public.Turma;
CREATE POLICY "Turma: leitura publica"
    ON public.Turma FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Turma: insercao apenas master" ON public.Turma;
CREATE POLICY "Turma: insercao apenas master"
    ON public.Turma FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Turma: atualizacao apenas master" ON public.Turma;
CREATE POLICY "Turma: atualizacao apenas master"
    ON public.Turma FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Turma: exclusao apenas master" ON public.Turma;
CREATE POLICY "Turma: exclusao apenas master"
    ON public.Turma FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 3. Perfil
-- ----------------------------------------------------------------------------
ALTER TABLE public.Perfil ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Perfil: leitura para autenticados" ON public.Perfil;
CREATE POLICY "Perfil: leitura para autenticados"
    ON public.Perfil FOR SELECT
    TO authenticated
    USING (
        nexusclass_private.perfil_visivel_para_atual(
            id_perfil,
            id_escola,
            role
        )
    );

DROP POLICY IF EXISTS "Perfil: insercao proprio usuario ou master" ON public.Perfil;
CREATE POLICY "Perfil: insercao proprio usuario ou master"
    ON public.Perfil FOR INSERT
    TO authenticated
    WITH CHECK (
        (
            (SELECT auth.uid()) = id_perfil
            AND role = 'aluno'
            AND id_escola IS NOT NULL
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Perfil: atualizacao proprio perfil sem escalar role ou master" ON public.Perfil;
CREATE POLICY "Perfil: atualizacao proprio perfil sem escalar role ou master"
    ON public.Perfil FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_perfil
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        (
            (SELECT auth.uid()) = id_perfil
            AND Perfil.role = (
                SELECT p.role FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid())
            )
            AND Perfil.id_escola IS NOT DISTINCT FROM (
                SELECT p.id_escola FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid())
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Perfil: exclusao proprio aluno ou master" ON public.Perfil;
CREATE POLICY "Perfil: exclusao proprio aluno ou master"
    ON public.Perfil FOR DELETE
    TO authenticated
    USING (
        ((SELECT auth.uid()) = id_perfil AND role = 'aluno')
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 4. Professor_Turma
-- ----------------------------------------------------------------------------
ALTER TABLE public.Professor_Turma ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professor_Turma: leitura para autenticados" ON public.Professor_Turma;
CREATE POLICY "Professor_Turma: leitura para autenticados"
    ON public.Professor_Turma FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Professor_Turma: insercao apenas master" ON public.Professor_Turma;
CREATE POLICY "Professor_Turma: insercao apenas master"
    ON public.Professor_Turma FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Professor_Turma: atualizacao apenas master" ON public.Professor_Turma;
CREATE POLICY "Professor_Turma: atualizacao apenas master"
    ON public.Professor_Turma FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Professor_Turma: exclusao apenas master" ON public.Professor_Turma;
CREATE POLICY "Professor_Turma: exclusao apenas master"
    ON public.Professor_Turma FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 5. Aluno_Turma
-- ----------------------------------------------------------------------------
ALTER TABLE public.Aluno_Turma ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Aluno_Turma: leitura aluno professor da turma ou master" ON public.Aluno_Turma;
CREATE POLICY "Aluno_Turma: leitura aluno professor da turma ou master"
    ON public.Aluno_Turma FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Aluno_Turma.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Aluno_Turma: insercao proprio aluno ou master" ON public.Aluno_Turma;
CREATE POLICY "Aluno_Turma: insercao proprio aluno ou master"
    ON public.Aluno_Turma FOR INSERT
    TO authenticated
    WITH CHECK (
        (
            (SELECT auth.uid()) = id_aluno
            AND EXISTS (
                SELECT 1
                FROM public.Perfil p
                JOIN public.Turma t ON t.id_escola = p.id_escola
                WHERE p.id_perfil = (SELECT auth.uid())
                  AND t.id_turma = Aluno_Turma.id_turma
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Aluno_Turma: atualizacao proprio aluno ou master" ON public.Aluno_Turma;
CREATE POLICY "Aluno_Turma: atualizacao proprio aluno ou master"
    ON public.Aluno_Turma FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        (
            (SELECT auth.uid()) = id_aluno
            AND EXISTS (
                SELECT 1
                FROM public.Perfil p
                JOIN public.Turma t ON t.id_escola = p.id_escola
                WHERE p.id_perfil = (SELECT auth.uid())
                  AND t.id_turma = Aluno_Turma.id_turma
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Aluno_Turma: exclusao proprio aluno ou master" ON public.Aluno_Turma;
CREATE POLICY "Aluno_Turma: exclusao proprio aluno ou master"
    ON public.Aluno_Turma FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 6. Atividade
-- ----------------------------------------------------------------------------
ALTER TABLE public.Atividade ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Atividade: leitura para membros da turma" ON public.Atividade;
CREATE POLICY "Atividade: leitura para membros da turma"
    ON public.Atividade FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Atividade.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Aluno_Turma al
            WHERE al.id_turma = Atividade.id_turma
              AND al.id_aluno = (SELECT auth.uid())
              AND al.situacao = 'ativa'
        )
    );

DROP POLICY IF EXISTS "Atividade: insercao professor da turma ou master" ON public.Atividade;
CREATE POLICY "Atividade: insercao professor da turma ou master"
    ON public.Atividade FOR INSERT
    TO authenticated
    WITH CHECK (
        (
            id_professor = (SELECT auth.uid())
            AND EXISTS (
                SELECT 1
                FROM public.Professor_Turma pt
                JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                WHERE pt.id_turma = Atividade.id_turma
                  AND pt.id_professor = (SELECT auth.uid())
                  AND p.role IN ('professor', 'master')
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Atividade: atualizacao professor da turma ou master" ON public.Atividade;
CREATE POLICY "Atividade: atualizacao professor da turma ou master"
    ON public.Atividade FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Atividade.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Atividade.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Atividade: exclusao professor da turma ou master" ON public.Atividade;
CREATE POLICY "Atividade: exclusao professor da turma ou master"
    ON public.Atividade FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Atividade.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 7. Atividade_Anexo
-- ----------------------------------------------------------------------------
ALTER TABLE public.Atividade_Anexo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Atividade_Anexo: leitura membros da turma" ON public.Atividade_Anexo;
CREATE POLICY "Atividade_Anexo: leitura membros da turma"
    ON public.Atividade_Anexo FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Atividade a
            WHERE a.id_atividade = Atividade_Anexo.id_atividade
              AND (
                  EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
                  OR EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = a.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Aluno_Turma al
                      WHERE al.id_turma = a.id_turma
                        AND al.id_aluno = (SELECT auth.uid())
                        AND al.situacao = 'ativa'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Atividade_Anexo: insercao professor da turma ou master" ON public.Atividade_Anexo;
CREATE POLICY "Atividade_Anexo: insercao professor da turma ou master"
    ON public.Atividade_Anexo FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Atividade a
            WHERE a.id_atividade = Atividade_Anexo.id_atividade
              AND (
                  EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = a.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Atividade_Anexo: atualizacao professor da turma ou master" ON public.Atividade_Anexo;
CREATE POLICY "Atividade_Anexo: atualizacao professor da turma ou master"
    ON public.Atividade_Anexo FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Atividade a
            WHERE a.id_atividade = Atividade_Anexo.id_atividade
              AND (
                  EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = a.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Atividade a
            WHERE a.id_atividade = Atividade_Anexo.id_atividade
              AND (
                  EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = a.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Atividade_Anexo: exclusao professor da turma ou master" ON public.Atividade_Anexo;
CREATE POLICY "Atividade_Anexo: exclusao professor da turma ou master"
    ON public.Atividade_Anexo FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Atividade a
            WHERE a.id_atividade = Atividade_Anexo.id_atividade
              AND (
                  EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = a.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

-- ----------------------------------------------------------------------------
-- 8. Entrega_Atividade
-- ----------------------------------------------------------------------------
ALTER TABLE public.Entrega_Atividade ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Entrega_Atividade: leitura dono professor da turma ou master" ON public.Entrega_Atividade;
CREATE POLICY "Entrega_Atividade: leitura dono professor da turma ou master"
    ON public.Entrega_Atividade FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
        OR EXISTS (
            SELECT 1
            FROM public.Atividade a
            JOIN public.Professor_Turma pt ON pt.id_turma = a.id_turma
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE a.id_atividade = Entrega_Atividade.id_atividade
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
    );

DROP POLICY IF EXISTS "Entrega_Atividade: insercao aluno ativo da turma" ON public.Entrega_Atividade;
CREATE POLICY "Entrega_Atividade: insercao aluno ativo da turma"
    ON public.Entrega_Atividade FOR INSERT
    TO authenticated
    WITH CHECK (
        (
            (SELECT auth.uid()) = id_aluno
            AND nota IS NULL
            AND feedback IS NULL
            AND EXISTS (
                SELECT 1
                FROM public.Atividade a
                JOIN public.Aluno_Turma al ON al.id_turma = a.id_turma
                WHERE a.id_atividade = Entrega_Atividade.id_atividade
                  AND al.id_aluno = (SELECT auth.uid())
                  AND al.situacao = 'ativa'
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Entrega_Atividade: reenvio pelo aluno sem alterar nota" ON public.Entrega_Atividade;
CREATE POLICY "Entrega_Atividade: reenvio pelo aluno sem alterar nota"
    ON public.Entrega_Atividade FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        AND EXISTS (
            SELECT 1
            FROM public.Atividade a
            JOIN public.Aluno_Turma al ON al.id_turma = a.id_turma
            WHERE a.id_atividade = Entrega_Atividade.id_atividade
              AND al.id_aluno = (SELECT auth.uid())
              AND al.situacao = 'ativa'
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = id_aluno
        AND EXISTS (
            SELECT 1
            FROM public.Entrega_Atividade ea
            WHERE ea.id_entrega = Entrega_Atividade.id_entrega
              AND ea.id_aluno = (SELECT auth.uid())
              AND ea.nota IS NOT DISTINCT FROM Entrega_Atividade.nota
              AND ea.feedback IS NOT DISTINCT FROM Entrega_Atividade.feedback
        )
    );

DROP POLICY IF EXISTS "Entrega_Atividade: avaliacao por professor da turma ou master" ON public.Entrega_Atividade;
CREATE POLICY "Entrega_Atividade: avaliacao por professor da turma ou master"
    ON public.Entrega_Atividade FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
        OR EXISTS (
            SELECT 1
            FROM public.Atividade a
            JOIN public.Professor_Turma pt ON pt.id_turma = a.id_turma
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE a.id_atividade = Entrega_Atividade.id_atividade
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
        OR EXISTS (
            SELECT 1
            FROM public.Atividade a
            JOIN public.Professor_Turma pt ON pt.id_turma = a.id_turma
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE a.id_atividade = Entrega_Atividade.id_atividade
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
    );

DROP POLICY IF EXISTS "Entrega_Atividade: exclusao aluno dono ou master" ON public.Entrega_Atividade;
CREATE POLICY "Entrega_Atividade: exclusao aluno dono ou master"
    ON public.Entrega_Atividade FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 9. Duvida
-- ----------------------------------------------------------------------------
ALTER TABLE public.Duvida ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Duvida: leitura aluno professor da turma ou master" ON public.Duvida;
CREATE POLICY "Duvida: leitura aluno professor da turma ou master"
    ON public.Duvida FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR (SELECT auth.uid()) = id_professor
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Duvida.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Duvida: insercao aluno ativo da turma" ON public.Duvida;
CREATE POLICY "Duvida: insercao aluno ativo da turma"
    ON public.Duvida FOR INSERT
    TO authenticated
    WITH CHECK (
        (
            (SELECT auth.uid()) = id_aluno
            AND EXISTS (
                SELECT 1 FROM public.Aluno_Turma al
                WHERE al.id_turma = Duvida.id_turma
                  AND al.id_aluno = (SELECT auth.uid())
                  AND al.situacao = 'ativa'
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Duvida: atualizacao aluno professor da turma ou master" ON public.Duvida;
CREATE POLICY "Duvida: atualizacao aluno professor da turma ou master"
    ON public.Duvida FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR (SELECT auth.uid()) = id_professor
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Duvida.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = id_aluno
        OR (SELECT auth.uid()) = id_professor
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Duvida.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Duvida: exclusao aluno professor da turma ou master" ON public.Duvida;
CREATE POLICY "Duvida: exclusao aluno professor da turma ou master"
    ON public.Duvida FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_aluno
        OR (SELECT auth.uid()) = id_professor
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Duvida.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 10. Duvida_Anexo
-- ----------------------------------------------------------------------------
ALTER TABLE public.Duvida_Anexo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Duvida_Anexo: leitura vinculados a duvida" ON public.Duvida_Anexo;
CREATE POLICY "Duvida_Anexo: leitura vinculados a duvida"
    ON public.Duvida_Anexo FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Duvida d
            WHERE d.id_duvida = Duvida_Anexo.id_duvida
              AND (
                  (SELECT auth.uid()) = d.id_aluno
                  OR (SELECT auth.uid()) = d.id_professor
                  OR EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = d.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Duvida_Anexo: insercao aluno autor ou master" ON public.Duvida_Anexo;
CREATE POLICY "Duvida_Anexo: insercao aluno autor ou master"
    ON public.Duvida_Anexo FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Duvida d
            WHERE d.id_duvida = Duvida_Anexo.id_duvida
              AND (
                  (SELECT auth.uid()) = d.id_aluno
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Duvida_Anexo: atualizacao vinculados a duvida" ON public.Duvida_Anexo;
CREATE POLICY "Duvida_Anexo: atualizacao vinculados a duvida"
    ON public.Duvida_Anexo FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Duvida d
            WHERE d.id_duvida = Duvida_Anexo.id_duvida
              AND (
                  (SELECT auth.uid()) = d.id_aluno
                  OR (SELECT auth.uid()) = d.id_professor
                  OR EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = d.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Duvida d
            WHERE d.id_duvida = Duvida_Anexo.id_duvida
              AND (
                  (SELECT auth.uid()) = d.id_aluno
                  OR (SELECT auth.uid()) = d.id_professor
                  OR EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = d.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Duvida_Anexo: exclusao vinculados a duvida" ON public.Duvida_Anexo;
CREATE POLICY "Duvida_Anexo: exclusao vinculados a duvida"
    ON public.Duvida_Anexo FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Duvida d
            WHERE d.id_duvida = Duvida_Anexo.id_duvida
              AND (
                  (SELECT auth.uid()) = d.id_aluno
                  OR (SELECT auth.uid()) = d.id_professor
                  OR EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = d.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

-- ----------------------------------------------------------------------------
-- 11. Mural_Post
-- ----------------------------------------------------------------------------
ALTER TABLE public.Mural_Post ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mural_Post: leitura membros da turma" ON public.Mural_Post;
CREATE POLICY "Mural_Post: leitura membros da turma"
    ON public.Mural_Post FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Mural_Post.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Aluno_Turma al
            WHERE al.id_turma = Mural_Post.id_turma
              AND al.id_aluno = (SELECT auth.uid())
              AND al.situacao = 'ativa'
        )
    );

DROP POLICY IF EXISTS "Mural_Post: insercao membros da turma" ON public.Mural_Post;
CREATE POLICY "Mural_Post: insercao membros da turma"
    ON public.Mural_Post FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = id_autor
        AND (
            EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Professor_Turma pt
                JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                WHERE pt.id_turma = Mural_Post.id_turma
                  AND pt.id_professor = (SELECT auth.uid())
                  AND p.role IN ('professor', 'master')
            )
            OR EXISTS (
                SELECT 1 FROM public.Aluno_Turma al
                WHERE al.id_turma = Mural_Post.id_turma
                  AND al.id_aluno = (SELECT auth.uid())
                  AND al.situacao = 'ativa'
            )
        )
    );

DROP POLICY IF EXISTS "Mural_Post: atualizacao apenas autor ou master" ON public.Mural_Post;
CREATE POLICY "Mural_Post: atualizacao apenas autor ou master"
    ON public.Mural_Post FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_autor
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = id_autor
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Mural_Post: exclusao autor professor da turma ou master" ON public.Mural_Post;
CREATE POLICY "Mural_Post: exclusao autor professor da turma ou master"
    ON public.Mural_Post FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_autor
        OR EXISTS (
            SELECT 1
            FROM public.Professor_Turma pt
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE pt.id_turma = Mural_Post.id_turma
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 12. Comentario_Mural
-- ----------------------------------------------------------------------------
ALTER TABLE public.Comentario_Mural ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comentario_Mural: leitura membros da turma" ON public.Comentario_Mural;
CREATE POLICY "Comentario_Mural: leitura membros da turma"
    ON public.Comentario_Mural FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Mural_Post mp
            WHERE mp.id_post = Comentario_Mural.id_post
              AND (
                  EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
                  OR EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = mp.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Aluno_Turma al
                      WHERE al.id_turma = mp.id_turma
                        AND al.id_aluno = (SELECT auth.uid())
                        AND al.situacao = 'ativa'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Comentario_Mural: insercao membros da turma" ON public.Comentario_Mural;
CREATE POLICY "Comentario_Mural: insercao membros da turma"
    ON public.Comentario_Mural FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = id_autor
        AND EXISTS (
            SELECT 1
            FROM public.Mural_Post mp
            WHERE mp.id_post = Comentario_Mural.id_post
              AND (
                  EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
                  OR EXISTS (
                      SELECT 1
                      FROM public.Professor_Turma pt
                      JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                      WHERE pt.id_turma = mp.id_turma
                        AND pt.id_professor = (SELECT auth.uid())
                        AND p.role IN ('professor', 'master')
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Aluno_Turma al
                      WHERE al.id_turma = mp.id_turma
                        AND al.id_aluno = (SELECT auth.uid())
                        AND al.situacao = 'ativa'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Comentario_Mural: atualizacao autor ou master" ON public.Comentario_Mural;
CREATE POLICY "Comentario_Mural: atualizacao autor ou master"
    ON public.Comentario_Mural FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_autor
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = id_autor
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Comentario_Mural: exclusao autor professor da turma ou master" ON public.Comentario_Mural;
CREATE POLICY "Comentario_Mural: exclusao autor professor da turma ou master"
    ON public.Comentario_Mural FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_autor
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
        OR EXISTS (
            SELECT 1
            FROM public.Mural_Post mp
            JOIN public.Professor_Turma pt ON pt.id_turma = mp.id_turma
            JOIN public.Perfil p ON p.id_perfil = pt.id_professor
            WHERE mp.id_post = Comentario_Mural.id_post
              AND pt.id_professor = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
    );

-- ----------------------------------------------------------------------------
-- 13. Evento_Calendario
-- ----------------------------------------------------------------------------
ALTER TABLE public.Evento_Calendario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Evento_Calendario: leitura pessoal ou membros da turma" ON public.Evento_Calendario;
CREATE POLICY "Evento_Calendario: leitura pessoal ou membros da turma"
    ON public.Evento_Calendario FOR SELECT
    TO authenticated
    USING (
        (tipo = 'pessoal' AND (SELECT auth.uid()) = id_autor)
        OR (
            tipo = 'turma'
            AND (
                EXISTS (
                    SELECT 1 FROM public.Perfil p
                    WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.Professor_Turma pt
                    JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                    WHERE pt.id_turma = Evento_Calendario.id_turma
                      AND pt.id_professor = (SELECT auth.uid())
                      AND p.role IN ('professor', 'master')
                )
                OR EXISTS (
                    SELECT 1 FROM public.Aluno_Turma al
                    WHERE al.id_turma = Evento_Calendario.id_turma
                      AND al.id_aluno = (SELECT auth.uid())
                      AND al.situacao = 'ativa'
                )
            )
        )
    );

DROP POLICY IF EXISTS "Evento_Calendario: insercao pessoal ou professor/master" ON public.Evento_Calendario;
CREATE POLICY "Evento_Calendario: insercao pessoal ou professor/master"
    ON public.Evento_Calendario FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = id_autor
        AND (
            tipo = 'pessoal'
            OR (
                tipo = 'turma'
                AND (
                    EXISTS (
                        SELECT 1
                        FROM public.Professor_Turma pt
                        JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                        WHERE pt.id_turma = Evento_Calendario.id_turma
                          AND pt.id_professor = (SELECT auth.uid())
                          AND p.role IN ('professor', 'master')
                    )
                    OR EXISTS (
                        SELECT 1 FROM public.Perfil p
                        WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                    )
                )
            )
        )
    );

DROP POLICY IF EXISTS "Evento_Calendario: atualizacao autor professor ou master" ON public.Evento_Calendario;
CREATE POLICY "Evento_Calendario: atualizacao autor professor ou master"
    ON public.Evento_Calendario FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_autor
        OR (
            tipo = 'turma'
            AND EXISTS (
                SELECT 1
                FROM public.Professor_Turma pt
                JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                WHERE pt.id_turma = Evento_Calendario.id_turma
                  AND pt.id_professor = (SELECT auth.uid())
                  AND p.role IN ('professor', 'master')
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = id_autor
        OR (
            tipo = 'turma'
            AND EXISTS (
                SELECT 1
                FROM public.Professor_Turma pt
                JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                WHERE pt.id_turma = Evento_Calendario.id_turma
                  AND pt.id_professor = (SELECT auth.uid())
                  AND p.role IN ('professor', 'master')
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Evento_Calendario: exclusao autor professor ou master" ON public.Evento_Calendario;
CREATE POLICY "Evento_Calendario: exclusao autor professor ou master"
    ON public.Evento_Calendario FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_autor
        OR (
            tipo = 'turma'
            AND EXISTS (
                SELECT 1
                FROM public.Professor_Turma pt
                JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                WHERE pt.id_turma = Evento_Calendario.id_turma
                  AND pt.id_professor = (SELECT auth.uid())
                  AND p.role IN ('professor', 'master')
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 14. Alerta_Calendario
-- ----------------------------------------------------------------------------
ALTER TABLE public.Alerta_Calendario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alerta_Calendario: leitura se acessa evento pai" ON public.Alerta_Calendario;
CREATE POLICY "Alerta_Calendario: leitura se acessa evento pai"
    ON public.Alerta_Calendario FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Evento_Calendario ec
            WHERE ec.id_evento = Alerta_Calendario.id_evento
              AND (
                  (ec.tipo = 'pessoal' AND (SELECT auth.uid()) = ec.id_autor)
                  OR (
                      ec.tipo = 'turma'
                      AND (
                          EXISTS (
                              SELECT 1 FROM public.Perfil p
                              WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                          )
                          OR EXISTS (
                              SELECT 1
                              FROM public.Professor_Turma pt
                              JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                              WHERE pt.id_turma = ec.id_turma
                                AND pt.id_professor = (SELECT auth.uid())
                                AND p.role IN ('professor', 'master')
                          )
                          OR EXISTS (
                              SELECT 1 FROM public.Aluno_Turma al
                              WHERE al.id_turma = ec.id_turma
                                AND al.id_aluno = (SELECT auth.uid())
                                AND al.situacao = 'ativa'
                          )
                      )
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Alerta_Calendario: insercao criador professor ou master" ON public.Alerta_Calendario;
CREATE POLICY "Alerta_Calendario: insercao criador professor ou master"
    ON public.Alerta_Calendario FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Evento_Calendario ec
            WHERE ec.id_evento = Alerta_Calendario.id_evento
              AND (
                  (SELECT auth.uid()) = ec.id_autor
                  OR (
                      ec.tipo = 'turma'
                      AND EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = ec.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Alerta_Calendario: atualizacao criador professor ou master" ON public.Alerta_Calendario;
CREATE POLICY "Alerta_Calendario: atualizacao criador professor ou master"
    ON public.Alerta_Calendario FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Evento_Calendario ec
            WHERE ec.id_evento = Alerta_Calendario.id_evento
              AND (
                  (SELECT auth.uid()) = ec.id_autor
                  OR (
                      ec.tipo = 'turma'
                      AND EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = ec.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Evento_Calendario ec
            WHERE ec.id_evento = Alerta_Calendario.id_evento
              AND (
                  (SELECT auth.uid()) = ec.id_autor
                  OR (
                      ec.tipo = 'turma'
                      AND EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = ec.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Alerta_Calendario: exclusao criador professor ou master" ON public.Alerta_Calendario;
CREATE POLICY "Alerta_Calendario: exclusao criador professor ou master"
    ON public.Alerta_Calendario FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Evento_Calendario ec
            WHERE ec.id_evento = Alerta_Calendario.id_evento
              AND (
                  (SELECT auth.uid()) = ec.id_autor
                  OR (
                      ec.tipo = 'turma'
                      AND EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = ec.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

-- ----------------------------------------------------------------------------
-- 15. Mensagem
-- ----------------------------------------------------------------------------
ALTER TABLE public.Mensagem ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mensagem: leitura apenas participantes" ON public.Mensagem;
CREATE POLICY "Mensagem: leitura apenas participantes"
    ON public.Mensagem FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_remetente
        OR (SELECT auth.uid()) = id_destinatario
    );

DROP POLICY IF EXISTS "Mensagem: insercao apenas remetente" ON public.Mensagem;
CREATE POLICY "Mensagem: insercao apenas remetente"
    ON public.Mensagem FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = id_remetente);

DROP POLICY IF EXISTS "Mensagem: atualizacao remetente ou destinatario" ON public.Mensagem;
CREATE POLICY "Mensagem: atualizacao remetente ou destinatario"
    ON public.Mensagem FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_remetente
        OR (SELECT auth.uid()) = id_destinatario
    )
    WITH CHECK (
        (SELECT auth.uid()) = id_remetente
        OR (SELECT auth.uid()) = id_destinatario
    );

DROP POLICY IF EXISTS "Mensagem: exclusao remetente ou master" ON public.Mensagem;
CREATE POLICY "Mensagem: exclusao remetente ou master"
    ON public.Mensagem FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_remetente
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 16. Denuncia
-- ----------------------------------------------------------------------------
ALTER TABLE public.Denuncia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Denuncia: leitura autor ou master" ON public.Denuncia;
CREATE POLICY "Denuncia: leitura autor ou master"
    ON public.Denuncia FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_autor
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Denuncia: insercao autor como pendente" ON public.Denuncia;
CREATE POLICY "Denuncia: insercao autor como pendente"
    ON public.Denuncia FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = id_autor
        AND status = 'pendente'
        AND id_master IS NULL
        AND parecer_moderacao IS NULL
    );

DROP POLICY IF EXISTS "Denuncia: atualizacao apenas master" ON public.Denuncia;
CREATE POLICY "Denuncia: atualizacao apenas master"
    ON public.Denuncia FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Denuncia: exclusao apenas master" ON public.Denuncia;
CREATE POLICY "Denuncia: exclusao apenas master"
    ON public.Denuncia FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 17. Ticket_Suporte
-- ----------------------------------------------------------------------------
ALTER TABLE public.Ticket_Suporte ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ticket_Suporte: leitura dono ou master" ON public.Ticket_Suporte;
CREATE POLICY "Ticket_Suporte: leitura dono ou master"
    ON public.Ticket_Suporte FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_perfil
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Ticket_Suporte: insercao proprio usuario" ON public.Ticket_Suporte;
CREATE POLICY "Ticket_Suporte: insercao proprio usuario"
    ON public.Ticket_Suporte FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = id_perfil
        AND status = 'pendente'
        AND id_master IS NULL
        AND resposta_suporte IS NULL
    );

DROP POLICY IF EXISTS "Ticket_Suporte: atualizacao dono ou master" ON public.Ticket_Suporte;
CREATE POLICY "Ticket_Suporte: atualizacao dono ou master"
    ON public.Ticket_Suporte FOR UPDATE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_perfil
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = id_perfil
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

DROP POLICY IF EXISTS "Ticket_Suporte: exclusao dono ou master" ON public.Ticket_Suporte;
CREATE POLICY "Ticket_Suporte: exclusao dono ou master"
    ON public.Ticket_Suporte FOR DELETE
    TO authenticated
    USING (
        (SELECT auth.uid()) = id_perfil
        OR EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
        )
    );

-- ----------------------------------------------------------------------------
-- 18. Ticket_Suporte_Anexo
-- ----------------------------------------------------------------------------
ALTER TABLE public.Ticket_Suporte_Anexo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ticket_Suporte_Anexo: leitura dono ou master" ON public.Ticket_Suporte_Anexo;
CREATE POLICY "Ticket_Suporte_Anexo: leitura dono ou master"
    ON public.Ticket_Suporte_Anexo FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Ticket_Suporte ts
            WHERE ts.id_suporte = Ticket_Suporte_Anexo.id_suporte
              AND (
                  (SELECT auth.uid()) = ts.id_perfil
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Ticket_Suporte_Anexo: insercao dono ou master" ON public.Ticket_Suporte_Anexo;
CREATE POLICY "Ticket_Suporte_Anexo: insercao dono ou master"
    ON public.Ticket_Suporte_Anexo FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Ticket_Suporte ts
            WHERE ts.id_suporte = Ticket_Suporte_Anexo.id_suporte
              AND (
                  (SELECT auth.uid()) = ts.id_perfil
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Ticket_Suporte_Anexo: atualizacao dono ou master" ON public.Ticket_Suporte_Anexo;
CREATE POLICY "Ticket_Suporte_Anexo: atualizacao dono ou master"
    ON public.Ticket_Suporte_Anexo FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Ticket_Suporte ts
            WHERE ts.id_suporte = Ticket_Suporte_Anexo.id_suporte
              AND (
                  (SELECT auth.uid()) = ts.id_perfil
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.Ticket_Suporte ts
            WHERE ts.id_suporte = Ticket_Suporte_Anexo.id_suporte
              AND (
                  (SELECT auth.uid()) = ts.id_perfil
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Ticket_Suporte_Anexo: exclusao dono ou master" ON public.Ticket_Suporte_Anexo;
CREATE POLICY "Ticket_Suporte_Anexo: exclusao dono ou master"
    ON public.Ticket_Suporte_Anexo FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.Ticket_Suporte ts
            WHERE ts.id_suporte = Ticket_Suporte_Anexo.id_suporte
              AND (
                  (SELECT auth.uid()) = ts.id_perfil
                  OR EXISTS (
                      SELECT 1 FROM public.Perfil p
                      WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
                  )
              )
        )
    );

-- ----------------------------------------------------------------------------
-- 19. storage.objects (Buckets de Anexos e Entregas do Supabase Storage)
--     Obs.: RLS já vem habilitado por padrão em storage.objects no Supabase;
--           não executar ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY.
-- ----------------------------------------------------------------------------

-- Bucket: anexos_atividades (materiais publicados pelo professor em Atividade_Anexo)
DROP POLICY IF EXISTS "Storage anexos_atividades: leitura membros da turma" ON storage.objects;
CREATE POLICY "Storage anexos_atividades: leitura membros da turma"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'anexos_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Atividade_Anexo aa
                JOIN public.Atividade a ON a.id_atividade = aa.id_atividade
                WHERE aa.id_objeto_storage = objects.id
                  AND (
                      EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = a.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                      OR EXISTS (
                          SELECT 1 FROM public.Aluno_Turma al
                          WHERE al.id_turma = a.id_turma
                            AND al.id_aluno = (SELECT auth.uid())
                            AND al.situacao = 'ativa'
                      )
                  )
            )
        )
    );

DROP POLICY IF EXISTS "Storage anexos_atividades: upload professor ou master" ON storage.objects;
CREATE POLICY "Storage anexos_atividades: upload professor ou master"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'anexos_atividades'
        AND EXISTS (
            SELECT 1 FROM public.Perfil p
            WHERE p.id_perfil = (SELECT auth.uid())
              AND p.role IN ('professor', 'master')
        )
    );

DROP POLICY IF EXISTS "Storage anexos_atividades: atualizacao dono ou master" ON storage.objects;
CREATE POLICY "Storage anexos_atividades: atualizacao dono ou master"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'anexos_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    )
    WITH CHECK (
        bucket_id = 'anexos_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    );

DROP POLICY IF EXISTS "Storage anexos_atividades: exclusao dono prof turma ou master" ON storage.objects;
CREATE POLICY "Storage anexos_atividades: exclusao dono prof turma ou master"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'anexos_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Atividade_Anexo aa
                JOIN public.Atividade a ON a.id_atividade = aa.id_atividade
                JOIN public.Professor_Turma pt ON pt.id_turma = a.id_turma
                JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                WHERE aa.id_objeto_storage = objects.id
                  AND pt.id_professor = (SELECT auth.uid())
                  AND p.role IN ('professor', 'master')
            )
        )
    );

-- Bucket: entregas_atividades (entregas privadas dos alunos em Entrega_Atividade)
DROP POLICY IF EXISTS "Storage entregas_atividades: leitura dono prof turma ou master" ON storage.objects;
CREATE POLICY "Storage entregas_atividades: leitura dono prof turma ou master"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'entregas_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Entrega_Atividade ea
                JOIN public.Atividade a ON a.id_atividade = ea.id_atividade
                WHERE ea.id_objeto_storage = objects.id
                  AND (
                      ea.id_aluno = (SELECT auth.uid())
                      OR EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = a.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                  )
            )
        )
    );

DROP POLICY IF EXISTS "Storage entregas_atividades: upload aluno ativo ou master" ON storage.objects;
CREATE POLICY "Storage entregas_atividades: upload aluno ativo ou master"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'entregas_atividades'
        AND (
            EXISTS (
                SELECT 1 FROM public.Aluno_Turma al
                WHERE al.id_aluno = (SELECT auth.uid()) AND al.situacao = 'ativa'
            )
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    );

DROP POLICY IF EXISTS "Storage entregas_atividades: atualizacao dono ou master" ON storage.objects;
CREATE POLICY "Storage entregas_atividades: atualizacao dono ou master"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'entregas_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    )
    WITH CHECK (
        bucket_id = 'entregas_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    );

DROP POLICY IF EXISTS "Storage entregas_atividades: exclusao dono ou master" ON storage.objects;
CREATE POLICY "Storage entregas_atividades: exclusao dono ou master"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'entregas_atividades'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1 FROM public.Entrega_Atividade ea
                WHERE ea.id_objeto_storage = objects.id
                  AND ea.id_aluno = (SELECT auth.uid())
            )
        )
    );

-- Bucket: duvidasalunostoprofessor (anexos de dúvidas em Duvida_Anexo)
DROP POLICY IF EXISTS "Storage duvidasalunostoprofessor: leitura vinculados ou master" ON storage.objects;
CREATE POLICY "Storage duvidasalunostoprofessor: leitura vinculados ou master"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'duvidasalunostoprofessor'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Duvida_Anexo da
                JOIN public.Duvida d ON d.id_duvida = da.id_duvida
                WHERE da.id_objeto_storage = objects.id
                  AND (
                      d.id_aluno = (SELECT auth.uid())
                      OR d.id_professor = (SELECT auth.uid())
                      OR EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = d.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                  )
            )
        )
    );

DROP POLICY IF EXISTS "Storage duvidasalunostoprofessor: upload aluno ativo ou master" ON storage.objects;
CREATE POLICY "Storage duvidasalunostoprofessor: upload aluno ativo ou master"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'duvidasalunostoprofessor'
        AND (
            EXISTS (
                SELECT 1 FROM public.Aluno_Turma al
                WHERE al.id_aluno = (SELECT auth.uid()) AND al.situacao = 'ativa'
            )
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    );

DROP POLICY IF EXISTS "Storage duvidasalunostoprofessor: atualizacao dono ou master" ON storage.objects;
CREATE POLICY "Storage duvidasalunostoprofessor: atualizacao dono ou master"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'duvidasalunostoprofessor'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    )
    WITH CHECK (
        bucket_id = 'duvidasalunostoprofessor'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    );

DROP POLICY IF EXISTS "Storage duvidasalunostoprofessor: exclusao vinculados ou master" ON storage.objects;
CREATE POLICY "Storage duvidasalunostoprofessor: exclusao vinculados ou master"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'duvidasalunostoprofessor'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Duvida_Anexo da
                JOIN public.Duvida d ON d.id_duvida = da.id_duvida
                WHERE da.id_objeto_storage = objects.id
                  AND (
                      d.id_aluno = (SELECT auth.uid())
                      OR d.id_professor = (SELECT auth.uid())
                      OR EXISTS (
                          SELECT 1
                          FROM public.Professor_Turma pt
                          JOIN public.Perfil p ON p.id_perfil = pt.id_professor
                          WHERE pt.id_turma = d.id_turma
                            AND pt.id_professor = (SELECT auth.uid())
                            AND p.role IN ('professor', 'master')
                      )
                  )
            )
        )
    );

-- Bucket: anexos_suporte (prints/anexos de tickets em Ticket_Suporte_Anexo)
DROP POLICY IF EXISTS "Storage anexos_suporte: leitura dono ou master" ON storage.objects;
CREATE POLICY "Storage anexos_suporte: leitura dono ou master"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'anexos_suporte'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Ticket_Suporte_Anexo tsa
                JOIN public.Ticket_Suporte ts ON ts.id_suporte = tsa.id_suporte
                WHERE tsa.id_objeto_storage = objects.id
                  AND ts.id_perfil = (SELECT auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "Storage anexos_suporte: upload usuario autenticado" ON storage.objects;
CREATE POLICY "Storage anexos_suporte: upload usuario autenticado"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'anexos_suporte'
        AND (SELECT auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Storage anexos_suporte: atualizacao dono ou master" ON storage.objects;
CREATE POLICY "Storage anexos_suporte: atualizacao dono ou master"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'anexos_suporte'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    )
    WITH CHECK (
        bucket_id = 'anexos_suporte'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
        )
    );

DROP POLICY IF EXISTS "Storage anexos_suporte: exclusao dono ou master" ON storage.objects;
CREATE POLICY "Storage anexos_suporte: exclusao dono ou master"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'anexos_suporte'
        AND (
            owner_id = (SELECT auth.uid()::text)
            OR EXISTS (
                SELECT 1 FROM public.Perfil p
                WHERE p.id_perfil = (SELECT auth.uid()) AND p.role = 'master'
            )
            OR EXISTS (
                SELECT 1
                FROM public.Ticket_Suporte_Anexo tsa
                JOIN public.Ticket_Suporte ts ON ts.id_suporte = tsa.id_suporte
                WHERE tsa.id_objeto_storage = objects.id
                  AND ts.id_perfil = (SELECT auth.uid())
            )
        )
    );

COMMIT;

-- ============================================================================
-- PARTE C: Políticas RLS Aditivas e Restritivas (RN08 + Storage Professor)
-- Origem: docker/constructionsSQL/05 (bloco 3), 06 e 07
-- ============================================================================
BEGIN;

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

COMMIT;

BEGIN;

CREATE SCHEMA IF NOT EXISTS nexusclass_private;
REVOKE ALL ON SCHEMA nexusclass_private FROM PUBLIC;

CREATE OR REPLACE FUNCTION nexusclass_private.reenvio_preserva_avaliacao(
    entrega_id integer,
    atividade_id integer,
    nova_nota numeric,
    novo_feedback text
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.entrega_atividade AS entrega
        WHERE entrega.id_entrega = entrega_id
          AND entrega.id_atividade = atividade_id
          AND entrega.id_aluno = (SELECT auth.uid())
          AND entrega.nota IS NOT DISTINCT FROM nova_nota
          AND entrega.feedback IS NOT DISTINCT FROM novo_feedback
    );
$$;

REVOKE ALL ON FUNCTION nexusclass_private.reenvio_preserva_avaliacao(integer, integer, numeric, text)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION nexusclass_private.reenvio_preserva_avaliacao(integer, integer, numeric, text)
    TO authenticated;

ALTER POLICY "Entrega_Atividade: reenvio pelo aluno sem alterar nota"
    ON public.entrega_atividade
    WITH CHECK (
        (SELECT auth.uid()) = id_aluno
        AND nexusclass_private.reenvio_preserva_avaliacao(
            id_entrega, id_atividade, nota, feedback
        )
    );

COMMIT;

-- Aplicar depois de 06_corrige_rls_reenvio_entrega.sql.
BEGIN;

-- A nota registrada marca a avaliação, inclusive quando não há feedback.
-- As políticas permissivas existentes continuam decidindo quem pode operar.
DROP POLICY IF EXISTS entrega_avaliada_bloqueia_aluno_update ON public.entrega_atividade;
CREATE POLICY entrega_avaliada_bloqueia_aluno_update
    ON public.entrega_atividade AS RESTRICTIVE FOR UPDATE TO authenticated
    USING (id_aluno <> (SELECT auth.uid()) OR nota IS NULL);

DROP POLICY IF EXISTS entrega_avaliada_bloqueia_aluno_delete ON public.entrega_atividade;
CREATE POLICY entrega_avaliada_bloqueia_aluno_delete
    ON public.entrega_atividade AS RESTRICTIVE FOR DELETE TO authenticated
    USING (id_aluno <> (SELECT auth.uid()) OR nota IS NULL);

-- O aluno tem leitura da própria entrega pelas políticas existentes.
-- A consulta usa as permissões da sessão e se limita ao bucket de entregas.
DROP POLICY IF EXISTS entrega_avaliada_protege_arquivo_update ON storage.objects;
CREATE POLICY entrega_avaliada_protege_arquivo_update
    ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
    USING (
        bucket_id <> 'entregas_atividades'
        OR NOT EXISTS (
            SELECT 1
            FROM public.entrega_atividade AS entrega
            WHERE entrega.id_objeto_storage = objects.id
              AND entrega.id_aluno = (SELECT auth.uid())
              AND entrega.nota IS NOT NULL
        )
    );

DROP POLICY IF EXISTS entrega_avaliada_protege_arquivo_delete ON storage.objects;
CREATE POLICY entrega_avaliada_protege_arquivo_delete
    ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
    USING (
        bucket_id <> 'entregas_atividades'
        OR NOT EXISTS (
            SELECT 1
            FROM public.entrega_atividade AS entrega
            WHERE entrega.id_objeto_storage = objects.id
              AND entrega.id_aluno = (SELECT auth.uid())
              AND entrega.nota IS NOT NULL
        )
    );

COMMIT;

-- ============================================================================
-- PARTE D: Publicação Realtime, RPCs de Infraestrutura e Hardening (M05, M14, M15, M17)
-- Nota: Visões ficam em 05_visoes.sql; Gatilhos e pg_cron ficam em 06_triggers.sql.
-- ============================================================================
BEGIN;

-- D.1 Publicação Realtime (5 canais do NotificacaoSubject)
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

-- D.2 RPC exclusiva service_role para listagem de arquivos na exclusão de conta (RN09 / M14)
CREATE OR REPLACE FUNCTION public.listar_objetos_storage_perfil(
    p_id_perfil UUID
)
RETURNS TABLE (
    id_objeto_storage UUID,
    bucket_id TEXT,
    caminho TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT DISTINCT
        so.id AS id_objeto_storage,
        so.bucket_id,
        so.name AS caminho
    FROM storage.objects AS so
    WHERE so.bucket_id IS NOT NULL
      AND so.name IS NOT NULL
      AND (
          so.id IN (
              SELECT ea.id_objeto_storage
              FROM public.entrega_atividade AS ea
              WHERE ea.id_aluno = p_id_perfil
                AND ea.id_objeto_storage IS NOT NULL

              UNION

              SELECT da.id_objeto_storage
              FROM public.duvida AS d
              JOIN public.duvida_anexo AS da ON da.id_duvida = d.id_duvida
              WHERE d.id_aluno = p_id_perfil
                AND da.id_objeto_storage IS NOT NULL

              UNION

              SELECT tsa.id_objeto_storage
              FROM public.ticket_suporte AS ts
              JOIN public.ticket_suporte_anexo AS tsa ON tsa.id_suporte = ts.id_suporte
              WHERE ts.id_perfil = p_id_perfil
                AND tsa.id_objeto_storage IS NOT NULL
          )
          OR (
              (so.owner_id = p_id_perfil::text OR so.owner = p_id_perfil)
              AND so.bucket_id IN (
                  'entregas_atividades',
                  'duvidasalunostoprofessor',
                  'anexos_suporte'
              )
          )
      )
    ORDER BY so.bucket_id, so.name;
$$;

REVOKE ALL ON FUNCTION public.listar_objetos_storage_perfil(UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_objetos_storage_perfil(UUID)
    TO service_role;

-- D.3 Proteção de coluna codigo_publico e RPC da própria escola (ADR-010 / M15)
REVOKE SELECT ON public.escola FROM anon, authenticated;
GRANT SELECT (id_escola, nome, ano_letivo, created_at)
    ON public.escola TO authenticated;

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

-- D.4 Hardening Supabase (M17: S-01, S-04 e S-06)
DO $$
BEGIN
    IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
    END IF;
END
$$;

UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id IN (
    'anexos_atividades',
    'entregas_atividades',
    'duvidasalunostoprofessor',
    'anexos_suporte'
);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
    ON ALL TABLES IN SCHEMA public
    FROM anon;

COMMIT;

-- Atualiza o cache de schema do PostgREST
SELECT pg_notify('pgrst', 'reload schema');
