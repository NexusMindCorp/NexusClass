# Paginação da lista de alunos e denúncia

**Autor** Gabriel Lineker (`GabrielLineker`)  
**Ambiente** Aplicação local e Supabase de teste

A sessão do professor encontrou 9.509 matrículas ativas na DCC000, mas a primeira resposta retornou somente 1.000. A conta descartável estava ausente da resposta inicial e apareceu na consulta por ID. Nenhum SQL foi executado. O diagnóstico usou o cliente autenticado do Supabase.

A consulta passou a percorrer as páginas na ordem da chave composta usando a sessão atual, as políticas RLS existentes e os mesmos filtros de turma e matrícula ativa. A lista ganhou busca pelo nome e exibe 50 resultados inicialmente, com opção de mostrar mais. O teste de repositório verifica que registros recebidos na segunda página chegam ao catálogo.

O [reteste no Edge](../../scripts/validar-anexo-duvida-denuncia.mjs) localizou o aluno descartável, enviou a denúncia, viu o aviso de sucesso e confirmou o fechamento do formulário. A sessão master confirmou a persistência do registro 6. A execução encerrou com código 0. TypeScript, 125 testes do Vitest e o teste independente de provisionamento passaram.
