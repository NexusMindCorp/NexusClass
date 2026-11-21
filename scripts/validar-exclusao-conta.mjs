import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

assert.ok(url, 'VITE_SUPABASE_URL ausente no ambiente');
assert.ok(anonKey, 'VITE_SUPABASE_ANON_KEY ausente no ambiente');

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };
const supabase = createClient(url, anonKey, clientOptions);

async function dados(operacao, etapa) {
  const { data, error } = await operacao;
  assert.ok(!error, `${etapa} falhou (${error?.code ?? error?.status ?? 'API'}: ${error?.message ?? ''})`);
  return data;
}

async function uploadEObterIdObjeto(bucket, caminho, conteudo) {
  const blob = new Blob([conteudo], { type: 'text/plain' });
  await dados(
    supabase.storage.from(bucket).upload(caminho, blob, {
      contentType: 'text/plain',
      upsert: false,
    }),
    `Upload em ${bucket}`,
  );

  const objeto = await dados(
    supabase
      .from('v_storage_objetos')
      .select('id, bucket_id, name')
      .eq('bucket_id', bucket)
      .eq('name', caminho)
      .single(),
    `Consulta v_storage_objetos (${bucket})`,
  );

  assert.ok(objeto?.id, `Objeto ${bucket}/${caminho} não encontrado em v_storage_objetos`);
  return objeto.id;
}

function dataAmanhaIso() {
  const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return amanha.toISOString().slice(0, 10);
}

async function executar() {
  const chave = randomUUID();
  const email = `descartavel-exclusao-${chave}@example.com`;
  const senha = `Nx!9${randomBytes(24).toString('base64url')}`;
  const nome = `Aluno Descartavel Exclusao ${chave.slice(0, 8)}`;

  // 1. Selecionar turma DCC001 (escola 1) e uma atividade dela
  const turma = await dados(
    supabase
      .from('turma')
      .select('id_turma, id_escola, codigo_acesso')
      .eq('codigo_acesso', 'DCC001')
      .single(),
    'Leitura da turma DCC001',
  );

  // 2. Cadastro público do aluno descartável na mesma escola
  const signUpData = await dados(
    supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome, id_escola: turma.id_escola } },
    }),
    'Cadastro público da conta descartável',
  );

  const userId = signUpData.user?.id;
  const accessToken = signUpData.session?.access_token;
  assert.ok(userId, 'Auth não retornou user.id');
  assert.ok(accessToken, 'Sessão imediata não foi aberta no cadastro público');
  console.log(`1. Conta descartável criada (userId=${userId}, escola=${turma.id_escola}).`);

  // 3. Garantir que authenticated NÃO pode chamar a RPC exclusiva de service_role
  const { error: rpcError } = await supabase.rpc('listar_objetos_storage_perfil', {
    p_id_perfil: userId,
  });
  assert.ok(rpcError, 'authenticated NÃO deveria conseguir executar listar_objetos_storage_perfil');
  console.log(`2. Bloqueio da RPC para authenticated PASSOU (${rpcError.code ?? rpcError.message}).`);

  // 4. Garantir rejeição de método GET (405) e ausência de Authorization (401)
  const respGet = await fetch(`${url}/functions/v1/deletar-conta`, {
    method: 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  assert.equal(respGet.status, 405, `Esperado HTTP 405 para GET, recebido ${respGet.status}`);
  console.log('3. Rejeição de método GET na Edge Function PASSOU (HTTP 405).');

  const respSemAuth = await fetch(`${url}/functions/v1/deletar-conta`, {
    method: 'POST',
    headers: { apikey: anonKey },
  });
  assert.equal(respSemAuth.status, 401, `Esperado HTTP 401 sem Authorization, recebido ${respSemAuth.status}`);
  console.log('4. Rejeição sem Authorization PASSOU (HTTP 401).');

  // 5. Matricular na DCC001 e criar massa real em tabelas filhas + 3 buckets + 1 arquivo órfão
  await dados(
    supabase.from('aluno_turma').insert({
      id_aluno: userId,
      id_turma: turma.id_turma,
      situacao: 'ativa',
    }),
    'Matrícula na DCC001',
  );

  const atividades = await dados(
    supabase
      .from('atividade')
      .select('id_atividade')
      .eq('id_turma', turma.id_turma)
      .order('id_atividade', { ascending: false })
      .limit(1),
    'Leitura de atividade da DCC001',
  );
  assert.ok(atividades.length > 0, 'Nenhuma atividade encontrada na DCC001');
  const idAtividade = atividades[0].id_atividade;

  // Bucket 1: entregas_atividades + entrega_atividade
  const objEntregaId = await uploadEObterIdObjeto(
    'entregas_atividades',
    `${idAtividade}/${userId}/entrega-teste-${chave}.txt`,
    'Entrega descartável para validação de exclusão de conta.',
  );
  await dados(
    supabase.from('entrega_atividade').insert({
      id_atividade: idAtividade,
      id_aluno: userId,
      id_objeto_storage: objEntregaId,
    }),
    'Inserção em entrega_atividade',
  );

  // Bucket 2: duvidasalunostoprofessor + duvida + duvida_anexo
  const duvida = await dados(
    supabase
      .from('duvida')
      .insert({
        assunto: `Dúvida descartável ${chave.slice(0, 8)}`,
        descricao: 'Registro descartável para teste de exclusão em cascata.',
        id_aluno: userId,
        id_turma: turma.id_turma,
      })
      .select('id_duvida')
      .single(),
    'Inserção em duvida',
  );
  const objDuvidaId = await uploadEObterIdObjeto(
    'duvidasalunostoprofessor',
    `${duvida.id_duvida}/${userId}/duvida-teste-${chave}.txt`,
    'Anexo de dúvida descartável.',
  );
  await dados(
    supabase.from('duvida_anexo').insert({
      id_duvida: duvida.id_duvida,
      id_objeto_storage: objDuvidaId,
    }),
    'Inserção em duvida_anexo',
  );

  // Bucket 3: anexos_suporte + ticket_suporte + ticket_suporte_anexo
  const ticket = await dados(
    supabase
      .from('ticket_suporte')
      .insert({
        assunto: `Ticket descartável ${chave.slice(0, 8)}`,
        mensagem: 'Chamado descartável para teste de exclusão em cascata.',
        id_perfil: userId,
      })
      .select('id_suporte')
      .single(),
    'Inserção em ticket_suporte',
  );
  const objSuporteId = await uploadEObterIdObjeto(
    'anexos_suporte',
    `${ticket.id_suporte}/${userId}/suporte-teste-${chave}.txt`,
    'Anexo de suporte descartável.',
  );
  await dados(
    supabase.from('ticket_suporte_anexo').insert({
      id_suporte: ticket.id_suporte,
      id_objeto_storage: objSuporteId,
    }),
    'Inserção em ticket_suporte_anexo',
  );

  // 4º arquivo sem vínculo relacional (testa limpeza via owner_id/owner)
  const objOrfaoId = await uploadEObterIdObjeto(
    'anexos_suporte',
    `orfao/${userId}/arquivo-orfao-${chave}.txt`,
    'Arquivo sem vínculo relacional pertencente ao aluno.',
  );

  // Evento pessoal no calendário (testa cascata em evento_calendario)
  await dados(
    supabase.from('evento_calendario').insert({
      titulo: `Evento descartável ${chave.slice(0, 8)}`,
      descricao: 'Evento pessoal descartável.',
      data: dataAmanhaIso(),
      horario: '14:00:00',
      tipo: 'pessoal',
      id_autor: userId,
      id_turma: null,
    }),
    'Inserção em evento_calendario',
  );

  console.log(
    `5. Massa descartável criada: 4 arquivos nos 3 buckets + entrega + dúvida + ticket + matrícula + evento.`,
  );

  // 6. Invocar Edge Function deletar-conta (exatamente como BoxAlertaDeletaConta.tsx)
  const { data: respDelecao, error: invokeError } =
    await supabase.functions.invoke('deletar-conta', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

  assert.ok(!invokeError, `Invoke deletar-conta falhou: ${invokeError?.message}`);
  assert.equal(respDelecao?.storage_limpeza_parcial, false, 'Não deveria haver falha parcial no Storage');
  assert.equal(respDelecao?.arquivos_removidos, 4, `Esperado 4 arquivos removidos, recebido ${respDelecao?.arquivos_removidos}`);
  assert.equal(respDelecao?.arquivos_com_falha, 0, 'Esperado 0 arquivos com falha');
  console.log('6. Edge Function deletar-conta PASSOU:', JSON.stringify(respDelecao));

  // 7. Confirmar que o login falha após a exclusão
  await supabase.auth.signOut({ scope: 'local' });
  const { error: reloginError } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  assert.ok(reloginError, 'Login deveria falhar após a exclusão definitiva da conta');
  console.log(`7. Bloqueio de login pós-exclusão PASSOU (${reloginError.code ?? reloginError.message}).`);

  // Saída estruturada (sem segredos) para auditoria administrativa no banco
  console.log(
    'AUDITORIA_JSON=' +
      JSON.stringify({
        userId,
        objetosIds: [objEntregaId, objDuvidaId, objSuporteId, objOrfaoId],
      }),
  );
}

executar().catch((err) => {
  console.error('FALHA NA VALIDAÇÃO:', err);
  process.exitCode = 1;
});
