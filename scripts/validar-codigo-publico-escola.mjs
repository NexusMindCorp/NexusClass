import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const codigoEscola1 = process.argv[2]?.trim().toUpperCase();

assert.ok(url, 'VITE_SUPABASE_URL ausente no ambiente');
assert.ok(anonKey, 'VITE_SUPABASE_ANON_KEY ausente no ambiente');
assert.match(codigoEscola1 ?? '', /^ESC-[A-Z0-9]{8}$/, 'Informe o código público válido (ESC-XXXXXXXX) da escola 1 como argumento');

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const clienteAnon = createClient(url, anonKey, options);

async function executar() {
  const chave = randomUUID();
  const senha = `Nx!8${randomBytes(24).toString('base64url')}`;
  const nome = `Teste Codigo Escola ${chave.slice(0, 8)}`;

  // 1. anon NÃO pode consultar codigo_publico nem chamar a RPC
  const { error: erroSelectAnon } = await clienteAnon
    .from('escola')
    .select('id_escola, codigo_publico')
    .limit(1);
  assert.equal(erroSelectAnon?.code, '42501', `Esperado 42501 para SELECT codigo_publico por anon, recebido ${erroSelectAnon?.code ?? erroSelectAnon?.message}`);
  console.log(`1. Bloqueio de SELECT codigo_publico para anon PASSOU (${erroSelectAnon.code}).`);

  const { error: erroRpcAnon } = await clienteAnon.rpc('obter_codigo_publico_minha_escola');
  assert.equal(erroRpcAnon?.code, '42501', `Esperado 42501 para RPC por anon, recebido ${erroRpcAnon?.code ?? erroRpcAnon?.message}`);
  console.log(`2. Bloqueio da RPC para anon PASSOU (${erroRpcAnon.code}).`);

  // 2. anon ainda pode ler o catálogo básico sem codigo_publico
  const { data: escolasBasicas, error: erroBasico } = await clienteAnon
    .from('escola')
    .select('id_escola, nome, ano_letivo')
    .order('id_escola');
  assert.ok(!erroBasico && escolasBasicas?.length >= 3, 'Leitura básica do catálogo de escolas deve continuar funcionando');
  console.log(`3. Leitura básica de escola (sem codigo_publico) PASSOU (${escolasBasicas.length} escolas).`);

  // 3. Cadastro com código público inexistente deve ser recusado
  const { error: erroInvalido } = await clienteAnon.auth.signUp({
    email: `codigo-invalido-${chave}@example.com`,
    password: senha,
    options: { data: { nome, codigo_escola: 'ESC-ZZZZ9999' } },
  });
  assert.ok(erroInvalido, 'Código público inexistente deveria ser recusado');
  console.log(`4. Recusa de código público inexistente PASSOU (${erroInvalido.code ?? erroInvalido.message}).`);

  // 4. Cadastro enviando apenas id_escola numérico (sem codigo_escola) deve ser recusado
  const { error: erroNumerico } = await clienteAnon.auth.signUp({
    email: `codigo-numerico-${chave}@example.com`,
    password: senha,
    options: { data: { nome, id_escola: 1 } },
  });
  assert.ok(erroNumerico, 'id_escola numérico puro deveria ser recusado sem codigo_escola');
  console.log(`5. Recusa de id_escola numérico puro PASSOU (${erroNumerico.code ?? erroNumerico.message}).`);

  // 5. Cadastro com código público válido (em minúsculas + espaços para testar normalização)
  const emailValido = `codigo-valido-${chave}@example.com`;
  const clienteAluno = createClient(url, anonKey, options);
  const { data: signUpData, error: erroValido } = await clienteAluno.auth.signUp({
    email: emailValido,
    password: senha,
    options: { data: { nome, codigo_escola: `  ${codigoEscola1.toLowerCase()}  ` } },
  });
  assert.ok(!erroValido, `Cadastro válido falhou: ${erroValido?.message}`);
  const userId = signUpData.user?.id;
  const accessToken = signUpData.session?.access_token;
  assert.ok(userId && accessToken, 'Sessão e userId devem ser criados no cadastro válido');

  try {
    // 6. Conferir perfil criado na escola 1 como aluno
    const { data: perfil, error: erroPerfil } = await clienteAluno
      .from('perfil')
      .select('id_perfil, role, id_escola')
      .eq('id_perfil', userId)
      .single();
    assert.ok(!erroPerfil, `Leitura do perfil falhou: ${erroPerfil?.message}`);
    assert.deepEqual(perfil, { id_perfil: userId, role: 'aluno', id_escola: 1 });
    console.log('6. Cadastro por código público válido PASSOU (papel aluno, escola 1).');

    // 7. authenticated NÃO pode ler escola.codigo_publico diretamente (evita vazar de outras escolas)
    const { error: erroSelectAuth } = await clienteAluno
      .from('escola')
      .select('id_escola, codigo_publico');
    assert.equal(erroSelectAuth?.code, '42501', `Esperado 42501 para SELECT codigo_publico por authenticated, recebido ${erroSelectAuth?.code ?? erroSelectAuth?.message}`);
    console.log(`7. Bloqueio de SELECT direto em codigo_publico para authenticated PASSOU (${erroSelectAuth.code}).`);

    // 8. authenticated consegue ler SOMENTE o código da própria escola via RPC
    const { data: codigoRetornado, error: erroRpcAuth } = await clienteAluno.rpc(
      'obter_codigo_publico_minha_escola',
    );
    assert.ok(!erroRpcAuth, `RPC falhou para authenticated: ${erroRpcAuth?.message}`);
    assert.equal(codigoRetornado, codigoEscola1, 'RPC deve retornar exatamente o código da escola 1');
    console.log('8. RPC obter_codigo_publico_minha_escola PASSOU (retornou apenas o código da própria escola).');

    // 9. Isolamento entre escolas: aceita matrícula na DCC001 (escola 1) e recusa MAT101 (escola 3)
    const { data: turmas, error: erroTurmas } = await clienteAluno
      .from('turma')
      .select('id_turma, codigo_acesso, id_escola')
      .in('codigo_acesso', ['DCC001', 'MAT101']);
    assert.ok(!erroTurmas && turmas?.length === 2, 'Turmas DCC001 e MAT101 devem existir');
    const dcc001 = turmas.find((t) => t.codigo_acesso === 'DCC001');
    const mat101 = turmas.find((t) => t.codigo_acesso === 'MAT101');

    const { error: erroMatLocal } = await clienteAluno.from('aluno_turma').insert({
      id_aluno: userId,
      id_turma: dcc001.id_turma,
      situacao: 'ativa',
    });
    assert.ok(!erroMatLocal, `Matrícula na escola 1 deveria passar: ${erroMatLocal?.message}`);

    const { error: erroMatExterna } = await clienteAluno.from('aluno_turma').insert({
      id_aluno: userId,
      id_turma: mat101.id_turma,
      situacao: 'ativa',
    });
    assert.ok(erroMatExterna, 'Matrícula em turma de outra escola deveria ser recusada');
    console.log(`9. Isolamento entre escolas PASSOU (DCC001 aceita; MAT101 recusada com ${erroMatExterna.code}).`);
  } finally {
    // Limpa conta descartável via Edge Function oficial deletar-conta
    const { error: erroDelete } = await clienteAluno.functions.invoke('deletar-conta', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.ok(!erroDelete, `Limpeza da conta descartável falhou: ${erroDelete?.message}`);
    console.log('10. Conta descartável removida com sucesso via deletar-conta (0 resíduos).');
  }
}

executar().catch((err) => {
  console.error('FALHA NA VALIDAÇÃO:', err);
  process.exitCode = 1;
});
