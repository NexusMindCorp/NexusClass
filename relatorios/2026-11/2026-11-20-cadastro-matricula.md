# Ordem 1 — Cadastro público e matrícula

**Autor** Gabriel Lineker (`GabrielLineker`)  
**Ambiente** Supabase de teste

| Cenário | Resultado |
|---|---|
| Cadastro com escola existente | **Passou.** A API pública criou um usuário Auth, retornou sessão imediata e gerou o perfil de aluno na escola 1 com o mesmo ID. |
| Cadastro com escola inexistente | **Passou.** A API recusou a criação e a consulta posterior encontrou zero perfis com aquele endereço. |
| Matrícula em turma da própria escola | **Passou.** O aluno ficou com uma matrícula ativa na DCC001. |
| Repetição da matrícula | **Passou.** O segundo upsert manteve uma única matrícula ativa. |
| Cancelamento | **Passou.** A consulta posterior retornou zero vínculos com a DCC001. |
| Matrícula entre escolas | **Passou.** A matrícula na MAT101 foi recusada com código `42501`, e nenhum vínculo foi criado. |

O [roteiro](../../scripts/validar-cadastro-matricula.mjs) reproduz o payload da tela de cadastro e as operações do repositório de matrícula. Usou a chave pública e reservou o acesso administrativo para conferências de leitura. A execução terminou com código 0. O cadastro válido deixou uma conta descartável no ambiente. A matrícula temporária foi removida. A sessão imediata caracteriza o ambiente utilizado. A rodada não exercitou a interface no Edge nem a entrega ou o reenvio de e-mail. Nenhum SQL foi executado no editor.

A ordem 2 aguarda autorização explícita de Gabriel.
