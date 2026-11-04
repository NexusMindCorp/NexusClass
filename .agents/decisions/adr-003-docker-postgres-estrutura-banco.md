# ADR-003: Containerização do Banco PostgreSQL Local em `docker/structure/` e Isolamento de Variáveis `.env`

- **Data:** 2026-11-04
- **Autor / Responsável:** Gianlucca Paiva (`GianluccaPaiva`)
- **Status:** Implementado
> ADR aprovada nunca é reescrita; cria-se nova e marca-se a anterior como substituída.

## 1. Contexto e Motivação
Para iniciar a refatoração e estruturação própria do banco de dados do NexusClass em ambiente Docker (desacoplado da estrutura proprietária da nuvem do Supabase e sem conectores no momento), era necessário provisionar um container PostgreSQL leve, com persistência de dados local, leitura de scripts de construção em `docker/constructionsSQL/`, compatibilidade direta com a extensão **SQLTools** e isolamento total de credenciais e porta no arquivo `.env`.

## 2. Decisão Arquitetural
1. Criar `docker/structure/docker-compose.yml` com projeto nomeado `name: nexusclass` e serviço `postgres` (`postgres:17-alpine`, container `nexusclass-db`).
2. Configurar persistência no volume nomeado `nexusclass_pgdata:/var/lib/postgresql/data` e montagem somente-leitura `../constructionsSQL:/docker-entrypoint-initdb.d:ro` para execução de scripts `.sql`.
3. Isolar todas as variáveis de conexão (`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`) no `.env` da raiz (documentadas em `.env.example`), injetando-as via `env_file: ../../.env` e `PGPORT: ${POSTGRES_PORT}` sem valores hardcoded no YAML.
4. Disponibilizar script de validação de conexão `docker/constructionsSQL/000_teste_conexao.sql` para uso imediato no **SQLTools**.

## 3. Alternativas Consideradas e Descartadas (Anti-Decisões)
| Alternativa | Motivo do descarte |
|:---|:---|
| Subir stack completa do Supabase CLI via Docker (`supabase start`) | Pesada (múltiplos containers de Kong, GoTrue, Storage, Realtime) e acoplada à infraestrutura do Supabase quando o objetivo atual é estruturar o banco puro em PostgreSQL |
| Credenciais e porta `5432` hardcoded no `docker-compose.yml` | Viola a política de segurança (`security-policy.md`) de zero segredos/configurações fixas fora do `.env` |
| Repetir `POSTGRES_USER`/`POSTGRES_PASSWORD` em `environment:` junto com `env_file:` | Como o `docker-compose.yml` reside em `docker/structure/`, variáveis vazias no host sobrescreveriam o `env_file: ../../.env` caso o comando fosse executado sem `--env-file` |

## 4. Mapeamento de Arquivos
- `docker/structure/docker-compose.yml` (novo)
- `docker/constructionsSQL/000_teste_conexao.sql` (novo)
- `.env.example` (atualizado com variáveis `POSTGRES_*` e `DATABASE_URL`)

## 5. Antes vs. Depois
- **Antes:** Apenas scripts SQL acoplados ao Supabase (`supabase/001_*.sql` a `006_*.sql`), sem `docker-compose.yml` dedicado para estruturação limpa do PostgreSQL.
- **Depois:** Container `nexusclass-db` (`postgres:17-alpine`) sob o grupo `nexusclass`, com volume persistente `nexusclass_pgdata`, variáveis 100% isoladas no `.env` e conexão validada via SQLTools (`000_teste_conexao.sql`).

## 6. Análise de Risco e Mitigação
- **Risco:** Espaços em branco acidentais nas credenciais do SQLTools ou troca de senha no `.env` após o volume `nexusclass_pgdata` já ter sido inicializado.
- **Mitigação:** Documentado o uso de `docker compose --env-file .env -f docker/structure/docker-compose.yml down -v` seguido de `up -d` sempre que as credenciais de inicialização do `.env` forem alteradas.

## 7. Consequências (Trade-offs)
- **Positivas:** Ambiente leve (~80 MB na imagem Alpine), inicialização em segundos, persistência garantida em volume Docker e integração direta com SQLTools.
- **Negativas / Atenção:** Como o compose fica em `docker/structure/` e o `.env` na raiz, a interpolação de `${POSTGRES_PORT}` no mapeamento de portas requer `--env-file .env` ao executar o `docker compose` a partir da raiz.

## 8. Comandos de Rollback
```powershell
docker compose --env-file .env -f docker/structure/docker-compose.yml down -v
git checkout -- .env.example
Remove-Item docker/structure/docker-compose.yml, docker/constructionsSQL/000_teste_conexao.sql
```
