# Anexos de dúvida e confirmação visual de denúncia

**Autor** Gabriel Lineker (`GabrielLineker`)  
**Ambiente** Supabase de teste e aplicação local, 20/11/2026

**Anexo e exclusão passaram.** O aluno anexou um arquivo à dúvida descartável 8. O professor vinculado baixou o arquivo e leu o conteúdo esperado. O professor da mesma escola sem vínculo com a DCC000 não conseguiu ler o vínculo nem baixar o arquivo. Após a exclusão pelo aluno, o master confirmou que arquivo, vínculo e dúvida não existiam mais.

**Confirmação visual bloqueada.** O Edge autenticou o professor, abriu a DCC000 e entrou na lista de alunos. A matrícula descartável já havia sido confirmada no provisionamento, mas o aluno não apareceu na lista, mesmo buscando pelo nome atual do perfil. O diagnóstico registrou 1.003 linhas no DOM e duas respostas HTTP 200 de matrícula. A consulta [de carregamento de alunos](../../src/repositories/EscolaTurmaRepository.ts:132) busca matrículas de múltiplas turmas sem paginação explícita. Uma resposta truncada é uma hipótese a verificar. Nenhuma denúncia nova foi enviada neste lote.

O [roteiro](../../scripts/validar-anexo-duvida-denuncia.mjs) permite retestar apenas o navegador com `--somente-denuncia`. As operações do anexo foram executadas pela API. Nenhum SQL foi executado no editor.
