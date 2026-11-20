import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const ref = process.argv[2];
const url = process.env.NEXUS_TEST_SUPABASE_URL;
assert.match(ref ?? '', /^[a-z0-9]{20}$/);
assert.equal(url, `https://${ref}.supabase.co`);
assert.equal(url, new URL(process.env.VITE_SUPABASE_URL).origin);
const marcador = `Teste Fase 6 ${randomUUID()}`;
const clientes = [];

async function dados(operacao, etapa) {
  const { data, error } = await operacao;
  assert.ok(!error, `${etapa} falhou (${error?.code ?? error?.status ?? 'API'})`);
  return data;
}

async function entrar(nome) {
  const cliente = createClient(url, process.env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { user } = await dados(cliente.auth.signInWithPassword({
    email: process.env[`NEXUS_TEST_${nome}_EMAIL`],
    password: process.env[`NEXUS_TEST_${nome}_SENHA`],
  }), `Login ${nome}`);
  clientes.push(cliente);
  return { cliente, id: user.id };
}

async function validarMensagem(aluno, professor) {
  let receber;
  const recebida = new Promise((resolve) => { receber = resolve; });
  const canal = professor.cliente.channel(marcador).on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'mensagem', filter: `id_destinatario=eq.${professor.id}`,
  }, ({ new: mensagem }) => {
    if (mensagem.conteudo === marcador) receber(mensagem.id_mensagem);
  });
  let prazo;
  let fase = 'assinatura';
  const limite = new Promise((_, reject) => {
    prazo = setTimeout(() => reject(new Error(`Realtime excedeu o prazo de ${fase}`)), 20_000);
  });
  try {
    await Promise.race([limite, new Promise((resolve, reject) => {
      canal.subscribe((estado) => {
        if (estado === 'SUBSCRIBED') resolve();
        if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT') reject(new Error(`Realtime ${estado}`));
      });
    })]);
    fase = 'recebimento';
    const mensagem = await Promise.race([limite, dados(aluno.cliente.from('mensagem').insert({
      conteudo: marcador, id_remetente: aluno.id, id_destinatario: professor.id,
    }).select('id_mensagem').single(), 'Envio da mensagem')]);
    assert.equal(await Promise.race([limite, recebida]), mensagem.id_mensagem);
    console.log(`Realtime PASSOU (mensagem ${mensagem.id_mensagem}).`);
  } finally {
    clearTimeout(prazo);
    await professor.cliente.removeAllChannels();
  }
}

async function validarDuvida(aluno, professor) {
  const turma = await dados(aluno.cliente.from('turma').select('id_turma')
    .eq('codigo_acesso', 'DCC000').single(), 'Leitura da turma');
  const { id_duvida: id } = await dados(aluno.cliente.from('duvida').insert({
    assunto: marcador, descricao: 'Dúvida descartável', id_turma: turma.id_turma,
    id_aluno: aluno.id, id_professor: professor.id,
  }).select('id_duvida').single(), 'Criação da dúvida');
  const resposta = 'Resposta de teste do professor vinculado.';
  await dados(professor.cliente.from('duvida').update({ resposta, resolveu: true })
    .eq('id_duvida', id).select('id_duvida').single(), 'Resposta docente');
  assert.deepEqual(await dados(aluno.cliente.from('duvida').select('resposta,resolveu')
    .eq('id_duvida', id).single(), 'Leitura da resposta'), { resposta, resolveu: true });
  console.log(`Dúvida PASSOU (registro ${id}).`);
}

async function validarSuporte(aluno, master) {
  const { id_suporte: id, status } = await dados(aluno.cliente.from('ticket_suporte').insert({
    assunto: marcador, mensagem: 'Chamado descartável', id_perfil: aluno.id,
  }).select('id_suporte,status').single(), 'Abertura de suporte');
  assert.equal(status, 'pendente');
  assert.deepEqual(await dados(master.cliente.from('ticket_suporte').select('assunto,status')
    .eq('id_suporte', id).single(), 'Leitura pela equipe de suporte'), { assunto: marcador, status });
  console.log(`Suporte PASSOU (chamado ${id}).`);
}

try {
  const [aluno, professor, master] = await Promise.all([
    entrar('ALUNO_DCC000'), entrar('PROFESSOR_DCC000'), entrar('MASTER'),
  ]);
  const resultados = await Promise.allSettled([
    validarMensagem(aluno, professor), validarDuvida(aluno, professor), validarSuporte(aluno, master),
  ]);
  for (const resultado of resultados) {
    if (resultado.status === 'rejected') {
      console.error(resultado.reason.message);
      process.exitCode = 1;
    }
  }
} finally {
  await Promise.allSettled(clientes.map((cliente) => cliente.auth.signOut({ scope: 'local' })));
}
