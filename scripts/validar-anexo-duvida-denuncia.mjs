import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { expect } from '@playwright/test';
import { chromium } from 'playwright';

const ref = process.argv[2];
const somenteDenuncia = process.argv[3] === '--somente-denuncia';
assert.ok(process.argv.length === 3 || (process.argv.length === 4 && somenteDenuncia));
const url = process.env.NEXUS_TEST_SUPABASE_URL;
assert.match(ref ?? '', /^[a-z0-9]{20}$/);
assert.equal(url, `https://${ref}.supabase.co`);
assert.equal(url, new URL(process.env.VITE_SUPABASE_URL).origin);
const marcador = `Teste Fase 6 ${randomUUID()}`;
const clientes = [];
const email = (nome) => process.env[`NEXUS_TEST_${nome}_EMAIL`];
const senha = (nome) => process.env[`NEXUS_TEST_${nome}_SENHA`];

async function dados(operacao, etapa) {
  const { data, error } = await operacao;
  assert.ok(!error, `${etapa} falhou (${error?.code ?? error?.status ?? error?.statusCode ?? 'API'})`);
  return data;
}

async function entrar(nome) {
  const cliente = createClient(url, process.env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { user } = await dados(cliente.auth.signInWithPassword({
    email: email(nome), password: senha(nome),
  }), `Login ${nome}`);
  clientes.push(cliente);
  return { cliente, id: user.id };
}

async function validarAnexo(aluno, professor, controle, master) {
  const { id_turma } = await dados(aluno.cliente.from('turma').select('id_turma')
    .eq('codigo_acesso', 'DCC000').single(), 'Consulta de turma');
  const { id_duvida } = await dados(aluno.cliente.from('duvida').insert({
    id_turma, id_aluno: aluno.id, id_professor: professor.id,
    assunto: marcador, descricao: 'Dúvida descartável com anexo.',
  }).select('id_duvida').single(), 'Criação da dúvida');
  const pasta = `${id_turma}/${aluno.id}`;
  const arquivo = `teste-${randomUUID()}.txt`;
  const caminho = `${pasta}/${arquivo}`;
  const bucket = ({ cliente }) => cliente.storage.from('duvidasalunostoprofessor');
  const anexo = ({ cliente }) => cliente.from('duvida_anexo').select('id_anexo').eq('id_duvida', id_duvida);
  let enviado = false;
  try {
    const { id } = await dados(bucket(aluno).upload(caminho, new Blob([marcador], { type: 'text/plain' })),
      'Envio do anexo');
    enviado = true;
    await dados(aluno.cliente.from('duvida_anexo').insert({ id_duvida, id_objeto_storage: id }), 'Vínculo do anexo');
    assert.equal((await dados(anexo(professor), 'Vínculo para professor')).length, 1);
    const baixado = await dados(bucket(professor).download(caminho), 'Download pelo professor');
    assert.equal(await baixado.text(), marcador);
    assert.deepEqual(await dados(anexo(controle), 'Vínculo para controle'), []);
    const bloqueado = await bucket(controle).download(caminho);
    assert.ok(bloqueado.error && !bloqueado.data, 'Download do professor sem vínculo deveria ser bloqueado');
    console.log(`Anexo PASSOU (dúvida ${id_duvida}, leitura vinculada e isolamento).`);
  } finally {
    if (enviado) {
      const listar = () => dados(bucket(master).list(pasta, { search: arquivo }), 'Inventário do arquivo');
      assert.ok((await listar()).some(({ name }) => name === arquivo));
      await dados(bucket(aluno).remove([caminho]), 'Remoção do arquivo');
      assert.ok(!(await listar()).some(({ name }) => name === arquivo));
    }
    await dados(aluno.cliente.from('duvida').delete().eq('id_duvida', id_duvida)
      .select('id_duvida').single(), 'Remoção da dúvida');
    assert.deepEqual(await dados(anexo(master), 'Conferência do vínculo'), []);
    assert.deepEqual(await dados(master.cliente.from('duvida').select('id_duvida')
      .eq('id_duvida', id_duvida), 'Conferência da dúvida'), []);
    console.log(`Exclusão PASSOU (dúvida ${id_duvida}, arquivo e vínculo ausentes).`);
  }
}

async function validarDenuncia(aluno, professor, master) {
  const { nome } = await dados(master.cliente.from('perfil').select('nome')
    .eq('id_perfil', aluno.id).single(), 'Nome do aluno descartável');
  const browser = await chromium.launch({ channel: 'msedge' });
  let etapa = 'login';
  try {
    const pagina = await browser.newPage();
    pagina.setDefaultTimeout(10_000);
    const consultas = [];
    pagina.on('response', (resposta) => {
      const recurso = new URL(resposta.url()).pathname;
      if (recurso === '/rest/v1/aluno_turma') consultas.push(resposta.status());
    });
    await pagina.goto('http://localhost:5173/NexusClassWeb/', { waitUntil: 'domcontentloaded' });
    await pagina.getByPlaceholder('seu@email.com').fill(email('PROFESSOR_DCC000'));
    await pagina.getByPlaceholder('Sua senha').fill(senha('PROFESSOR_DCC000'));
    await pagina.getByRole('button', { name: 'Entrar', exact: true }).click();
    const atalho = pagina.getByRole('button', { name: /Banco de Dados - 2026\.3/ });
    await expect(atalho).toBeVisible({ timeout: 25_000 });
    etapa = 'abertura da lista de alunos';
    await atalho.click();
    await pagina.getByRole('button', { name: 'Alunos', exact: true }).click();
    etapa = 'localização do aluno descartável';
    const linha = pagina.getByRole('row').filter({ has: pagina.getByText(nome, { exact: true }) });
    try {
      await linha.hover();
    } catch {
      console.log(`Lista no navegador: ${await pagina.getByRole('row').count()} linha(s); consultas de matrícula: ${consultas.join(', ') || 'nenhuma'}.`);
      throw new Error('O aluno descartável não apareceu na lista.');
    }
    etapa = 'menu de ações do aluno';
    await linha.getByRole('button').click();
    await pagina.getByRole('menuitem', { name: 'Denunciar', exact: true }).click();
    etapa = 'envio e aviso de sucesso';
    await pagina.getByRole('button', { name: 'Outro', exact: true }).click();
    await pagina.getByPlaceholder('Descreva o que aconteceu, quando e onde...').fill(marcador);
    await pagina.getByRole('button', { name: 'Denunciar', exact: true }).click();
    await expect(pagina.getByText('Denúncia enviada com sucesso.', { exact: true })).toBeVisible();
    await expect(pagina.getByRole('heading', { name: `Denunciar ${nome}` })).toHaveCount(0);
    etapa = 'conferência da gravação';
    const { id_denuncia } = await dados(master.cliente.from('denuncia').select('id_denuncia')
      .eq('descricao', marcador).eq('id_autor', professor.id).eq('id_denunciado', aluno.id).single(),
    'Persistência da denúncia');
    console.log(`Denúncia visual PASSOU (registro ${id_denuncia}, confirmação e formulário fechado).`);
  } catch {
    throw new Error(`Denúncia visual falhou na etapa: ${etapa}.`);
  } finally {
    await browser.close();
  }
}

try {
  const [aluno, professor, master] = await Promise.all([
    entrar('ALUNO_DCC000'), entrar('PROFESSOR_DCC000'), entrar('MASTER'),
  ]);
  const operacoes = [validarDenuncia(aluno, professor, master)];
  if (!somenteDenuncia) {
    operacoes.push(entrar('PROFESSOR_SEM_VINCULO')
      .then((controle) => validarAnexo(aluno, professor, controle, master)));
  }
  const resultados = await Promise.allSettled(operacoes);
  for (const resultado of resultados) {
    if (resultado.status === 'rejected') {
      console.error(resultado.reason.message);
      process.exitCode = 1;
    }
  }
} finally {
  await Promise.allSettled(clientes.map((cliente) => cliente.auth.signOut({ scope: 'local' })));
}
