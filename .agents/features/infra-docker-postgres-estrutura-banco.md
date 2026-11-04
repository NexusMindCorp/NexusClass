# Feature: Infraestrutura Docker PostgreSQL para Estruturação do Banco

- **Registro:** 2026-11-04
- **Autor / Responsável:** Gianlucca Paiva (`GianluccaPaiva`)
- **Status:** Concluído
- **Risco (RBT):** Nível 1 (Infraestrutura local isolada; sem alteração no código da SPA)
- **Validação:** `docker compose --env-file .env -f docker/structure/docker-compose.yml up -d` + execução de `000_teste_conexao.sql` no SQLTools

## 1. Visão Geral
Preparação do ambiente Docker contendo o banco de dados PostgreSQL 17 (`nexusclass-db` no projeto `nexusclass`) em `docker/structure/docker-compose.yml`, com persistência de dados (`nexusclass_pgdata`), leitura da pasta `docker/constructionsSQL`, variáveis isoladas no `.env` e script inicial de teste de conexão via extensão SQLTools.

## 2. Não-Objetivos (Non-Goals)
- Não criar conectores de backend/frontend nem alterar `src/lib/supabaseClient.ts` nesta etapa.
- Não migrar nem acoplar schemas legados do Supabase (`auth.uid()`, políticas RLS do Supabase Storage) neste momento.

## 3. UI/UX (consistência arquitetural)
Não aplicável (mudança exclusiva de infraestrutura de banco de dados em Docker).

## 4. Acessibilidade
Não aplicável.

## 5. Desempenho e Segurança
- Uso da imagem oficial enxuta `postgres:17-alpine` com `healthcheck` via `pg_isready`.
- Variáveis `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` e `DATABASE_URL` isoladas no `.env` (sem prefixo `VITE_`, evitando exposição no bundle do Vite).

## 6. Arquivos Tocados
- `docker/structure/docker-compose.yml` (novo)
- `docker/constructionsSQL/000_teste_conexao.sql` (novo)
- `.env.example`

## 7. Matriz de Risco
| Risco | Impacto | Mitigação |
|:---|:---|:---|
| Nome do projeto no Docker assumir o nome da pasta (`structure`) | Baixo | Definido `name: nexusclass` no topo do `docker-compose.yml` |
| `environment:` sobrescrever `env_file: ../../.env` com string vazia | Médio | Removida duplicação de `POSTGRES_USER`/`PASSWORD`/`DB` de `environment:`, mantendo a injeção via `env_file` |
| Porta fixa no YAML | Baixo | Mapeado `${POSTGRES_PORT}:${POSTGRES_PORT}` e `PGPORT: ${POSTGRES_PORT}` |

## 8. Validação
- [x] Container `nexusclass-db` criado sob a stack `nexusclass`
- [x] Variáveis e porta isoladas no `.env` e documentadas em `.env.example`
- [x] Persistência configurada via volume `nexusclass_pgdata`
- [x] Conexão testada via SQLTools com `docker/constructionsSQL/000_teste_conexao.sql`
- [x] `.docs/DOCUMENTACAO_APRESENTACAO.md` e relatório em `relatorios/2026-11/` atualizados

## 9. Procedimento de Rollback
Executar `docker compose --env-file .env -f docker/structure/docker-compose.yml down -v` e remover `docker/structure/docker-compose.yml` e `docker/constructionsSQL/000_teste_conexao.sql`.
