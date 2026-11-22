-- ============================================================================
-- DCC060 - Banco de Dados (2026.3) - Grupo 24: Sistema NexusClass
-- Arquivo: 05_visoes.sql (Seção 7.1 do modelo_trabalho_v3.pdf — Entrega E5)
-- Reconciliado por: Gianlucca Paiva (GianluccaPaiva) — 2026-11-22
-- Pré-requisito: Executar após 01_esquema.sql (ordem numérica 01 -> 02 -> 03 -> 04 -> 05).
-- ============================================================================

SET client_encoding = 'UTF8';

BEGIN;

-- ============================================================================
-- VISÃO 1: public.v_storage_objetos
-- Destinatário (Ator): Aplicação NexusClass (AnexoStorageFacade / usuários
--   autenticados: alunos, professores e masters) e Edge Functions (service_role).
-- Objetivo:
--   As tabelas de anexo e entrega em public (Atividade_Anexo, Entrega_Atividade,
--   Duvida_Anexo e Ticket_Suporte_Anexo) armazenam apenas a chave estrangeira
--   id_objeto_storage (UUID) referenciando storage.objects(id). Como o schema
--   storage não é exposto diretamente na API REST (PostgREST), esta visão
--   resolve id_objeto_storage -> (bucket_id, name) para geração de URLs assinadas
--   respeitando integralmente o RLS de storage.objects via security_invoker = true.
-- Atualizável?
--   Tecnicamente, por projetar uma única tabela base sem agregações/DISTINCT/GROUP BY,
--   seria sintaticamente simples; porém, na prática NÃO é atualizável pelos atores
--   da aplicação: recebeu apenas GRANT SELECT (sem INSERT/UPDATE/DELETE) e a tabela
--   subjacente storage.objects possui proteção nativa (protect_objects_delete) exigindo
--   mutações exclusivamente via Storage API.
-- ============================================================================
CREATE OR REPLACE VIEW public.v_storage_objetos
WITH (security_invoker = true) AS
SELECT
    id,
    bucket_id,
    name
FROM storage.objects;

REVOKE ALL ON public.v_storage_objetos FROM PUBLIC, anon;
GRANT SELECT ON public.v_storage_objetos TO authenticated, service_role;

-- ============================================================================
-- [PENDENTE PARA E5 — 27/11]: Adicionar ao menos +1 visão de negócio
-- (ex.: visão consolidada de entregas/desempenho por turma ou mural com autor)
-- para completar o mínimo de 2 visões exigido na Seção 7.1 de modelo_trabalho_v3.pdf.
-- ============================================================================

COMMIT;

SELECT pg_notify('pgrst', 'reload schema');
