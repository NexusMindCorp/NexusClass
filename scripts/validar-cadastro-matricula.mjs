import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const ref = process.argv[2];
const url = process.env.NEXUS_TEST_SUPABASE_URL;
assert.match(ref ?? '', /^[a-z0-9]{20}$/);
assert.equal(url, `https://${ref}.supabase.co`);
assert.equal(url, new URL(process.env.VITE_SUPABASE_URL).origin);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const clientePublico = () => createClient(url, process.env.VITE_SUPABASE_ANON_KEY, options);
const leitor = createClient(url, process.env.NEXUS_TEST_SUPABASE_SERVICE_ROLE_KEY, options);
const sessoes = [];

async function dados(operacao, etapa) {
  const { data, error } = await operacao;
  assert.ok(!error, `${etapa} falhou (${error?.code ?? error?.status ?? 'API'})`);
  return data;
}

async function validarCadastro(escola) {
  const chave = randomUUID();
  const nome = `Teste cadastro ${chave}`;
  const senha = `Nx!7${randomBytes(24).toString('base64url')}`;
  const emailValido = `nexusclass-${chave}@example.com`;
  const emailInvalido = `nexusclass-invalido-${chave}@example.com`;
  const inexistente = 2147483647;
  const perfil = (email) => leitor.from('perfil').select('id_perfil,role,nome,id_escola').eq('email', email);
  assert.deepEqual(await dados(leitor.from('escola').select('id_escola')
    .eq('id_escola', inexistente), 'Controle de escola inexistente'), []);

  const publico = clientePublico();
  sessoes.push(publico);
  const cadastro = (email, id_escola) => publico.auth.signUp({
    email, password: senha, options: { data: { nome, id_escola } },
  });
  const { user, session } = await dados(cadastro(emailValido, escola), 'Cadastro público válido');
  assert.ok(user?.id, 'O Auth deve retornar o usuário');
  const [linha] = await dados(perfil(emailValido), 'Perfil criado');
  assert.deepEqual(linha, { id_perfil: user.id, role: 'aluno', nome, id_escola: escola });
  const auth = await dados(leitor.auth.admin.getUserById(user.id), 'Conferência do Auth');
  assert.equal(Boolean(auth.user.email_confirmed_at), Boolean(session));
  if (!session) {
    const { error } = await publico.auth.signInWithPassword({ email: emailValido, password: senha });
    assert.equal(error?.code, 'email_not_confirmed');
  }
  console.log(`Cadastro válido PASSOU (papel aluno, escola ${escola}, ${session ? 'sessão imediata' : 'confirmação exigida'}).`);

  const { error } = await cadastro(emailInvalido, inexistente);
  assert.equal(error?.code, 'unexpected_failure', 'A escola inexistente deve ser recusada na criação do perfil');
  assert.deepEqual(await dados(perfil(emailInvalido), 'Ausência do perfil inválido'), []);
  console.log('Cadastro inválido PASSOU (escola inexistente recusada, sem perfil).');
}

async function validarMatricula(local, externa) {
  const aluno = clientePublico();
  sessoes.push(aluno);
  const { user } = await dados(aluno.auth.signInWithPassword({
    email: process.env.NEXUS_TEST_ALUNO_DCC000_EMAIL,
    password: process.env.NEXUS_TEST_ALUNO_DCC000_SENHA,
  }), 'Login do aluno');
  const { id_escola } = await dados(aluno.from('perfil').select('id_escola').eq('id_perfil', user.id)
    .single(), 'Escola do aluno');
  assert.equal(local.id_escola, id_escola);
  assert.notEqual(externa.id_escola, id_escola);

  const listar = (turma) => dados(aluno.from('aluno_turma').select('situacao')
    .eq('id_aluno', user.id).eq('id_turma', turma.id_turma), 'Conferência da matrícula');
  const inscrever = (turma) => aluno.from('aluno_turma').upsert({
    id_aluno: user.id, id_turma: turma.id_turma, situacao: 'ativa',
  }, { onConflict: 'id_aluno,id_turma' });
  const cancelar = (turma) => dados(aluno.from('aluno_turma').delete()
    .eq('id_aluno', user.id).eq('id_turma', turma.id_turma), 'Cancelamento da matrícula');
  assert.deepEqual(await listar(local), [], 'A turma de teste deve iniciar sem matrícula');
  assert.deepEqual(await listar(externa), [], 'A turma externa deve iniciar sem matrícula');
  try {
    await dados(inscrever(local), 'Inscrição');
    assert.deepEqual(await listar(local), [{ situacao: 'ativa' }]);
    await dados(inscrever(local), 'Repetição de inscrição');
    assert.deepEqual(await listar(local), [{ situacao: 'ativa' }]);
    console.log('Inscrição e repetição PASSARAM (um vínculo ativo).');
  } finally {
    await cancelar(local);
    assert.deepEqual(await listar(local), []);
    console.log('Cancelamento PASSOU (vínculo removido).');
  }
  const { error } = await inscrever(externa);
  if (!error) await cancelar(externa);
  assert.ok(error && ['42501', '23514', 'P0001'].includes(error.code),
    'A matrícula de outra escola deve ser recusada por política ou integridade');
  assert.deepEqual(await listar(externa), []);
  console.log(`Matrícula entre escolas PASSOU (recusada com ${error.code}).`);
}

try {
  const turmas = await dados(leitor.from('turma').select('codigo_acesso,id_turma,id_escola')
    .in('codigo_acesso', ['DCC001', 'MAT101']), 'Inventário das turmas');
  const local = turmas.find(({ codigo_acesso }) => codigo_acesso === 'DCC001');
  const externa = turmas.find(({ codigo_acesso }) => codigo_acesso === 'MAT101');
  assert.ok(local && externa, 'Turmas de teste ausentes');
  const resultados = await Promise.allSettled([
    validarCadastro(local.id_escola), validarMatricula(local, externa),
  ]);
  for (const resultado of resultados) {
    if (resultado.status === 'rejected') {
      console.error(resultado.reason.message);
      process.exitCode = 1;
    }
  }
} finally {
  await Promise.allSettled(sessoes.map((cliente) => cliente.auth.signOut({ scope: 'local' })));
}
