import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as esperar } from 'node:timers/promises';
import { createClient } from '@supabase/supabase-js';

const ref = process.argv[2];
const somenteCalendario = process.argv[3] === '--somente-calendario';
assert.ok(process.argv.length === 3 || (process.argv.length === 4 && somenteCalendario),
  'Uso: validar-calendario-comunicacao.mjs REF [--somente-calendario]');
const url = process.env.NEXUS_TEST_SUPABASE_URL;
assert.match(ref ?? '', /^[a-z0-9]{20}$/);
assert.equal(url, `https://${ref}.supabase.co`);
assert.equal(url, new URL(process.env.VITE_SUPABASE_URL).origin);
const chave = process.env.VITE_SUPABASE_ANON_KEY;
assert.ok(chave, 'Chave pública ausente');
const auditor = createClient(url, process.env.NEXUS_TEST_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const marcador = `Teste Fase 6 ${randomUUID()}`;
const clientes = [];

async function dados(operacao, etapa) {
  const { data, error } = await operacao;
  assert.ok(!error, `${etapa}: ${error?.code ?? error?.status ?? 'erro da API'}`);
  return data;
}

async function entrar(nome) {
  const cliente = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
  const { user } = await dados(cliente.auth.signInWithPassword({
    email: process.env[`NEXUS_TEST_${nome}_EMAIL`],
    password: process.env[`NEXUS_TEST_${nome}_SENHA`],
  }), `Login ${nome}`);
  clientes.push(cliente);
  return { cliente, id: user.id };
}

async function comunicacao(aluno, professor, outro, master) {
  const mensagem = await dados(aluno.cliente.from('mensagem').insert({
    conteudo: marcador, id_remetente: aluno.id, id_destinatario: professor.id,
  }).select('id_mensagem').single(), 'Envio da mensagem');
  const denuncia = await dados(aluno.cliente.from('denuncia').insert({
    motivo: marcador, descricao: 'Cenário automatizado entre contas descartáveis',
    id_autor: aluno.id, id_denunciado: professor.id,
  }).select('id_denuncia,status').single(), 'Registro da denúncia');
  assert.equal(denuncia.status, 'pendente');
  const lerMensagem = ({ cliente }) => dados(cliente.from('mensagem').select('conteudo')
    .eq('id_mensagem', mensagem.id_mensagem), 'Leitura da mensagem');
  const lerDenuncia = ({ cliente }) => dados(cliente.from('denuncia').select('status')
    .eq('id_denuncia', denuncia.id_denuncia), 'Leitura da denúncia');
  const [recebida, externa, moderacao, denunciado, outraEscola] = await Promise.all([
    lerMensagem(professor), lerMensagem(outro), lerDenuncia(master), lerDenuncia(professor), lerDenuncia(outro),
  ]);
  assert.deepEqual(recebida, [{ conteudo: marcador }]);
  assert.deepEqual(externa, []);
  assert.deepEqual(moderacao, [{ status: 'pendente' }]);
  assert.deepEqual(denunciado, []);
  assert.deepEqual(outraEscola, []);
  console.log(`Comunicação PASSOU (mensagem ${mensagem.id_mensagem}, denúncia ${denuncia.id_denuncia}).`);
}

function horarioCivil(instante) {
  const partes = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium',
  }).formatToParts(instante);
  const campos = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  return { data: `${campos.year}-${campos.month}-${campos.day}`, horario: `${campos.hour}:${campos.minute}:${campos.second}` };
}

async function calendario(professor, aluno) {
  const turma = await dados(professor.cliente.from('turma').select('id_turma')
    .eq('codigo_acesso', 'DCC000').single(), 'Turma do evento');
  const minuto = 60_000;
  const primeiroCron = Math.ceil((Date.now() + 10_000) / minuto) * minuto;
  const primeiroEvento = primeiroCron + 5 * minuto + 15_000;
  const segundoEvento = primeiroEvento + minuto;
  const evento = await dados(professor.cliente.from('evento_calendario').insert({
    titulo: marcador, tipo: 'turma', id_autor: professor.id, id_turma: turma.id_turma,
    ...horarioCivil(primeiroEvento),
  }).select('id_evento').single(), 'Criação de evento');
  const id = evento.id_evento;
  const listarAlertas = () => dados(aluno.cliente.from('alerta_calendario')
    .select('minutos_antes,lembrete_para').eq('id_evento', id), 'Leitura dos alertas');
  const primeiro = primeiroEvento - 5 * minuto;
  const segundo = segundoEvento - 5 * minuto;
  const conta = (alertas, instante) => alertas.filter(({ minutos_antes, lembrete_para }) =>
    minutos_antes === 5 && Date.parse(lembrete_para) === instante).length;
  const ate = async (prazo, instante) => {
    let alertas = await listarAlertas();
    while (!conta(alertas, instante) && Date.now() < prazo) {
      await esperar(2500);
      alertas = await listarAlertas();
    }
    return alertas;
  };

  try {
    const inicial = await ate(primeiroCron + 20_000, primeiro);
    assert.equal(conta(inicial, primeiro), 1, 'Lembrete inicial');
    await dados(professor.cliente.from('evento_calendario').update(horarioCivil(segundoEvento))
      .eq('id_evento', id).select('id_evento').single(), 'Reagendamento');
    assert.equal(conta(await listarAlertas(), primeiro), 0, 'Invalidação imediata do lembrete antigo');
    const final = await ate(primeiroCron + minuto + 22_000, segundo);
    console.log(`Calendário evento ${id}: antigo=${conta(final, primeiro)}, novo=${conta(final, segundo)}.`);
    assert.equal(conta(final, segundo), 1, 'Novo lembrete de 5 minutos após reagendamento');
    assert.equal(conta(final, primeiro), 0, 'Lembrete do horário antigo');
  } finally {
    const antes = await listarAlertas();
    await dados(professor.cliente.from('evento_calendario').delete().eq('id_evento', id)
      .select('id_evento').single(), 'Remoção do evento descartável');
    const depois = await dados(auditor.from('alerta_calendario').select('id_alerta')
      .eq('id_evento', id), 'Conferência administrativa da cascata');
    assert.deepEqual(depois, []);
    console.log(`Calendário evento ${id}: removido com ${antes.length} alerta(s) antes e zero depois.`);
  }
}

try {
  const [aluno, professor] = await Promise.all([entrar('ALUNO_DCC000'), entrar('PROFESSOR_DCC000')]);
  const operacoes = [calendario(professor, aluno)];
  if (!somenteCalendario) {
    operacoes.push(Promise.all([entrar('ALUNO_MAT101'), entrar('MASTER')])
      .then(([outro, master]) => comunicacao(aluno, professor, outro, master)));
  }
  const resultados = await Promise.allSettled(operacoes);
  for (const resultado of resultados) {
    if (resultado.status === 'fulfilled') continue;
    console.error(resultado.reason.message);
    process.exitCode = 1;
  }
} finally {
  await Promise.allSettled(clientes.map((cliente) => cliente.auth.signOut({ scope: 'local' })));
}
