import { describe, expect, it, vi } from 'vitest';
import { getAssetPath } from '@/lib/assetPath';
import {
  capitalizer,
  capitalizerNomeTodo,
  cn,
  comparaDataHj,
  extrairUrlsAnexo,
  formatarDataCurta,
  formatarDataLocal,
  formatarDataRelativa,
  formatarDataUltimaMensagem,
  formatarErroSupabase,
  getBadgeStatusStyle,
  getCorMateria,
  getCorNomeUsuario,
  hojeChaveLocal,
  hojeLocal,
  isDataEntregaFutura,
  montarDataEvento,
  obterChaveDataLocal,
  obterNomeArquivoDoUrl,
  obterObjetoLocalStorage,
  obterSetLocalStorage,
  paraChaveData,
  paraData,
  salvarObjetoLocalStorage,
  salvarSetLocalStorage,
} from '@/lib/utils';

describe('src/lib/utils.ts — Suíte de Testes Unitários Puros (Fase 0)', () => {
  describe('1. Utilitários de Classes CSS e Formatação de Texto', () => {
    it('cn() deve combinar classes condicionais e resolver conflitos do Tailwind', () => {
      // Arrange & Act
      const resultado = cn('px-2 py-1', false && 'hidden', 'px-4');

      // Assert
      expect(resultado).toBe('py-1 px-4');
    });

    it('capitalizer() deve colocar apenas a primeira letra em maiúscula e o restante em minúscula', () => {
      expect(capitalizer('gABRIEL')).toBe('Gabriel');
      expect(capitalizer('engenharia')).toBe('Engenharia');
      expect(capitalizer('')).toBe('');
    });

    it('capitalizerNomeTodo() deve formatar cada palavra de um nome composto', () => {
      expect(capitalizerNomeTodo('gabriel lineker')).toBe('Gabriel Lineker');
      expect(capitalizerNomeTodo('GIANLUCCA PAIVA')).toBe('Gianlucca Paiva');
    });

    it('getAssetPath() deve normalizar barra inicial e concatenar com __BASE_URL__', () => {
      expect(getAssetPath('/logo.png')).toBe('/NexusClassWeb/logo.png');
      expect(getAssetPath('icons/bot.svg')).toBe('/NexusClassWeb/icons/bot.svg');
    });
  });

  describe('2. Hashing Determinístico de Cores (Matérias e Usuários)', () => {
    it('getCorMateria() deve ser determinístico (mesma entrada gera sempre a mesma classe CSS)', () => {
      const cor1 = getCorMateria('Engenharia de Software');
      const cor2 = getCorMateria('Engenharia de Software');
      const corVazia = getCorMateria('');

      expect(cor1).toBe(cor2);
      expect(cor1).toContain('bg-');
      expect(corVazia).toContain('bg-');
    });

    it('getCorNomeUsuario() deve retornar classes válidas de forma idempotente para o mesmo usuário', () => {
      const corA = getCorNomeUsuario('Gabriel Lineker');
      const corB = getCorNomeUsuario('Gabriel Lineker');
      const corVazia = getCorNomeUsuario('');

      expect(corA).toBe(corB);
      expect(corA).toContain('text-white');
      expect(corVazia).toContain('text-white');
    });

    it('getBadgeStatusStyle() deve retornar o estilo correto para cada status de fase (Tabela de Decisão)', () => {
      expect(getBadgeStatusStyle('Concluído')).toContain('emerald');
      expect(getBadgeStatusStyle('Em Andamento')).toContain('amber');
      expect(getBadgeStatusStyle('Descartado')).toContain('rose');
      expect(getBadgeStatusStyle('Planejado')).toContain('blue');
    });
  });

  describe('3. Conversão, Formatação e Análise de Valor Limite em Datas', () => {
    it('formatarDataLocal() e paraChaveData() devem preencher mês e dia com zero à esquerda (YYYY-MM-DD)', () => {
      const data = new Date(2026, 0, 5); // 05 de Janeiro de 2026 (mês 0-indexed)

      expect(formatarDataLocal(data)).toBe('2026-01-05');
      expect(paraChaveData(data)).toBe('2026-01-05');
    });

    it('paraData() deve reconstruir objeto Date local a partir de chave YYYY-MM-DD', () => {
      const data = paraData('2026-10-24');

      expect(data.getFullYear()).toBe(2026);
      expect(data.getMonth()).toBe(9); // Outubro = 9
      expect(data.getDate()).toBe(24);
    });

    it('formatarDataCurta() e obterChaveDataLocal() devem formatar no padrão brasileiro DD/MM/YYYY', () => {
      expect(formatarDataCurta('2026-10-24')).toBe('24/10/2026');
      expect(obterChaveDataLocal('2026-10-24T15:30:00')).toBe('24/10/2026');
    });

    it('montarDataEvento() deve retornar Date válida para entradas corretas e null para entradas inválidas', () => {
      const eventoValido = montarDataEvento('2026-10-24', '14:30');
      const eventoInvalido = montarDataEvento('data-invalida', '99:99');

      expect(eventoValido).toBeInstanceOf(Date);
      expect(eventoValido?.getHours()).toBe(14);
      expect(eventoValido?.getMinutes()).toBe(30);
      expect(eventoInvalido).toBeNull();
    });

    it('hojeChaveLocal() e hojeLocal() devem respeitar o relógio congelado via Fake Timers', () => {
      // Arrange: Congela o relógio em 24/10/2026 às 16:45:30
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 9, 24, 16, 45, 30));

      // Act
      const chave = hojeChaveLocal();
      const dataHojeSemHora = hojeLocal();

      // Assert
      expect(chave).toBe('2026-10-24');
      expect(dataHojeSemHora.getFullYear()).toBe(2026);
      expect(dataHojeSemHora.getMonth()).toBe(9);
      expect(dataHojeSemHora.getDate()).toBe(24);
      expect(dataHojeSemHora.getHours()).toBe(0);
    });

    it('comparaDataHj() deve aplicar Análise de Valor Limite (ontem = false, hoje 00:00 = true, amanhã = true)', () => {
      // Arrange
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 9, 24, 18, 0, 0));

      const ontemFimDoDia = new Date(2026, 9, 23, 23, 59, 59);
      const hojeMeiaNoite = new Date(2026, 9, 24, 0, 0, 0);
      const amanha = new Date(2026, 9, 25, 8, 0, 0);

      // Act & Assert
      expect(comparaDataHj(ontemFimDoDia)).toBe(false);
      expect(comparaDataHj(hojeMeiaNoite)).toBe(true);
      expect(comparaDataHj(amanha)).toBe(true);
    });

    it('isDataEntregaFutura() deve validar se o prazo de entrega da atividade ainda não expirou', () => {
      // Arrange
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-24T12:00:00.000Z'));

      // Act & Assert
      expect(isDataEntregaFutura('2026-10-25T12:00:00.000Z')).toBe(true);
      expect(isDataEntregaFutura('2026-10-24T12:00:00.000Z')).toBe(false); // Limite exato
      expect(isDataEntregaFutura('2026-10-23T12:00:00.000Z')).toBe(false);
    });

    it('formatarDataRelativa() deve classificar entre "Hoje", "Ontem" e data por extenso', () => {
      // Arrange
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 9, 24, 15, 0, 0));

      const isoHoje = new Date(2026, 9, 24, 10, 30, 0).toISOString();
      const isoOntem = new Date(2026, 9, 23, 20, 15, 0).toISOString();
      const isoAntiga = new Date(2026, 4, 10, 12, 0, 0).toISOString();

      // Act & Assert
      expect(formatarDataRelativa(isoHoje)).toBe('Hoje');
      expect(formatarDataRelativa(isoOntem)).toBe('Ontem');
      expect(formatarDataRelativa(isoAntiga)).toContain('2026');
    });

    it('formatarDataUltimaMensagem() deve tratar data inválida, horário de hoje, "Ontem" e data DD/MM/YY', () => {
      // Arrange
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 9, 24, 15, 0, 0));

      const isoHoje = new Date(2026, 9, 24, 9, 5, 0).toISOString();
      const isoOntem = new Date(2026, 9, 23, 18, 0, 0).toISOString();
      const isoAntiga = new Date(2026, 0, 15, 12, 0, 0).toISOString();

      // Act & Assert
      expect(formatarDataUltimaMensagem('data-invalida')).toBe('');
      expect(formatarDataUltimaMensagem(isoHoje)).toMatch(/09:05/);
      expect(formatarDataUltimaMensagem(isoOntem)).toBe('Ontem');
      expect(formatarDataUltimaMensagem(isoAntiga)).toBe('15/01/26');
    });
  });

  describe('4. Tabela de Decisão: Tradutor de Erros do Supabase (formatarErroSupabase)', () => {
    it('deve traduzir o código PGRST205 (schema cache do PostgREST)', () => {
      const msg = formatarErroSupabase({ code: 'PGRST205' }, 'buscar eventos');
      expect(msg).toContain('PostgREST nao encontrou public.eventos_calendario');
    });

    it('deve traduzir o código 42P01 (tabela inexistente)', () => {
      const msg = formatarErroSupabase({ code: '42P01' }, 'criar evento');
      expect(msg).toContain('tabela eventos_calendario nao existe');
    });

    it('deve traduzir o código 42501 (violação de RLS / permissão negada)', () => {
      const msg = formatarErroSupabase({ code: '42501' }, 'deletar evento');
      expect(msg).toContain('permissao negada (RLS)');
    });

    it('deve formatar erro genérico com message e details, ou apenas o fallback quando vazio', () => {
      const comDetalhes = formatarErroSupabase(
        { code: '23505', message: 'Chave duplicada', details: 'id já existe' },
        'salvar entrega'
      );
      const semMensagem = formatarErroSupabase({}, 'atualizar perfil');

      expect(comDetalhes).toBe('Falha ao salvar entrega no Supabase. Chave duplicada (id já existe)');
      expect(semMensagem).toBe('Falha ao atualizar perfil no Supabase.');
    });
  });

  describe('5. Particionamento de Equivalência: Anexos e URLs', () => {
    it('extrairUrlsAnexo() deve lidar com null, string única, JSON array válido e JSON malformado', () => {
      const jsonArray = JSON.stringify(['https://cdn.com/a.pdf', 'https://cdn.com/b.png']);

      expect(extrairUrlsAnexo(null)).toEqual([]);
      expect(extrairUrlsAnexo('')).toEqual([]);
      expect(extrairUrlsAnexo('https://cdn.com/unico.pdf')).toEqual(['https://cdn.com/unico.pdf']);
      expect(extrairUrlsAnexo(jsonArray)).toEqual([
        'https://cdn.com/a.pdf',
        'https://cdn.com/b.png',
      ]);
      // JSON iniciando com [ e terminando com ] mas inválido (cai no bloco catch)
      expect(extrairUrlsAnexo('[json-corrompido]')).toEqual(['[json-corrompido]']);
    });

    it('obterNomeArquivoDoUrl() deve decodificar URI, remover query string e tratar URI malformada', () => {
      const urlComQuery = 'https://xyz.supabase.co/storage/v1/entregas/Trabalho%20Final.pdf?token=abc';
      const urlMalformada = 'https://xyz.supabase.co/%E0%A4%A';

      expect(obterNomeArquivoDoUrl(urlComQuery)).toBe('Trabalho Final.pdf');
      expect(obterNomeArquivoDoUrl(urlMalformada)).toBe('');
    });
  });

  describe('6. Persistência e Tolerância a Falhas no localStorage', () => {
    it('salvarSetLocalStorage() e obterSetLocalStorage() devem persistir e recuperar um Set<string>', () => {
      const conjunto = new Set(['alerta-1', 'alerta-2']);

      salvarSetLocalStorage('nexus_alertas', conjunto);
      const recuperado = obterSetLocalStorage('nexus_alertas');

      expect(recuperado.size).toBe(2);
      expect(recuperado.has('alerta-1')).toBe(true);
      expect(recuperado.has('alerta-2')).toBe(true);
    });

    it('obterSetLocalStorage() deve retornar Set vazio se chave não existir, não for array ou JSON estiver corrompido', () => {
      expect(obterSetLocalStorage('chave_inexistente').size).toBe(0);

      window.localStorage.setItem('chave_objeto', JSON.stringify({ invalido: true }));
      expect(obterSetLocalStorage('chave_objeto').size).toBe(0);

      window.localStorage.setItem('chave_corrompida', '{json-quebrado');
      expect(obterSetLocalStorage('chave_corrompida').size).toBe(0);
    });

    it('salvarObjetoLocalStorage() e obterObjetoLocalStorage() devem persistir objetos tipados e usar fallback em caso de erro', () => {
      const padrao = { tema: 'claro', notificacoes: true };
      const novo = { tema: 'escuro', notificacoes: false };

      // Chave ainda não existe -> retorna padrão
      expect(obterObjetoLocalStorage('nexus_prefs', padrao)).toEqual(padrao);

      // Salva e recupera
      salvarObjetoLocalStorage('nexus_prefs', novo);
      expect(obterObjetoLocalStorage('nexus_prefs', padrao)).toEqual(novo);

      // Corrompe o JSON -> cai no catch e retorna padrão sem quebrar a aplicação
      window.localStorage.setItem('nexus_prefs', '{corrompido');
      expect(obterObjetoLocalStorage('nexus_prefs', padrao)).toEqual(padrao);
    });

    it('funções de localStorage devem ser seguras em ambiente sem window (SSR guard)', () => {
      const windowOriginal = globalThis.window;
      // Simula ausência de window
      vi.stubGlobal('window', undefined);

      expect(obterSetLocalStorage('qualquer').size).toBe(0);
      expect(() => salvarSetLocalStorage('qualquer', new Set(['a']))).not.toThrow();
      expect(obterObjetoLocalStorage('qualquer', { ok: true })).toEqual({ ok: true });
      expect(() => salvarObjetoLocalStorage('qualquer', { ok: false })).not.toThrow();

      // Restaura window
      vi.stubGlobal('window', windowOriginal);
    });
  });
});
