# Relatos Brutos — NexusClass: Design Patterns

> **Contexto (para leitura por LLM):** projeto acadêmico **NexusClass** (React + TypeScript + Shadcn UI + Supabase + API Gemini), branch **`DesingTeste`**, disciplina Engenharia de Software Moderna (Unidade 9 — Padrões de Projeto, Aula 09).
>
> Estrutura do documento: teoria dos Design Patterns (GoF) e aplicação no NexusClass (guia conceitual e guia prático com código).

---

# SEÇÃO A — DESIGN PATTERNS

## A.0 Introdução

Com base nos materiais de Engenharia de Software Moderna (Unidade 9 — Padrões de Projeto) do notebook e na estrutura do código-fonte do NexusClass (arquivo anexado referente ao repositório/branch), segue a explicação teórica dos Design Patterns, seguida de um guia prático de como aplicá-
las e documentá-los na branch `DesingTeste`.

## A.1 O que são Design Patterns (segundo os materiais)

Padrões de Projeto (Design Patterns) são soluções recorrentes para problemas de projeto enfrentados por engenheiros de software. Foram popularizados em 1994 pelo livro da "Gangue dos Quatro" (GoF) — Erich Gamma, Richard Helm, Ralph Johnson e John Vlissides — que catalogou 23 padrões.

### Duas grandes utilidades
- **Utilidade #1 — Reúso de Projeto:** diante de um problema de projeto, não é preciso "reinventar a roda"; aplica-se uma solução já validada, ganhando tempo.
- **Utilidade #2 — Vocabulário Comum:** cria uma linguagem padronizada de alto nível para discussões técnicas na equipe e para documentação de arquitetura.

### Estrutura e filosofia (Design for Change)
- Cada padrão é descrito pela tríade: **Contexto** (sistema ou parte dele) → **Problema** (de projeto) → **Solução** (arranjo de classes/objetos).
- **Filosofia central:** padrões servem ao *Design for Change* (projetar para facilitar mudanças futuras).
- **Quando NÃO usar (trade-off):** aumentam a complexidade do sistema (classes/interfaces extras). Se a chance de um requisito mudar é zero ou muito baixa, aplicar padrões configura *Overengineering*.

## A.2 Os 8 padrões da disciplina (classificação GoF)

### Criacionais (criação/instanciação de objetos)
- **Fábrica (Factory):** centraliza a criação de objetos (`create()`), evitando `new ClasseConcreta()` espalhados pelo código e criando um único ponto de mudança.
- **Singleton:** garante no máximo uma instância global da classe (ex.: Logger ou conexão única), acessada por método estático (`getInstance()`).

### Estruturais (composição de classes/objetos e interfaces)
- **Proxy:** objeto intermediário entre o cliente e o objeto base, com a mesma interface; adiciona cache, controle de acesso ou lazy loading sem modificar a classe original.
- **Adaptador (Adapter):** converte a interface de uma classe/biblioteca externa ou legada na interface esperada pelos clientes (como um adaptador de tomada), aplicando Inversão de Dependência e Composição.
- **Fachada (Facade):** provê uma interface única, simplificada e de mais alto nível para um subsistema complexo, reduzindo o acoplamento entre clientes e módulos internos.

### Comportamentais (algoritmos e atribuição de responsabilidades)
- **Strategy:** parametriza e encapsula uma família de algoritmos intercambiáveis (ex.: formas de ordenação ou filtro), atendendo ao princípio Aberto/Fechado (OCP).
- **Observador (Observer):** define dependência um-para-muitos entre um Sujeito (estado/modelo) e vários Observadores (visões/componentes), notificando-os automaticamente quando o estado muda, sem acoplá-los.
- **Template Method:** define o esqueleto/fluxo principal de um algoritmo em uma classe/função base, delegando passos específicos a implementações especializadas. É a base da Inversão de Controle (IoC) em frameworks.

## A.3 Como aplicar no NexusClass (branch DesingTeste) — guia conceitual

Analisando a árvore de arquivos do NexusClass (`src/components/`, `src/hooks/`, `out/diagramas/`, Supabase, React/TypeScript, Shadcn UI), há ganchos naturais onde os 8 padrões estão presentes ou podem ser refatorados na branch `DesingTeste`, enriquecendo o projeto e o `diagrama_classes_detalhado.puml`.

### A.3.1 Singleton → instância do cliente Supabase
- **Contexto:** vários hooks (AuthHooks, AlunosHooks, Mural, ChatBot) se comunicam com o banco PostgreSQL e a autenticação do Supabase.
- **Problema:** se cada hook/componente instanciar `createClient(url, key)` separadamente, haverá múltiplas conexões WebSocket abertas, perda de sincronia de sessão e desperdício de memória.
- **Aplicação:** centralizar a conexão em uma classe/módulo `SupabaseClientSingleton` (ex.: `src/lib/supabaseClient.ts`).

```typescript
class SupabaseSingleton {
  private static instance: SupabaseClient;
  private constructor() {} // Construtor privado conforme GoF

  public static getInstance(): SupabaseClient {
    if (!SupabaseSingleton.instance) {
      SupabaseSingleton.instance = createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    return SupabaseSingleton.instance;
  }
}
```

### A.3.2 Fachada (Facade) → camada de serviços / custom hooks (`src/hooks/`)
- **Contexto:** componentes como `BoxEntregaAtividade.tsx`, `DuvidasBox.tsx` e `BoxAgendamento.tsx` executam operações complexas: validar sessão no Auth, subir arquivo no Storage via `AnexoArquivo.tsx`, inserir registro no banco e disparar toast em `sonner.tsx`.
- **Problema:** se os componentes React chamarem diretamente a API do Supabase (`.from().select().eq()`, `.storage.from().upload()`), a interface fica fortemente acoplada à infraestrutura.
- **Aplicação:** criar uma Facade (ex.: `EntregaAtividadeFacade`, ou estruturar os hooks de `src/hooks/` como fachadas explícitas) que exponha métodos simples como `realizarEntrega(dados, arquivo)`. O componente de UI fala só com a Fachada, que orquestra Auth + Storage + Database internamente.

### A.3.3 Adaptador (Adapter) → mapeamento do Supabase e integração do `ChatBot.tsx`
- **Contexto:**
  - As tabelas do Supabase (`out/casos_de_uso/SupabaseMakdown/`) retornam dados em `snake_case` e estruturas relacionais brutas, enquanto os componentes TypeScript (`TurmaCard.tsx`, `AlunosTurma.tsx` com `src/hooks/AlunosHooks/type.ts`) esperam objetos de domínio padronizados.
  - `ChatBot.tsx` consome uma API externa de IA.
- **Problema:** não se pode (ou não se deve) alterar a resposta bruta da biblioteca do Supabase ou do provedor de LLM, mas a UI precisa de uma interface uniforme.
- **Aplicação:** implementar `AlunoDataAdapter` ou `ChatBotProviderAdapter`. Para o `ChatBot.tsx`, criar a interface `IChatService` com o método `enviarMensagem(msg: string): Promise<RespostaBot>` e uma classe `AdaptadorOpenRouter` (ou Gemini) que traduz o payload da API externa para a interface do NexusClass.

### A.3.4 Strategy → filtros, pesquisas (`Pesquisar.tsx`) e ordenação de conteúdos
- **Contexto:** componentes `Pesquisar.tsx`, `ListagemConteudosInscritos.tsx`, `AlunosTurma.tsx` e `BoxAtividade.tsx`.
- **Problema:** usuários podem querer filtrar/ordenar atividades, conteúdos ou alunos por critérios diferentes (prazo de entrega, ordem alfabética, status de dúvida "Respondida/Pendente" visto em `diagrama_estados_duvida.puml`, relevância). Vários `if/else` ou `switch` no componente ferem o Princípio Aberto/Fechado (SOLID).
- **Aplicação:** criar a interface `FiltroAtividadeStrategy` (ou `OrdenacaoStrategy`) com o método `executar(lista: Atividade[]): Atividade[]`.
  - Estratégias concretas: `OrdenarPorPrazoStrategy`, `OrdenarPorStatusEntregaStrategy`, `OrdenarPorDisciplinaStrategy`.
  - `ListagemConteudosInscritos.tsx` ou `Pesquisar.tsx` guarda a estratégia atual no estado e apenas delega `strategy.executar(atividades)`.

### A.3.5 Proxy → rotas protegidas, controle de acesso e cache de consultas
- **Contexto:** o projeto já tem `ProtectedRoute.tsx` e `BoxRestrito.tsx`, além de buscas frequentes como `useOptionAlunos.ts`.
- **Problemas:**
  - Controlar o acesso a telas restritas (Professor vs. Aluno) antes de renderizar o componente real.
  - Evitar requisições repetidas ao Supabase ao listar alunos de uma turma (`AlunosTurma.tsx`) toda vez que o usuário troca de aba.
- **Aplicação:**
  - **Proxy de Cache** (como o exemplo `BookSearchProxy` da aula): criar `AlunosServiceProxy`, que implementa a mesma interface de busca de alunos. Se a lista da turma já estiver em memória/cache local, retorna imediatamente; caso contrário, delega ao serviço real do Supabase.
  - **Proxy de Proteção:** documentar `ProtectedRoute.tsx` e `BoxRestrito.tsx` como aplicações do Proxy de Proteção na camada de visão.

### A.3.6 Observador (Observer) → contextos globais (`ThemeProvider`) e notificações/Mural
- **Contexto:** `ThemeProvider.tsx` (`src/components/provedores/`), `BoxMural.tsx`, `Mensagens.tsx` e `DuvidasBox.tsx`.
- **Problema:** quando o estado de autenticação, o tema (Claro/Escuro) ou uma nova mensagem/aviso no Mural muda, vários componentes independentes (`Navbar.tsx`, `AppSidebar.tsx`, `BoxMural.tsx`) precisam ser atualizados automaticamente, sem que o gerenciador de estado conheça os detalhes internos de cada um.
- **Aplicação:**
  - **No código:** Context API (`ThemeProvider`) e inscrições Realtime do Supabase (`.channel().on('postgres_changes', ...)` para atualizar `Mensagens.tsx` ou `DuvidasBox.tsx` em tempo real) são implementações diretas do Observer.
  - **Classe explícita (para avaliação acadêmica):** criar `NotificacaoSubject`, que notifica observadores (ex.: `ToastObserver` usando Sonner e `BadgeNavbarObserver` na `Navbar.tsx`) sempre que uma atividade for entregue ou uma dúvida for respondida.

### A.3.7 Fábrica (Factory) → gerenciador de telas e cards dinâmicos
- **Contexto:** `GerenciadorTelas.tsx` e diferentes caixas/cards (`BoxAtividade.tsx`, `BoxAgendamento.tsx`, `BoxMural.tsx`, `DuvidasBox.tsx`) e notificações.
- **Problema:** evitar instanciações condicionais complexas espalhadas pelas páginas quando é preciso renderizar um componente ou criar um objeto de notificação/evento do calendário (`Calendario.tsx`) conforme o tipo (`"atividade" | "agendamento" | "aviso" | "duvida"`).
- **Aplicação:** criar `ItemCalendarioFactory` ou `BoxComponenteFactory` com método estático `create(tipo, dados)`, que centraliza a decisão de qual componente ou objeto de domínio instanciar e retornar.

### A.3.8 Template Method → layout principal e fluxo de submissão de formulários
- **Contexto:** `LayoutPrincipal.tsx` (`src/Layout/`) e vários formulários de envio (`BoxEntregaAtividade.tsx`, `BoxAgendamento.tsx`, `BoxDenunciaAluno.tsx`, `BoxAuxiliarSugestao.tsx`).
- **Problema:** todos os envios seguem o mesmo "esqueleto de algoritmo":
  1. Validar campos de entrada (`validarDados()`)
  2. Verificar/preparar anexos, se houver (`prepararAnexos()`)
  3. Persistir no Supabase (`enviarParaBanco()`)
  4. Exibir feedback visual e atualizar estado (`notificarSucesso()`)

  Porém, a validação e a tabela de destino mudam conforme seja Entrega de Atividade, Denúncia de Aluno ou Sugestão.
- **Aplicação:** criar uma classe abstrata (ou Hook base parametrizado) `SubmissaoBaseTemplate` com o método template `executarSubmissao()`, que chama os métodos abstratos `validar()` e `salvarNoBanco()`, implementados pelas subclasses `SubmissaoEntregaAtividade`, `SubmissaoDenuncia` e `SubmissaoAgendamento`.

## A.4 Resumo de ação recomendado para a branch DesingTeste

Para alinhar a branch `DesingTeste` à avaliação da disciplina de Engenharia de Software:

1. Criar a pasta `src/patterns/` (ou organizar dentro de `src/services/` e `src/hooks/`) com implementações claras de pelo menos 3 a 4 padrões GoF. Recomendado: **Singleton** para o Supabase, **Strategy** para filtros de atividades/alunos, **Facade** para o envio de atividades com anexo e **Adapter** para o ChatBot ou mapeamento de dados.
2. Atualizar o Diagrama de Classes (`out/diagramas/diagrama_classes_detalhado.puml`): incluir estereótipos ou notas indicando onde cada padrão atua (`<<Singleton>>`, `<<Strategy>>`, `<<Facade>>`, `<<Adapter>>`), aproveitando a Utilidade #2 (vocabulário para comunicação e documentação) destacada nos slides da Aula 09.

> Oferta original: gerar o código TypeScript de qualquer um desses padrões adaptado aos arquivos específicos do NexusClass, ou atualizar o código PlantUML do diagrama de classes.

---

## A.5 Guia prático com código (TypeScript + React + Supabase + Gemini)

Para aplicar os Design Patterns (GoF) na branch `DesingTeste` usando TypeScript, React, Supabase e a API do Gemini, o segredo é unir os **Princípios de Projeto (SOLID)** e **Portas e Adaptadores (Arquitetura Hexagonal)** com a arquitetura de uma **SPA (Single Page Application)**.

Uma SPA em React separa a **Apresentação** (componentes React) do **Domínio/Infraestrutura** (classes/serviços TypeScript), mantendo módulos semelhantes a *icebergs*: interface pública mínima e toda a complexidade de banco e IA submersa e privada.

Código pronto para criar em `src/patterns/` (ou `src/services/`):

### A.5.1 Singleton + Supabase (instância única de conexão)
Singleton com construtor `private` e método estático `getInstance()`, para que todo o app React reutilize o mesmo pool de conexão e sessão de autenticação do Supabase.

**Arquivo sugerido:** `src/patterns/singleton/SupabaseSingleton.ts`

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseSingleton {
  private static instance: SupabaseClient;

  // Construtor privado impede "new SupabaseSingleton()" espalhado pelo código
  private constructor() {}

  public static getInstance(): SupabaseClient {
    if (!SupabaseSingleton.instance) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      SupabaseSingleton.instance = createClient(supabaseUrl, supabaseKey);
    }
    return SupabaseSingleton.instance;
  }
}
```

### A.5.2 Adapter + Factory + API Gemini (desacoplando o `ChatBot.tsx`)
Chamar o SDK ou `fetch` do Gemini direto no React acopla a tela à tecnologia externa. Aplicam-se **Inversão de Dependências ("Prefira Interfaces a Classes")** e o **Adapter**: cria-se uma interface do domínio do NexusClass e adapta-se a API do Gemini a ela. Uma **Fábrica (Factory)** instancia o provedor.

**Arquivo sugerido:** `src/patterns/adapter/GeminiChatAdapter.ts`

```typescript
// 1. Porta de Saída / Interface esperada pelo NexusClass (Inversão de Dependência)
export interface IAssistenteIA {
  responderDuvida(pergunta: string, contextoTurma?: string): Promise<string>;
}

// 2. Classe Adaptadora para a API do Gemini
export class GeminiAdapter implements IAssistenteIA {
  private apiKey: string;
  private endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async responderDuvida(pergunta: string, contextoTurma = 'Geral'): Promise<string> {
    // Traduz a chamada simples do NexusClass para o formato complexo exigido pela REST API do Gemini
    const response = await fetch(`this.endpoint?key={this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `[Contexto da Turma: ${contextoTurma}] Responda ao aluno: ${pergunta}` }]
        }]
      })
    });

    const data = await response.json();
    // Adapta o JSON profundo do Gemini de volta para uma string simples
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Não foi possível gerar uma resposta.';
  }
}

// 3. Padrão Factory: Ponto único de criação caso queira trocar Gemini por outro modelo no futuro
export class AssistenteIAFactory {
  public static create(): IAssistenteIA {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    return new GeminiAdapter(apiKey);
  }
}
```

- **Uso no `ChatBot.tsx`:** o componente chama apenas `const bot = AssistenteIAFactory.create(); await bot.responderDuvida(texto);`.

### A.5.3 Facade + entrega de atividades (Supabase Storage + DB + Gemini)
A **Fachada** esconde a complexidade de múltiplos subsistemas atrás de uma interface simples (metáfora do *iceberg*). Em `BoxEntregaAtividade.tsx`, entregar uma atividade envolve: upload do arquivo no Storage do Supabase, salvar o registro na tabela PostgreSQL e, opcionalmente, pedir à API Gemini um resumo/pré-feedback da entrega.

**Arquivo sugerido:** `src/patterns/facade/EntregaAtividadeFacade.ts`

```typescript
import { SupabaseSingleton } from '../singleton/SupabaseSingleton';
import { AssistenteIAFactory, IAssistenteIA } from '../adapter/GeminiChatAdapter';

export class EntregaAtividadeFacade {
  private supabase = SupabaseSingleton.getInstance();
  private iaService: IAssistenteIA = AssistenteIAFactory.create();

  // Método único simplificado para o componente React consumir
  public async submeterAtividade(alunoId: string, atividadeId: string, arquivo: File, comentario: string) {
    // Passo 1: Subsistema de Storage (Supabase)
    const caminhoArquivo = `entregas/atividadeId/{alunoId}_${arquivo.name}`;
    const { error: uploadError } = await this.supabase.storage
      .from('arquivos_atividades')
      .upload(caminhoArquivo, arquivo);

    if (uploadError) throw new Error('Falha no upload do anexo.');

    // Passo 2: Subsistema de IA (Gemini via Adapter)
    const feedbackPreliminar = await this.iaService.responderDuvida(
      `Gere uma mensagem curta confirmando o recebimento do comentário: "${comentario}"`
    );

    // Passo 3: Subsistema de Banco de Dados (Supabase Postgres)
    const { data, error: dbError } = await this.supabase
      .from('entregas')
      .insert({
        aluno_id: alunoId,
        atividade_id: atividadeId,
        arquivo_url: caminhoArquivo,
        comentario,
        status: 'ENTREGUE' // Alinhado ao diagrama_estados_entrega.puml
      })
      .select()
      .single();

    if (dbError) throw new Error('Erro ao registrar entrega no banco.');

    return { entrega: data, mensagemIA: feedbackPreliminar };
  }
}
```

### A.5.4 Strategy + React Hooks (filtros e ordenação em `Pesquisar.tsx` / `BoxAtividade.tsx`)
Para aplicar o **Strategy** em TypeScript/React sem violar o Princípio Aberto/Fechado, define-se uma interface `IFiltroStrategy<T>` e passa-se a estratégia escolhida pelo usuário para um estado do React (`useState`).

**Arquivo sugerido:** `src/patterns/strategy/FiltroAtividadesStrategy.ts`

```typescript
export interface AtividadeDTO {
  id: string;
  titulo: string;
  prazo: string;
  entregue: boolean;
}

// Passo 1: Interface da Estratégia (GoF)
export interface IFiltroAtividadeStrategy {
  processar(atividades: AtividadeDTO[]): AtividadeDTO[];
}

// Estratégia Concreta 1: Apenas Pendentes ordenadas por prazo mais próximo
export class AtividadesPendentesStrategy implements IFiltroAtividadeStrategy {
  public processar(atividades: AtividadeDTO[]): AtividadeDTO[] {
    return atividades
      .filter((a) => !a.entregue)
      .sort((a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime());
  }
}

// Estratégia Concreta 2: Ordem Alfabética
export class OrdemAlfabeticaStrategy implements IFiltroAtividadeStrategy {
  public processar(atividades: AtividadeDTO[]): AtividadeDTO[] {
    return [...atividades].sort((a, b) => a.titulo.localeCompare(b.titulo));
  }
}
```

- **Como plugar no componente React (`ListagemConteudosInscritos.tsx` ou `Pesquisar.tsx`):**

```tsx
const [estrategia, setEstrategia] = useState<IFiltroAtividadeStrategy>(new AtividadesPendentesStrategy());
const atividadesExibidas = useMemo(() => estrategia.processar(listaBruta), [listaBruta, estrategia]);
```

### A.5.5 Proxy + cache de consultas ao Supabase (`AlunosHooks`)
Como no exemplo `BookSearchProxy` dos materiais, é possível interceptar buscas pesadas no Supabase (listar alunos de uma turma em `AlunosTurma.tsx` ou `useOptionAlunos.ts`) usando um **Proxy de Cache** em TypeScript.

**Arquivo sugerido:** `src/patterns/proxy/AlunoRepositoryProxy.ts`

```typescript
import { SupabaseSingleton } from '../singleton/SupabaseSingleton';

export interface IAlunoRepository {
  buscarAlunosPorTurma(turmaId: string): Promise<any[]>;
}

// Objeto Base (Consulta real no Supabase)
export class SupabaseAlunoRepository implements IAlunoRepository {
  public async buscarAlunosPorTurma(turmaId: string): Promise<any[]> {
    const supabase = SupabaseSingleton.getInstance();
    const { data, error } = await supabase
      .from('turma_alunos')
      .select('*, perfis(*)')
      .eq('turma_id', turmaId);
    if (error) throw error;
    return data || [];
  }
}

// Objeto Intermediário (Proxy com Cache em Memória)
export class AlunoRepositoryProxy implements IAlunoRepository {
  private repoReal: IAlunoRepository;
  private cache: Map<string, any[]> = new Map();

  constructor(repoReal: IAlunoRepository) {
    this.repoReal = repoReal;
  }

  public async buscarAlunosPorTurma(turmaId: string): Promise<any[]> {
    if (this.cache.has(turmaId)) {
      console.log('[Proxy Cache Hit] Retornando alunos da memória:', turmaId);
      return this.cache.get(turmaId)!;
    }
    const dados = await this.repoReal.buscarAlunosPorTurma(turmaId);
    this.cache.set(turmaId, dados);
    return dados;
  }
}
```

### A.5.6 Observer + Supabase Realtime & React (`Mural.tsx` e `DuvidasBox.tsx`)
No ecossistema React + Supabase, o **Observer** une o banco em tempo real (Sujeito) aos componentes visuais (Observadores), mantendo o modelo independente da visão.

**Arquivo sugerido:** `src/patterns/observer/MuralSubject.ts`

```typescript
import { SupabaseSingleton } from '../singleton/SupabaseSingleton';

export interface IMuralObserver {
  update(novoPost: any): void;
}

export class MuralRealtimeSubject {
  private observers: IMuralObserver[] = [];

  public addObserver(obs: IMuralObserver): void {
    this.observers.push(obs);
  }

  public removeObserver(obs: IMuralObserver): void {
    this.observers = this.observers.filter((o) => o !== obs);
  }

  public notifyObservers(novoPost: any): void {
    for (const obs of this.observers) {
      obs.update(novoPost);
    }
  }

  public iniciarEscutaSupabase(turmaId: string): void {
    SupabaseSingleton.getInstance()
      .channel(`mural_turma_${turmaId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mural' }, (payload) => {
        this.notifyObservers(payload.new);
      })
      .subscribe();
  }
}
```

- **No React:** tanto `BoxMural.tsx` (que atualiza a lista na tela) quanto o componente de notificação `sonner.tsx` (que exibe um *toast* "Novo aviso postado!") podem se registrar como observadores do `MuralRealtimeSubject`.

### A.5.7 Template Method + validação e envio de formulários (`Duvidas`, `Denúncias`, `Sugestões`)
O NexusClass tem `BoxDenunciaAluno.tsx`, `BoxAuxiliarSugestao.tsx` e `DuvidasBox.tsx`. Em TypeScript, uma `abstract class` com **Template Method** fixa o fluxo principal (validar → moderar texto com Gemini → salvar no Supabase) e deixa os detalhes para cada subclasse.

**Arquivo sugerido:** `src/patterns/template/SubmissaoTextoTemplate.ts`

```typescript
import { AssistenteIAFactory } from '../adapter/GeminiChatAdapter';

export abstract class SubmissaoTextoTemplate<TDados> {
  // TEMPLATE METHOD: Define o esqueleto fixo do algoritmo
  public async processarEnvio(dados: TDados, textoPrincipal: string): Promise<void> {
    this.validarCampos(dados);
    await this.verificarModeracaoIA(textoPrincipal);
    await this.persistirNoSupabase(dados);
  }

  // Etapa comum com API Gemini
  private async verificarModeracaoIA(texto: string): Promise<void> {
    const ia = AssistenteIAFactory.create();
    const analise = await ia.responderDuvida(
      `Responda apenas SIM ou NAO: O texto a seguir contém ofensas graves? Texto: "${texto}"`
    );
    if (analise.trim().toUpperCase().includes('SIM')) {
      throw new Error('O conteúdo viola as diretrizes da turma.');
    }
  }

  // Passos abstratos refinados pelas subclasses (Inversão de Controle)
  protected abstract validarCampos(dados: TDados): void;
  protected abstract persistirNoSupabase(dados: TDados): Promise<void>;
}
```

### A.5.8 Resumo da arquitetura na branch DesingTeste

| Tecnologia no NexusClass | Papel nos materiais da disciplina | Padrões GoF aplicados |
| --- | --- | --- |
| **TypeScript** (`interfaces` e `abstract classes`) | Garante **Inversão de Dependências**, **Aberto/Fechado** e contratos das **Portas** | **Strategy**, **Template Method**, **Factory** |
| **React + Shadcn UI** (`src/components/ui/`) | **SPA (Front-end)** e **Design System** reutilizável e consistente | **Observer** (Reatividade/Context) e cliente da **Facade** |
| **Supabase** (Auth, Postgres, Storage, Realtime) | Infraestrutura externa de persistência e mensageria | **Singleton** (Conexão), **Proxy** (Cache), **Facade** (Orquestração) |
| **API Gemini** (`ChatBot.tsx` e moderação) | Sistema externo de IA consumido via REST | **Adapter** (Tradução de API) e **Factory** (Instanciação) |

> Oferta original: escolher um dos fluxos (ex.: ChatBot com Gemini + Adapter, ou Entrega de Atividade com Facade) e gerar o arquivo completo integrado aos hooks atuais de `src/hooks/`.
