-- Aplicar depois de 15_codigo_publico_escola.sql.
-- Defesa em profundidade contra XSS / injeção de protocolos perigosos no banco
-- (V-02 e V-04 do consolidado .docs/PENTEST_E_SEGURANCA_NEXUSCLASS.md):
--  1) Exige protocolo http:// ou https:// (sem espaços, aspas ou < >) em
--     perfil.foto_url e turma.banner_url.
--  2) Bloqueia bytes nulos e caracteres de controle ASCII invisíveis em campos
--     de texto livre (preservando <, >, &, " legítimos conforme OWASP).
-- Constraints marcadas como NOT VALID preservam registros legados existentes
-- e validam estritamente todas as novas inserções e atualizações.
BEGIN;

-- 1. Validação de URLs persistidas (allowlist http:// e https://)
ALTER TABLE public.perfil
    DROP CONSTRAINT IF EXISTS ck_perfil_foto_url_http;
ALTER TABLE public.perfil
    ADD CONSTRAINT ck_perfil_foto_url_http
    CHECK (
        foto_url IS NULL
        OR foto_url ~ '^https?://[^\s<>"'']+$'
    ) NOT VALID;

ALTER TABLE public.turma
    DROP CONSTRAINT IF EXISTS ck_turma_banner_url_http;
ALTER TABLE public.turma
    ADD CONSTRAINT ck_turma_banner_url_http
    CHECK (
        banner_url IS NULL
        OR banner_url ~ '^https?://[^\s<>"'']+$'
    ) NOT VALID;

-- 2. Bloqueio de caracteres de controle invisíveis (0x00..0x08, 0x0B, 0x0C, 0x0E..0x1F, 0x7F)
--    Mantém \n (0x0A), \r (0x0D) e \t (0x09) permitidos em textos multilinha.
ALTER TABLE public.perfil
    DROP CONSTRAINT IF EXISTS ck_perfil_texto_sem_controle;
ALTER TABLE public.perfil
    ADD CONSTRAINT ck_perfil_texto_sem_controle
    CHECK (
        nome !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
        AND (bio IS NULL OR bio !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]')
    ) NOT VALID;

ALTER TABLE public.mural_post
    DROP CONSTRAINT IF EXISTS ck_mural_post_texto_sem_controle;
ALTER TABLE public.mural_post
    ADD CONSTRAINT ck_mural_post_texto_sem_controle
    CHECK (conteudo !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]') NOT VALID;

ALTER TABLE public.comentario_mural
    DROP CONSTRAINT IF EXISTS ck_comentario_mural_texto_sem_controle;
ALTER TABLE public.comentario_mural
    ADD CONSTRAINT ck_comentario_mural_texto_sem_controle
    CHECK (conteudo !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]') NOT VALID;

ALTER TABLE public.duvida
    DROP CONSTRAINT IF EXISTS ck_duvida_texto_sem_controle;
ALTER TABLE public.duvida
    ADD CONSTRAINT ck_duvida_texto_sem_controle
    CHECK (
        assunto !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
        AND descricao !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
        AND (resposta IS NULL OR resposta !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]')
    ) NOT VALID;

ALTER TABLE public.atividade
    DROP CONSTRAINT IF EXISTS ck_atividade_texto_sem_controle;
ALTER TABLE public.atividade
    ADD CONSTRAINT ck_atividade_texto_sem_controle
    CHECK (
        titulo !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
        AND descricao !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
    ) NOT VALID;

ALTER TABLE public.mensagem
    DROP CONSTRAINT IF EXISTS ck_mensagem_texto_sem_controle;
ALTER TABLE public.mensagem
    ADD CONSTRAINT ck_mensagem_texto_sem_controle
    CHECK (conteudo !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]') NOT VALID;

ALTER TABLE public.denuncia
    DROP CONSTRAINT IF EXISTS ck_denuncia_texto_sem_controle;
ALTER TABLE public.denuncia
    ADD CONSTRAINT ck_denuncia_texto_sem_controle
    CHECK (
        motivo !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
        AND descricao !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
    ) NOT VALID;

ALTER TABLE public.ticket_suporte
    DROP CONSTRAINT IF EXISTS ck_ticket_suporte_texto_sem_controle;
ALTER TABLE public.ticket_suporte
    ADD CONSTRAINT ck_ticket_suporte_texto_sem_controle
    CHECK (
        assunto !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
        AND mensagem !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
    ) NOT VALID;

COMMIT;
