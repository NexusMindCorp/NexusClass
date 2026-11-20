import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

test('retoma uma instalação parcial e rejeita conta sem marcador administrativo', async (t) => {
  const ref = 'a'.repeat(20);
  const chaves = ['ALUNO_DCC000', 'PROFESSOR_DCC000', 'PROFESSOR_SEM_VINCULO', 'ALUNO_MAT101', 'MASTER'];
  process.env.NEXUS_TEST_SUPABASE_URL = `https://${ref}.supabase.co`;
  process.env.NEXUS_TEST_SUPABASE_SERVICE_ROLE_KEY = 'simulada';
  for (const chave of chaves) {
    process.env[`NEXUS_TEST_${chave}_EMAIL`] = `${chave.toLowerCase()}@example.test`;
    process.env[`NEXUS_TEST_${chave}_SENHA`] = 'senha-simulada';
  }
  process.argv = ['node', 'script', '--aplicar', ref];
  const usuarios = new Map();
  const perfis = new Map();
  const vinculos = new Map();
  let falharMatricula = true;
  let cadastros = 0;

  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const url = new URL(input);
    assert.equal(url.host, `${ref}.supabase.co`);
    const recurso = url.pathname.split('/').at(-1);
    const corpo = init.body && JSON.parse(init.body);
    const filtro = (campo) => url.searchParams.get(campo)?.slice(3);
    if (recurso === 'users' && init.method === 'POST') {
      cadastros++;
      const id = randomUUID();
      const user = { id, email: corpo.email, app_metadata: corpo.app_metadata };
      usuarios.set(id, user);
      perfis.set(id, { id_perfil: id, role: 'aluno', id_escola: corpo.user_metadata.id_escola, email: corpo.email });
      return Response.json({ user });
    }
    if (url.pathname.startsWith('/auth/v1/admin/users/')) {
      return Response.json({ user: usuarios.get(recurso) });
    }
    if (recurso === 'turma') {
      return Response.json([
        { codigo_acesso: 'DCC000', id_turma: 26, id_escola: 1 },
        { codigo_acesso: 'MAT101', id_turma: 4, id_escola: 3 },
      ]);
    }
    if (recurso === 'perfil') {
      const perfil = perfis.get(filtro('id_perfil'));
      if (init.method === 'PATCH') Object.assign(perfil, corpo);
      return Response.json(perfil ?? [...perfis.values()].filter(({ email }) => email === filtro('email')));
    }
    if (recurso === 'aluno_turma' || recurso === 'professor_turma') {
      if (init.method === 'GET') return Response.json([]);
      if (falharMatricula) {
        falharMatricula = false;
        return Response.json({ code: 'falha_simulada' }, { status: 400 });
      }
      vinculos.set(corpo.id_aluno ?? corpo.id_professor, corpo.id_turma);
      return Response.json(null);
    }
    assert.fail('Rota inesperada');
  });

  try {
    await import('./provisionar-contas-teste.mjs?falha');
    assert.equal(process.exitCode, 1);
    assert.equal(cadastros, 1);
    process.exitCode = 0;
    await import('./provisionar-contas-teste.mjs?retomada');
    assert.equal(process.exitCode, 0);
    await import('./provisionar-contas-teste.mjs?reexecucao');
    assert.equal(process.exitCode, 0);
    assert.equal(cadastros, 5);
    assert.deepEqual([...perfis.values()].map(({ role, id_escola }) => [role, id_escola]), [
      ['aluno', 1], ['professor', 1], ['professor', 1], ['aluno', 3], ['master', null],
    ]);
    assert.deepEqual([...vinculos.values()], [26, 26, 4]);
    usuarios.values().next().value.app_metadata = {};
    await import('./provisionar-contas-teste.mjs?colisao');
    assert.equal(process.exitCode, 1);
    assert.equal(cadastros, 5);
  } finally {
    process.exitCode = 0;
  }
});
