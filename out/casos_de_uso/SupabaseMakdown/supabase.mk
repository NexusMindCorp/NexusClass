## Table `eventos_calendario`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `titulo` | `text` |  |
| `descricao` | `text` |  |
| `data` | `date` |  |
| `horario` | `time` |  Nullable |
| `created_at` | `timestamptz` |  |
| `autor_id` | `uuid` |  Nullable |
| `tipo` | `text` |  Nullable |
| `turma_id` | `uuid` |  Nullable |

## Table `alertas_calendario`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `evento_id` | `uuid` |  |
| `titulo_evento` | `text` |  |
| `mensagem` | `text` |  |
| `lembrete_para` | `timestamptz` |  |
| `created_at` | `timestamptz` |  |
| `minutos_antes` | `int4` |  |

## Table `escolas`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `nome` | `text` |  |
| `ano_letivo` | `int4` |  |
| `created_at` | `timestamptz` |  |

## Table `turmas_escolares`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `escola_id` | `uuid` |  |
| `chave` | `text` |  |
| `materia` | `text` |  |
| `banner_url` | `text` |  |
| `sala` | `text` |  |
| `turma` | `text` |  |
| `created_at` | `timestamptz` |  |

## Table `denuncias`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `created_at` | `timestamptz` |  |
| `aluno_denunciado` | `text` |  |
| `motivo` | `text` |  |
| `descricao` | `text` |  Nullable |
| `status` | `text` |  Nullable |

## Table `suporte`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `created_at` | `timestamptz` |  |
| `nome` | `text` |  |
| `email` | `text` |  |
| `assunto` | `text` |  |
| `mensagem` | `text` |  |
| `status` | `text` |  Nullable |
| `anexos_urls` | `_text` |  Nullable |

## Table `perfis`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `role` | `user_role` |  |
| `nome` | `text` |  |
| `email` | `text` |  |
| `bio` | `text` |  Nullable |
| `foto_url` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `professor_turma`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `professor_id` | `uuid` |  |
| `turma_id` | `uuid` |  |
| `created_at` | `timestamptz` |  |

## Table `aluno_turma`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `aluno_id` | `uuid` |  |
| `turma_id` | `uuid` |  |
| `created_at` | `timestamptz` |  |

## Table `mural_posts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `turma_id` | `uuid` |  |
| `autor_id` | `uuid` |  |
| `conteudo` | `text` |  |
| `created_at` | `timestamptz` |  |

## Table `atividades`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `turma_id` | `uuid` |  |
| `professor_id` | `uuid` |  |
| `titulo` | `text` |  |
| `descricao` | `text` |  |
| `data_entrega` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |
| `anexo_url` | `text` |  Nullable |

## Table `mensagens`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `remetente_id` | `uuid` |  |
| `destinatario_id` | `uuid` |  |
| `assunto` | `text` |  Nullable |
| `conteudo` | `text` |  |
| `lida` | `bool` |  |
| `created_at` | `timestamptz` |  |

## Table `duvidasalunostoprofessor`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `aluno_id` | `uuid` |  |
| `prof_id` | `uuid` |  |
| `turma_id` | `uuid` |  |
| `assunto` | `text` |  |
| `descricao` | `text` |  |
| `anexo_url` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `resolvido` | `bool` | Default: false |
| `resposta` | `text` | Nullable |

