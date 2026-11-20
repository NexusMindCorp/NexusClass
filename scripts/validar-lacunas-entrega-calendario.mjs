import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { expect } from '@playwright/test';
import { chromium } from 'playwright';

const ref = process.argv[2];
const somenteInterface = process.argv[3] === '--somente-interface';
const somenteCalendario = process.argv[3] === '--somente-calendario-api';
assert.ok(process.argv.length === 3 || (process.argv.length === 4 && (somenteInterface || somenteCalendario)));
const url = process.env.NEXUS_TEST_SUPABASE_URL;
assert.match(ref ?? '', /^[a-z0-9]{20}$/);
assert.equal(url, `https://${ref}.supabase.co`);
assert.equal(url, new URL(process.env.VITE_SUPABASE_URL).origin);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, process.env.NEXUS_TEST_SUPABASE_SERVICE_ROLE_KEY, options);
const clientes = [];
const titulo = `Teste Fase 6 ${randomUUID()}`;

async function dados(operacao, etapa) {
  const { data, error } = await operacao;
  assert.ok(!error, `${etapa} falhou (${error?.code ?? error?.statusCode ?? 'API'})`);
  return data;
}

async function entrar(nome) {
  const cliente = createClient(url, process.env.VITE_SUPABASE_ANON_KEY, options);
  const { user } = await dados(cliente.auth.signInWithPassword({
    email: process.env[`NEXUS_TEST_${nome}_EMAIL`], password: process.env[`NEXUS_TEST_${nome}_SENHA`],
  }), `Login ${nome}`);
  clientes.push(cliente);
  return { cliente, id: user.id };
}

async function arquivoAvaliado(aluno, professor) {
  const { id_turma } = await dados(professor.cliente.from('turma').select('id_turma')
    .eq('codigo_acesso', 'DCC000').single(), 'Turma de teste');
  const { id_atividade } = await dados(professor.cliente.from('atividade').insert({
    titulo, descricao: 'Atividade descartável', id_turma, id_professor: professor.id,
    data_entrega: new Date(Date.now() + 86_400_000).toISOString(),
  }).select('id_atividade').single(), 'Publicação da atividade');
  const bucket = aluno.cliente.storage.from('entregas_atividades');
  const caminho = `${id_atividade}/${aluno.id}/teste.txt`;
  const arquivo = (conteudo) => new Blob([conteudo], { type: 'text/plain' });
  let enviado = false;
  try {
    const objeto = await dados(bucket.upload(caminho, arquivo(titulo)), 'Envio inicial');
    enviado = true;
    const { id_entrega } = await dados(aluno.cliente.from('entrega_atividade').insert({
      id_aluno: aluno.id, id_atividade, id_objeto_storage: objeto.id,
    }).select('id_entrega').single(), 'Registro da entrega');
    await dados(professor.cliente.from('entrega_atividade').update({ nota: 80, feedback: 'Avaliação de teste' })
      .eq('id_entrega', id_entrega).select('id_entrega').single(), 'Avaliação');

    const conferirArquivo = async () => {
      const atual = await dados(bucket.download(caminho), 'Download da entrega avaliada');
      assert.equal(await atual.text(), titulo, 'Conteúdo do arquivo avaliado');
    };
    await conferirArquivo();
    const edicao = await bucket.update(caminho, arquivo('Alteração durante o teste'));
    console.log(`Atualização de arquivo: ${edicao.error ? 'recusada' : 'API retornou sucesso'}.`);
    await conferirArquivo();
    const exclusao = await bucket.remove([caminho]);
    console.log(`Exclusão de arquivo: ${exclusao.error ? 'recusada' : `${exclusao.data?.length ?? 0} objeto(s) removido(s)`}.`);
    await conferirArquivo();
    assert.ok(edicao.error && (exclusao.error || exclusao.data?.length === 0));
    const entrega = await dados(aluno.cliente.from('entrega_atividade').select('id_objeto_storage,nota')
      .eq('id_entrega', id_entrega).single(), 'Conferência da entrega');
    assert.deepEqual(entrega, { id_objeto_storage: objeto.id, nota: 80 });
    console.log('Arquivo avaliado PASSOU (conteúdo, vínculo e nota preservados).');
  } finally {
    await dados(admin.from('atividade').delete().eq('id_atividade', id_atividade), 'Limpeza da atividade');
    if (enviado) {
      await dados(admin.storage.from('entregas_atividades').remove([caminho]), 'Limpeza do arquivo descartável');
    }
  }
}

async function dataPassada(aluno) {
  const formatarData = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' });
  const agora = Date.now();
  const hoje = formatarData.format(agora);
  const ontem = formatarData.format(agora - 86_400_000);
  const amanha = formatarData.format(agora + 86_400_000);
  const eventos = () => aluno.cliente.from('evento_calendario');
  const criar = (data) => eventos().insert({
    titulo, data, horario: '12:00', tipo: 'pessoal', id_autor: aluno.id,
  }).select('id_evento,data').single();
  const limpar = (id) => dados(eventos().delete().eq('id_evento', id)
    .select('id_evento').single(), 'Limpeza do evento descartável');
  const conferirRecusa = (error, etapa) => {
    assert.equal(error?.code, '23514', etapa);
    assert.equal(error.message, 'A data do evento não pode ser anterior a hoje.', etapa);
  };

  const passado = await criar(ontem);
  if (!passado.error) {
    await limpar(passado.data.id_evento);
    throw new Error('Data passada FALHOU: criação em data anterior a hoje aceita.');
  }
  conferirRecusa(passado.error, 'Criação em data passada');
  const evento = await dados(criar(hoje), 'Criação de evento para hoje');
  assert.equal(evento.data, hoje);
  try {
    const reagendar = (data) => eventos().update({ data }).eq('id_evento', evento.id_evento)
      .select('data').single();
    const alterado = await dados(reagendar(amanha), 'Reagendamento para amanhã');
    assert.equal(alterado.data, amanha);
    conferirRecusa((await reagendar(ontem)).error, 'Reagendamento em data passada');
    const preservado = await dados(eventos().select('data').eq('id_evento', evento.id_evento)
      .single(), 'Conferência após recusa');
    assert.equal(preservado.data, amanha);
    console.log('Calendário API PASSOU (hoje e amanhã aceitos, ontem recusado na criação e no reagendamento).');
  } finally {
    await limpar(evento.id_evento);
  }
}

async function dataPassadaNaInterface() {
  const browser = await chromium.launch({ channel: 'msedge' });
  let etapa = 'login';
  try {
    const pagina = await browser.newPage({ locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
    await pagina.goto('http://localhost:5173/NexusClassWeb/', { waitUntil: 'domcontentloaded' });
    await pagina.getByPlaceholder('seu@email.com').fill(process.env.NEXUS_TEST_ALUNO_DCC000_EMAIL);
    await pagina.getByPlaceholder('Sua senha').fill(process.env.NEXUS_TEST_ALUNO_DCC000_SENHA);
    await pagina.getByRole('button', { name: 'Entrar', exact: true }).click();
    etapa = 'seleção de hoje e ontem';
    await pagina.getByRole('link', { name: 'Calendario', exact: true }).click();
    const [hoje, ontem] = await pagina.evaluate(() => {
      const hoje = new Date();
      const ontem = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1);
      return [hoje.toLocaleDateString(), ontem.toLocaleDateString()];
    });
    await pagina.locator(`button[data-day="${hoje}"]`).click();
    await expect(pagina.getByLabel('Título do evento')).toBeVisible();
    await pagina.locator(`button[data-day="${ontem}"]`).click();
    await expect(pagina.getByLabel('Título do evento')).toHaveCount(0);
    await expect(pagina.getByText('Selecione um dia no calendário para adicionar um evento.')).toBeVisible();
    console.log('Data passada no Edge PASSOU (hoje mostra formulário, ontem não).');
  } catch {
    throw new Error(`Data passada no Edge falhou na etapa: ${etapa}.`);
  } finally {
    await browser.close();
  }
}

try {
  const operacoes = [];
  if (!somenteCalendario) operacoes.push(dataPassadaNaInterface());
  if (somenteCalendario) {
    operacoes.push(entrar('ALUNO_DCC000').then(dataPassada));
  } else if (!somenteInterface) {
    const sessoes = Promise.all([entrar('ALUNO_DCC000'), entrar('PROFESSOR_DCC000')]);
    operacoes.push(
      sessoes.then(([aluno, professor]) => arquivoAvaliado(aluno, professor)),
      sessoes.then(([aluno]) => dataPassada(aluno)),
    );
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
