# ADR-004: Padrão Facade (`EntregaAtividadeFacade`) para Submissão, Consulta e Avaliação de Entregas

- **Data:** 2026-11-05
- **Autor / Responsável:** Gabriel Lineker (`GabrielLineker`)
- **Status:** Implementado
> ADR aprovada nunca é reescrita; cria-se nova e marca-se a anterior como substituída.

## 1. Contexto e Motivação
No código original (`src/hooks/EntregasHooks/useEntregas.ts`), o hook `useEntregas` acumulava a gestão de estado da interface React (`entregaPropria`, `todasEntregas`, `loading`, `uploading` e chamadas ao `toast` do `sonner`) com a orquestração direta de dois subsistemas de infraestrutura do Supabase:
1. **Subsistema de Armazenamento de Arquivos (`supabase.storage.from("entregas_atividades")`):** higienização do nome original do arquivo via regex, geração do caminho hierárquico `${atividadeId}/${alunoId}/${timestamp}-${nomeLimpo}`, upload binário com `{ upsert: true }` e criação de URLs assinadas (`createSignedUrl(caminho, 3600)`).
2. **Subsistema de Banco de Dados Relacional (`supabase.from("entregas_atividades")`):** persistência atômica da entrega via `upsert` com chave composta `onConflict: "atividade_id,aluno_id"`, consultas diferenciadas por papel (`maybeSingle` para `aluno` e `select("*, perfis:aluno_id(nome)")` para `professor`/`master`), normalização de `aluno_nome` (com fallback `"Aluno Anônimo"`) e atualização de nota/feedback pelo professor.

Além disso, o hook dependia diretamente do singleton global `supabase` e utilizava tipagem `any` no mapeamento de registros e tratamento de erros, impedindo testar o fluxo de entrega e reenvio sem acesso à rede.

## 2. Decisão Arquitetural
1. **Contrato `IEntregaAtividadeFacade` e Fachada `EntregaAtividadeFacade` (`src/patterns/facade/EntregaAtividadeFacade.ts`):**
   - Criar uma fachada coesa que unifica a interação com o bucket `entregas_atividades` (Storage) e a tabela `entregas_atividades` (PostgreSQL) por trás de operações de domínio claras:
     - `submeter({ atividadeId, alunoId, arquivo }): Promise<ResultadoSubmissaoEntrega>`
     - `carregarEntregas(atividadeId, perfil): Promise<ResultadoCarregamentoEntregas>`
     - `avaliar({ atividadeId, alunoId, nota, feedback }): Promise<void>`
     - `obterUrlDownload(caminho, expiraEmSegundos?): Promise<string | null>`
   - Expor métodos estáticos determinísticos (`higienizarNomeArquivo`, `construirCaminhoArquivo`, `normalizarEntregasComPerfis`) para permitir testes unitários puros de Nível 2 RBT.
   - Aceitar injeção opcional de `IEntregaSupabaseClient` no construtor da `EntregaAtividadeFacade` (usando o cliente `supabase` real por padrão), permitindo testes de fronteira (Nível 3 RBT) sem rede.
2. **Injeção Opcional no Hook (`useEntregas`):**
   - Refatorar `useEntregas(atividadeId, perfil, facadeOpcional?)` para delegar todas as operações de infraestrutura à `IEntregaAtividadeFacade`, mantendo o hook responsável apenas por estado React e toasts, e preservando 100% da assinatura consumida por `BoxEntregaAtividade.tsx`.

## 3. Alternativas Consideradas e Descartadas (Anti-Decisões)
| Alternativa | Motivo do descarte |
|:---|:---|
| Seguir literalmente o rascunho de `AnaliseDePossiveisDP.md` (bucket `arquivos_atividades`, tabela `entregas`, `getPublicUrl` e chamada de IA na entrega) | O banco real usa o bucket e a tabela `entregas_atividades`, URLs assinadas (`createSignedUrl`) por segurança e `upsert` com `onConflict: "atividade_id,aluno_id"`. Chamar IA na entrega seria artificial e consumiria cota sem necessidade real |
| Manter chamadas de Storage e SQL dentro de `useEntregas.ts` e mockar `@/lib/supabaseClient` globalmente nos testes do hook | Continuaria violando o SRP no hook e acoplaria os testes da camada de apresentação aos detalhes internos do encadeamento fluente (`.from().select().eq().maybeSingle()`) do cliente Supabase |

## 4. Mapeamento de Arquivos
- `src/patterns/facade/EntregaAtividadeFacade.ts`
- `src/patterns/facade/README.md`
- `src/hooks/EntregasHooks/type.ts`
- `src/hooks/EntregasHooks/useEntregas.ts`
- `testes/patterns/facade/entregaAtividadeFacade.spec.ts`

## 5. Antes vs. Depois
- **Antes:** `useEntregas.ts` (152 linhas) coordenava diretamente `supabase.storage` e `supabase.from("entregas_atividades")`, usava `any` em 4 pontos e possuía `0%` de cobertura de testes automatizados.
- **Depois:** `EntregaAtividadeFacade.ts` encapsula e tipa estritamente toda a coordenação entre Storage e PostgreSQL; `useEntregas.ts` fica enxuto e testável via `IEntregaAtividadeFacade`; suíte `entregaAtividadeFacade.spec.ts` cobre 100% da fachada e do fluxo do hook.

## 6. Análise de Risco e Mitigação
- **Risco:** Falha no upload do arquivo gravar registro inválido no banco ou quebra na exibição do nome do arquivo entregue em `BoxEntregaAtividade.tsx`.
- **Mitigação:** A fachada valida o erro do Storage antes de chamar `upsert` no banco e preserva o formato exato do caminho `${atividadeId}/${alunoId}/${Date.now()}-${nomeLimpo}` esperado pelo `.split("/").pop()?.replace(/^\d+-/, "")` de `BoxEntregaAtividade.tsx`.

## 7. Consequências (Trade-offs)
- **Positivas:** Desacoplamento completo entre UI/Hook e o par Storage+PostgreSQL; eliminação de `any`; testes de integração de upload + `upsert` + avaliação executados em milissegundos.
- **Negativas:** Adição de um módulo em `src/patterns/facade/` (previsto no ADR-001).

## 8. Comandos de Rollback
`git checkout -- src/hooks/EntregasHooks/useEntregas.ts src/hooks/EntregasHooks/type.ts && rm -rf src/patterns/facade/EntregaAtividadeFacade.ts testes/patterns/facade/`
