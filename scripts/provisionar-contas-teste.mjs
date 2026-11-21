import { createClient } from '@supabase/supabase-js';

const contas = [
  { chave: 'ALUNO_DCC000', papel: 'aluno', turma: 'DCC000', vincular: true },
  { chave: 'PROFESSOR_DCC000', papel: 'professor', turma: 'DCC000', vincular: true },
  { chave: 'PROFESSOR_SEM_VINCULO', papel: 'professor', turma: 'DCC000' },
  { chave: 'ALUNO_MAT101', papel: 'aluno', turma: 'MAT101', vincular: true },
  { chave: 'MASTER', papel: 'master', turma: 'DCC000' },
];

async function conferir(operacao, etapa) {
  const { data, error } = await operacao;
  if (error) {
    const codigo = /^[a-z0-9_]{1,60}$/i.test(error.code ?? '') ? error.code : 'sem código';
    throw new Error(`${etapa} falhou (${codigo}).`);
  }
  return data;
}

async function aplicar(urlEsperada) {
  if (!urlEsperada || process.env.NEXUS_TEST_SUPABASE_URL !== urlEsperada) {
    throw new Error('Confira a referência ou o endereço local do Supabase de teste.');
  }
  const chave = process.env.NEXUS_TEST_SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error('Chave administrativa local ausente.');

  const configuradas = contas.map((conta) => {
    const prefixo = `NEXUS_TEST_${conta.chave}`;
    const email = process.env[`${prefixo}_EMAIL`]?.trim().toLowerCase();
    const senha = process.env[`${prefixo}_SENHA`];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '') || (senha?.length ?? 0) < 12) {
      throw new Error(`Confira e-mail e senha (mínimo de 12 caracteres) de ${conta.chave}.`);
    }
    return { ...conta, email, senha };
  });
  if (new Set(configuradas.map(({ email }) => email)).size !== contas.length) {
    throw new Error('Use um e-mail exclusivo por cenário.');
  }

  const banco = createClient(process.env.NEXUS_TEST_SUPABASE_URL, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const turmas = await conferir(
    banco.from('turma').select('codigo_acesso,id_turma,id_escola')
      .in('codigo_acesso', ['DCC000', 'MAT101']), 'Leitura das turmas',
  );
  const porCodigo = new Map(turmas.map((turma) => [turma.codigo_acesso, turma]));
  if (porCodigo.size !== 2 || porCodigo.get('DCC000').id_escola === porCodigo.get('MAT101').id_escola) {
    throw new Error('A matriz requer DCC000 e MAT101 em escolas distintas.');
  }

  const escolas = await conferir(
    banco.from('escola').select('id_escola,codigo_publico')
      .in('id_escola', [porCodigo.get('DCC000').id_escola, porCodigo.get('MAT101').id_escola]),
    'Leitura dos códigos públicos das escolas',
  );
  const codigoPorEscola = new Map(escolas.map((e) => [e.id_escola, e.codigo_publico]));
  if (codigoPorEscola.size !== 2 || [...codigoPorEscola.values()].some((c) => !c)) {
    throw new Error('As escolas das turmas de teste precisam possuir codigo_publico preenchido (migração 15).');
  }

  const existentes = new Map();
  for (const conta of configuradas) {
    const perfil = await conferir(
      banco.from('perfil').select('id_perfil,role,id_escola').eq('email', conta.email).maybeSingle(),
      `Leitura do perfil ${conta.chave}`,
    );
    if (!perfil) continue;
    const { user } = await conferir(banco.auth.admin.getUserById(perfil.id_perfil), `Auth ${conta.chave}`);
    if (user?.email?.toLowerCase() !== conta.email ||
        user.app_metadata?.nexusclass_fixture !== conta.chave) {
      throw new Error(`Já existe uma conta fora deste roteiro para ${conta.chave}.`);
    }
    existentes.set(conta.chave, perfil);
  }

  for (const conta of configuradas) {
    const turma = porCodigo.get(conta.turma);
    let perfil = existentes.get(conta.chave);
    if (!perfil) {
      const { user } = await conferir(banco.auth.admin.createUser({
        email: conta.email,
        password: conta.senha,
        email_confirm: true,
        user_metadata: {
          nome: `Teste ${conta.chave}`,
          codigo_escola: codigoPorEscola.get(turma.id_escola),
        },
        app_metadata: { nexusclass_fixture: conta.chave },
      }), `Cadastro Auth ${conta.chave}`);
      perfil = await conferir(
        banco.from('perfil').select('id_perfil,role,id_escola').eq('id_perfil', user.id).single(),
        `Perfil criado para ${conta.chave}`,
      );
    }

    const escola = conta.papel === 'master' ? null : turma.id_escola;
    if (perfil.role !== conta.papel || perfil.id_escola !== escola) {
      await conferir(
        banco.from('perfil').update({ role: conta.papel, id_escola: escola })
          .eq('id_perfil', perfil.id_perfil).select('id_perfil').single(),
        `Configuração do perfil ${conta.chave}`,
      );
    }

    if (conta.papel === 'aluno') {
      await conferir(banco.from('aluno_turma').upsert({
        id_aluno: perfil.id_perfil, id_turma: turma.id_turma, situacao: 'ativa',
      }), `Matrícula ${conta.chave}`);
    }
    if (conta.papel === 'professor') {
      const vinculo = { id_professor: perfil.id_perfil, id_turma: turma.id_turma };
      if (conta.vincular) {
        await conferir(banco.from('professor_turma').upsert(vinculo, { ignoreDuplicates: true }),
          `Vínculo ${conta.chave}`);
      } else {
        const registro = await conferir(
          banco.from('professor_turma').select('id_turma').match(vinculo).maybeSingle(),
          `Controle sem vínculo ${conta.chave}`,
        );
        if (registro) throw new Error(`${conta.chave} já possui vínculo com ${conta.turma}.`);
      }
    }
    console.log(`OK ${conta.chave}`);
  }
}

const args = process.argv.slice(2);
try {
  if (args.length === 0) {
    console.log('Simulação local. Contas previstas:');
    for (const { chave } of contas) console.log(chave);
  } else if (args.length === 2 && args[0] === '--aplicar') {
    const referencia = args[1];
    await aplicar(/^[a-z0-9]{20}$/.test(referencia) ? `https://${referencia}.supabase.co` : null);
  } else if (args.length === 1 && args[0] === '--aplicar-local') {
    await aplicar('http://127.0.0.1:54321');
  } else {
    throw new Error('Uso: node scripts/provisionar-contas-teste.mjs [--aplicar REF_DO_PROJETO | --aplicar-local]');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha inesperada no provisionamento.');
  process.exitCode = 1;
}
