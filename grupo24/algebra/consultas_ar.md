# 4. Consultas em Álgebra Relacional

## 4.1 Esquema Lógico de Referência (Atualizado conforme Devolutiva da E2)
- **Escola** (**id_escola**, nome, ano_letivo, created_at)
- **Turma** (**id_turma**, codigo_acesso, materia, sala, periodo_escolar, banner_url, id_escola)
  - FK: id_escola referencia a tabela Escola (NOT NULL)
- **Perfil** (**id_perfil**, role, nome, email, bio, foto_url, created_at)
- **Professor_Turma** (**id_professor**, **id_turma**, created_at)
  - FK: id_professor referencia a tabela Perfil (NOT NULL)
  - FK: id_turma referencia a tabela Turma (NOT NULL)
- **Aluno_Turma** (**id_aluno**, **id_turma**, situacao, created_at)
  - FK: id_aluno referencia a tabela Perfil (NOT NULL)
  - FK: id_turma referencia a tabela Turma (NOT NULL)
- **Atividade** (**id_atividade**, titulo, descricao, data_entrega, id_turma, id_professor)
  - FK: id_turma referencia a tabela Turma (NOT NULL)
  - FK: id_professor referencia a tabela Perfil (NOT NULL)
- **Atividade_Anexo** (**id_anexo**, url, id_atividade)
  - FK: id_atividade referencia a tabela Atividade (NOT NULL)
- **Entrega_Atividade** (**id_entrega**, entrega_url, nota, feedback, entregue_em, id_atividade, id_aluno)
  - FK: id_atividade referencia a tabela Atividade (NOT NULL)
  - FK: id_aluno referencia a tabela Perfil (NOT NULL)
- **Duvida** (**id_duvida**, assunto, descricao, resolveu, resposta, created_at, id_aluno, id_turma, id_professor)
  - FK: id_aluno referencia a tabela Perfil (NOT NULL)
  - FK: id_turma referencia a tabela Turma (NOT NULL)
  - FK: id_professor referencia a tabela Perfil (NULL permitido até resposta)
- **Duvida_Anexo** (**id_anexo**, url, id_duvida)
  - FK: id_duvida referencia a tabela Duvida (NOT NULL)
- **Mural_Post** (**id_post**, conteudo, created_at, id_turma, id_autor)
  - FK: id_turma referencia a tabela Turma (NOT NULL)
  - FK: id_autor referencia a tabela Perfil (NOT NULL)
- **Comentario_Mural** (**id_comentario**, conteudo, created_at, id_post, id_autor)
  - FK: id_post referencia a tabela Mural_Post (NOT NULL)
  - FK: id_autor referencia a tabela Perfil (NOT NULL)
- **Evento_Calendario** (**id_evento**, titulo, descricao, data, horario, tipo, id_autor, id_turma)
  - FK: id_autor referencia a tabela Perfil (NOT NULL)
  - FK: id_turma referencia a tabela Turma (NULL permitido para eventos pessoais)
- **Alerta_Calendario** (**id_alerta**, mensagem, minutos_antes, lembrete_para, id_evento)
  - FK: id_evento referencia a tabela Evento_Calendario (NOT NULL)
- **Mensagem** (**id_mensagem**, conteudo, lida, created_at, id_remetente, id_destinatario)
  - FK: id_remetente referencia a tabela Perfil (NOT NULL)
  - FK: id_destinatario referencia a tabela Perfil (NOT NULL)
- **Denuncia** (**id_denuncia**, motivo, descricao, status, parecer_moderacao, created_at, id_autor, id_denunciado, id_master)
  - FK: id_autor referencia a tabela Perfil (NOT NULL)
  - FK: id_denunciado referencia a tabela Perfil (NOT NULL)
  - FK: id_master referencia a tabela Perfil (NULL permitido até moderação)
- **Ticket_Suporte** (**id_suporte**, assunto, mensagem, status, resposta_suporte, created_at, id_perfil, id_master)
  - FK: id_perfil referencia a tabela Perfil (NOT NULL)
  - FK: id_master referencia a tabela Perfil (NULL permitido até atendimento)
- **Ticket_Suporte_Anexo** (**id_anexo**, url, id_suporte)
  - FK: id_suporte referencia a tabela Ticket_Suporte (NOT NULL)

---

## 4.2 Consultas

1. **Consulta 1:** "Em quais turmas (matéria, sala e período escolar) a aluna 'Alice' está com matrícula ativa?"
  - AUX1 ← π<sub>{id_perfil}</sub>(σ<sub>role='aluno' ∧ nome='Alice'</sub>(Perfil))
  - AUX2 ← π<sub>{id_turma}</sub>(AUX1 ⋈<sub>θ</sub><sup>(AUX1.id_perfil = Aluno_Turma.id_aluno ∧ Aluno_Turma.situacao = 'ativa')</sup> Aluno_Turma)
  - **FINAL** ← π<sub>{materia, sala, periodo_escolar}</sub>(AUX2 ⋈ Turma)

2. **Consulta 2:** "Quais publicações (identificador, conteúdo, data de publicação e nome do autor) aparecem no mural da turma de código de acesso 'DCC000'?"
  - Turma_DCC ← π<sub>{id_turma}</sub>(σ<sub>codigo_acesso='DCC000'</sub>(Turma))
  - Posts_DCC ← π<sub>{id_post, conteudo, created_at, id_autor}</sub>(Turma_DCC ⋈ Mural_Post)
  - Autores ← ρ<sub>Autores(id_autor, nome_autor)</sub>(π<sub>{id_perfil, nome}</sub>(Perfil))
  - **FINAL** ← π<sub>{id_post, conteudo, created_at, nome_autor}</sub>(Posts_DCC ⋈ Autores)

3. **Consulta 3:** "Qual o nome e o e-mail dos alunos que entregaram todas as atividades criadas pelo professor 'Pietro' para a turma de código 'DCC000'?"
  - Turma_DCC ← π<sub>{id_turma}</sub>(σ<sub>codigo_acesso='DCC000'</sub>(Turma))
  - Prof_Pietro ← ρ<sub>Prof(id_professor)</sub>(π<sub>{id_perfil}</sub>(σ<sub>role='professor' ∧ nome='Pietro'</sub>(Perfil)))
  - Ativ_Pietro_DCC ← π<sub>{id_atividade}</sub>((Turma_DCC ⋈ Atividade) ⋈ Prof_Pietro)
  - Entregas_Alunos ← π<sub>{id_aluno, id_atividade}</sub>(Entrega_Atividade)
  - Alunos_Concluiram ← Entregas_Alunos ÷ Ativ_Pietro_DCC
  - **FINAL** ← π<sub>{nome, email}</sub>(Alunos_Concluiram ⋈<sub>θ</sub><sup>(Alunos_Concluiram.id_aluno = Perfil.id_perfil)</sup> Perfil)

4. **Consulta 4:** "Quais atividades (identificador, título, descrição e data de entrega) da turma de código 'DCC000' o aluno 'Alberto' ainda não entregou?"
  - Turma_DCC ← π<sub>{id_turma}</sub>(σ<sub>codigo_acesso='DCC000'</sub>(Turma))
  - Ativ_DCC ← π<sub>{id_atividade, titulo, descricao, data_entrega}</sub>(Turma_DCC ⋈ Atividade)
  - Alberto ← π<sub>{id_perfil}</sub>(σ<sub>role='aluno' ∧ nome='Alberto'</sub>(Perfil))
  - Entregas_Alberto ← π<sub>{id_atividade}</sub>(Entrega_Atividade ⋈<sub>θ</sub><sup>(Entrega_Atividade.id_aluno = Alberto.id_perfil)</sup> Alberto)
  - Ativ_Entregues_DCC ← π<sub>{id_atividade, titulo, descricao, data_entrega}</sub>(Ativ_DCC ⋈ Entregas_Alberto)
  - **FINAL** ← Ativ_DCC - Ativ_Entregues_DCC

5. **Consulta 5:** "Para os eventos agendados na data '31/12/2030', quais alertas estão configurados (título do evento, mensagem do alerta, código de acesso da turma e horário do evento) referentes às turmas em que o aluno 'Olegário' possui matrícula ativa?"
  - Olegario ← π<sub>{id_perfil}</sub>(σ<sub>role='aluno' ∧ nome='Olegário'</sub>(Perfil))
  - Mat_Olegario ← π<sub>{id_turma}</sub>(Olegario ⋈<sub>θ</sub><sup>(Olegario.id_perfil = Aluno_Turma.id_aluno ∧ Aluno_Turma.situacao = 'ativa')</sup> Aluno_Turma)
  - Turmas_Olegario ← π<sub>{id_turma, codigo_acesso}</sub>(Mat_Olegario ⋈ Turma)
  - Eventos_Data ← π<sub>{id_evento, titulo, horario, id_turma}</sub>(σ<sub>data='31/12/2030'</sub>(Evento_Calendario))
  - Eventos_Olegario ← Turmas_Olegario ⋈ Eventos_Data
  - **FINAL** ← π<sub>{titulo, mensagem, codigo_acesso, horario}</sub>(Eventos_Olegario ⋈ Alerta_Calendario)

6. **Consulta 6:** "Quais são todas as dúvidas registradas na turma 'DCC000' (assunto, descrição e resposta) juntamente com o nome do professor que as respondeu, mantendo no relatório também as dúvidas que ainda não foram respondidas por nenhum professor (valor nulo no nome do professor)?"
  - Turma_DCC ← π<sub>{id_turma}</sub>(σ<sub>codigo_acesso='DCC000'</sub>(Turma))
  - Duvidas_DCC ← π<sub>{id_duvida, assunto, descricao, resposta, id_professor}</sub>(Turma_DCC ⋈ Duvida)
  - Professores ← ρ<sub>Professores(id_professor, nome_professor)</sub>(π<sub>{id_perfil, nome}</sub>(σ<sub>role='professor'</sub>(Perfil)))
  - Relatorio_Duvidas ← Duvidas_DCC ⟕<sub>(Duvidas_DCC.id_professor = Professores.id_professor)</sub> Professores
  - **FINAL** ← π<sub>{assunto, descricao, resposta, nome_professor}</sub>(Relatorio_Duvidas)

7. **Consulta 7:** "Quais alunos (nome e e-mail) tiveram participação ativa na turma 'DCC000', tendo tanto realizado pelo menos uma entrega de atividade quanto registrado pelo menos uma dúvida com arquivo anexo no fórum dessa mesma turma?"
  - Turma_DCC ← π<sub>{id_turma}</sub>(σ<sub>codigo_acesso='DCC000'</sub>(Turma))
  - Ativ_DCC ← π<sub>{id_atividade}</sub>(Turma_DCC ⋈ Atividade)
  - Alunos_Entregaram ← π<sub>{id_aluno}</sub>(Ativ_DCC ⋈ Entrega_Atividade)
  - Duvidas_DCC ← π<sub>{id_duvida, id_aluno}</sub>(Turma_DCC ⋈ Duvida)
  - Alunos_Duvidas_Anexo ← π<sub>{id_aluno}</sub>(Duvidas_DCC ⋈ Duvida_Anexo)
  - Alunos_Participativos ← Alunos_Entregaram ∩ Alunos_Duvidas_Anexo
  - **FINAL** ← π<sub>{nome, email}</sub>(Alunos_Participativos ⋈<sub>θ</sub><sup>(Alunos_Participativos.id_aluno = Perfil.id_perfil)</sup> Perfil)

8. **Consulta 8:** "Qual o nome dos professores que foram denunciados por alunos que estão matriculados em pelo menos uma das turmas lecionadas por esses mesmos professores?"
  - Prof ← π<sub>{id_perfil, nome}</sub>(σ<sub>role='professor'</sub>(Perfil))
  - Denuncias_Base ← π<sub>{id_autor, id_denunciado}</sub>(Denuncia)
  - Prof_Denunciados ← Denuncias_Base ⋈<sub>θ</sub><sup>(Denuncias_Base.id_denunciado = Prof.id_perfil)</sup> Prof
  - Vinc_Prof ← π<sub>{id_professor, id_turma}</sub>(Professor_Turma)
  - Prof_Turmas_Den ← Prof_Denunciados ⋈<sub>θ</sub><sup>(Prof_Denunciados.id_perfil = Vinc_Prof.id_professor)</sup> Vinc_Prof
  - Vinc_Aluno ← π<sub>{id_aluno, id_turma}</sub>(σ<sub>situacao='ativa'</sub>(Aluno_Turma))
  - Den_Aluno_Turma ← Vinc_Aluno ⋈<sub>θ</sub><sup>(Vinc_Aluno.id_aluno = Prof_Turmas_Den.id_autor ∧ Vinc_Aluno.id_turma = Prof_Turmas_Den.id_turma)</sup> Prof_Turmas_Den
  - **FINAL** ← π<sub>{nome}</sub>(Den_Aluno_Turma)

9. **Consulta 9:** "Para fins de auditoria das solicitações enviadas pela usuária 'Rebeca', quais foram os assuntos/motivos, os relatos e o status de atendimento registrados por ela tanto em tickets de suporte técnico quanto em denúncias de moderação?"
  - Rebeca ← π<sub>{id_perfil}</sub>(σ<sub>nome='Rebeca'</sub>(Perfil))
  - Tickets_Rebeca ← ρ<sub>Ocorrencia(assunto_motivo, texto_relato, status)</sub>(π<sub>{assunto, mensagem, status}</sub>(Ticket_Suporte ⋈ Rebeca))
  - Denuncias_Rebeca ← ρ<sub>Ocorrencia(assunto_motivo, texto_relato, status)</sub>(π<sub>{motivo, descricao, status}</sub>(Denuncia ⋈<sub>θ</sub><sup>(Denuncia.id_autor = Rebeca.id_perfil)</sup> Rebeca))
  - **FINAL** ← Tickets_Rebeca ∪ Denuncias_Rebeca

10. **Consulta 10:** "O corpo docente da escola 'João XXIII' é composto por quais professores (nome e e-mail)?"
  - Joao23 ← π<sub>{id_escola}</sub>(σ<sub>nome='João XXIII'</sub>(Escola))
  - Turmas_Joao23 ← π<sub>{id_turma}</sub>(Joao23 ⋈ Turma)
  - Prof_Joao23 ← π<sub>{id_professor}</sub>(Turmas_Joao23 ⋈ Professor_Turma)
  - **FINAL** ← π<sub>{nome, email}</sub>(σ<sub>Prof_Joao23.id_professor = Perfil.id_perfil ∧ Perfil.role='professor'</sub>(Prof_Joao23 × Perfil))

---

## 4.3 Tabela de Cobertura: Operador x Consultas

| Operador | Símbolo | Nº das Consultas em que Aparece | Quantidade Total |
| :--- | :---: | :---: | :---: |
| Seleção | σ | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | 10 |
| Projeção | π | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | 10 |
| Atribuição | ← | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | 10 |
| Renomeação | ρ | 2, 3, 6, 9 | 4 |
| Junção Natural | ⋈ | 1, 2, 3, 4, 5, 6, 7, 9, 10 | 9 |
| Junção Condicional (Theta) | ⋈<sub>θ</sub> | 1, 3, 4, 5, 7, 8, 9 | 7 |
| Junção Externa (Left Outer Join) | ⟕ | 6 | 1 |
| Produto Cartesiano | × | 10 | 1 |
| União | ∪ | 9 | 1 |
| Interseção | ∩ | 7 | 1 |
| Diferença | - | 4 | 1 |
| Divisão | ÷ | 3 | 1 |

---

## 4.4 Adequações Realizadas Conforme Feedback da Etapa E2

### 1. Revisão das Cardinalidades `(mín, máx)` do DER
- **Escola** `(0,N)` — *possui* — `(1,1)` **Turma**
- **Professor** `(0,N)` — *Leciona* — `(1,N)` **Turma** (atributo: `created_at`)
- **Aluno** `(0,N)` — *Matricula-se* — `(0,N)` **Turma** (atributos: `situacao`, `created_at`)
- **Turma** `(0,N)` — *Contém* — `(1,1)` **Atividade**
- **Professor** `(0,N)` — *Cria* — `(1,1)` **Atividade**
- **Atividade** `(0,N)` — *Recebe* — `(1,1)` **EntregaAtividade**
- **Aluno** `(0,N)` — *Realiza* — `(1,1)` **EntregaAtividade**
- **Aluno** `(0,N)` — *Cria* — `(1,1)` **Duvida**
- **Professor** `(0,N)` — *Responde* — `(0,1)` **Duvida**
- **Turma** `(0,N)` — *Contém* — `(1,1)` **Duvida**
- **Turma** `(0,N)` — *Possui* — `(1,1)` **MuralPost**
- **Perfil** `(0,N)` — *Publica* — `(1,1)` **MuralPost**
- **MuralPost** `(0,N)` — *Recebe* — `(1,1)` **ComentarioMural**
- **Perfil** `(0,N)` — *Escreve* — `(1,1)` **ComentarioMural**
- **Perfil** `(0,N)` — *Cria* — `(1,1)` **EventoCalendario**
- **Turma** `(0,N)` — *Agenda* — `(0,1)` **EventoCalendario**
- **EventoCalendario** `(0,N)` — *Dispara* — `(1,1)` **AlertaCalendario**
- **Perfil** `(0,N)` — *Envia* — `(1,1)` **Mensagem**
- **Perfil** `(0,N)` — *Recebe* — `(1,1)` **Mensagem**
- **Perfil** `(0,N)` — *Registra* — `(1,1)` **Denuncia**
- **Perfil** `(0,N)` — *Alvo* — `(1,1)` **Denuncia**
- **Master** `(0,N)` — *Modera* — `(0,1)` **Denuncia**
- **Perfil** `(0,N)` — *Gera* — `(1,1)` **TicketSuporte**
- **Master** `(0,N)` — *Atende* — `(0,1)` **TicketSuporte**

### 2. Restrições de Integridade de Papel das Subclasses (`Perfil`)
Como a generalização de `Perfil` (`Aluno`, `Professor`, `Master`) foi mapeada em Tabela Única por meio da coluna discriminadora `role`, gatilhos (`BEFORE INSERT OR UPDATE`) garantem que as chaves estrangeiras dos relacionamentos específicos de subclasse referenciem apenas usuários com o papel correspondente:
- `id_aluno` em `Aluno_Turma`, `Entrega_Atividade` e `Duvida` exige obrigatoriamente `Perfil.role = 'aluno'`.
- `id_professor` em `Professor_Turma`, `Atividade` e `Duvida` exige obrigatoriamente `Perfil.role = 'professor'`.
- `id_master` em `Denuncia` e `Ticket_Suporte` exige obrigatoriamente `Perfil.role = 'master'`.

### 3. Forma Normal e Dependências Funcionais de Cada Relação
| Relação | Chave(s) Candidata(s) | Dependências Funcionais Não Triviais | Forma Normal e Justificativa |
| :--- | :--- | :--- | :--- |
| **Escola** | `id_escola` | `id_escola → nome, ano_letivo, created_at` | **3FN / FNBC:** Atributos atômicos, chave simples e ausência de dependências transitivas. |
| **Turma** | `id_turma`, `codigo_acesso` | `id_turma → codigo_acesso, materia, sala, periodo_escolar, banner_url, id_escola`; `codigo_acesso → id_turma, materia, sala, periodo_escolar, banner_url, id_escola` | **3FN / FNBC:** Todos os determinantes são chaves candidatas da relação. |
| **Perfil** | `id_perfil`, `email` | `id_perfil → role, nome, email, bio, foto_url, created_at`; `email → id_perfil, role, nome, bio, foto_url, created_at` | **3FN / FNBC:** Todos os determinantes são superchaves; sem dependências parciais ou transitivas. |
| **Professor_Turma** | `(id_professor, id_turma)` | `{id_professor, id_turma} → created_at` | **3FN / FNBC:** `created_at` depende da chave composta inteira (2FN) e não há transitividade (3FN). |
| **Aluno_Turma** | `(id_aluno, id_turma)` | `{id_aluno, id_turma} → situacao, created_at` | **3FN / FNBC:** `situacao` e `created_at` dependem do vínculo completo (aluno + turma). |
| **Atividade** | `id_atividade` | `id_atividade → titulo, descricao, data_entrega, id_turma, id_professor` | **3FN / FNBC:** Sem o multivalorado `anexos_urls`, todos os atributos dependem apenas da PK simples. |
| **Atividade_Anexo** | `id_anexo` | `id_anexo → url, id_atividade` | **3FN / FNBC:** Chave simples; `url` e `id_atividade` dependem exclusivamente de `id_anexo`. |
| **Entrega_Atividade** | `id_entrega`, `(id_atividade, id_aluno)` | `id_entrega → entrega_url, nota, feedback, entregue_em, id_atividade, id_aluno`; `{id_atividade, id_aluno} → id_entrega, entrega_url, nota, feedback, entregue_em` | **3FN / FNBC:** Sem o derivado `no_prazo`, todos os determinantes são chaves candidatas. |
| **Duvida** | `id_duvida` | `id_duvida → assunto, descricao, resolveu, resposta, created_at, id_aluno, id_turma, id_professor` | **3FN / FNBC:** Chave simples e atributos determinados unicamente por `id_duvida`. O atributo `resolveu` é independente de `resposta`, pois o aluno também pode marcar a dúvida como resolvida; logo, não há dependência transitiva entre eles. |
| **Duvida_Anexo** | `id_anexo` | `id_anexo → url, id_duvida` | **3FN / FNBC:** Chave simples sem dependências transitivas. |
| **Mural_Post** | `id_post` | `id_post → conteudo, created_at, id_turma, id_autor` | **3FN / FNBC:** Chave simples; todos os atributos não-chave dependem apenas de `id_post`. |
| **Comentario_Mural** | `id_comentario` | `id_comentario → conteudo, created_at, id_post, id_autor` | **3FN / FNBC:** Chave simples sem dependências entre atributos não-chave. |
| **Evento_Calendario** | `id_evento` | `id_evento → titulo, descricao, data, horario, tipo, id_autor, id_turma` | **3FN / FNBC:** Chave simples; atributos dependem exclusivamente de `id_evento`. |
| **Alerta_Calendario** | `id_alerta`, `(id_evento, minutos_antes, lembrete_para)` | `id_alerta → mensagem, minutos_antes, lembrete_para, id_evento`; `{id_evento, minutos_antes, lembrete_para} → id_alerta, mensagem` | **3FN / FNBC:** Com a retirada de `titulo_evento`, todos os determinantes são superchaves. |
| **Mensagem** | `id_mensagem` | `id_mensagem → conteudo, lida, created_at, id_remetente, id_destinatario` | **3FN / FNBC:** Chave simples; atributos dependem unicamente de `id_mensagem`. |
| **Denuncia** | `id_denuncia` | `id_denuncia → motivo, descricao, status, parecer_moderacao, created_at, id_autor, id_denunciado, id_master` | **3FN / FNBC:** Chave simples; dados da denúncia e da moderação dependem apenas de `id_denuncia`. |
| **Ticket_Suporte** | `id_suporte` | `id_suporte → assunto, mensagem, status, resposta_suporte, created_at, id_perfil, id_master` | **3FN / FNBC:** Com a retirada de `nome` e `email`, todos os atributos dependem apenas de `id_suporte`. |
| **Ticket_Suporte_Anexo** | `id_anexo` | `id_anexo → url, id_suporte` | **3FN / FNBC:** Chave simples sem dependências transitivas. |