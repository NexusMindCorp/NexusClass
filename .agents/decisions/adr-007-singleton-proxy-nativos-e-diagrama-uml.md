# ADR-007: Catalogação Formal de Singleton (`supabaseClient`) e Protection Proxy (`ProtectedRoute` / `BoxRestrito`) Nativos e Estereótipos no Diagrama UML

- **Data:** 2026-11-05
- **Autor / Responsável:** Gianlucca Paiva (`GianluccaPaiva`)
- **Status:** Implementado
> ADR aprovada nunca é reescrita; cria-se nova e marca-se a anterior como substituída.

## 1. Contexto e Motivação
O planejamento da disciplina DCC061 (`.docs/PLANEJAMENTO_REFATORACAO.md`) estabelece que cada padrão de projeto deve responder a uma necessidade real da arquitetura, proibindo *overengineering*. Ao analisar o código do NexusClass para os padrões **Singleton** e **Proxy de Proteção**, constatamos que:
1. O módulo `src/lib/supabaseClient.ts` já instancia e exporta uma instância única `supabase = createClient(__URL_SUPABASE__, __KEY_SUPABASE__)` compartilhada por toda a aplicação graças ao cache nativo de módulos ES (*ES Module Singleton*).
2. Os componentes `src/components/ProtectedRoute.tsx` e `src/components/BoxRestrito.tsx` (consumido em `src/components/ConfiguracoesAvancadas.tsx`) já atuam como **Protection Proxies** na camada de navegação e visualização, interceptando o acesso ao `LayoutPrincipal` e às configurações exclusivas de alunos antes de montar os componentes-alvo.
3. O diagrama de classes `out/diagramas/diagrama_classes_detalhado.puml` estava desatualizado em relação às refatorações das Fases 1 a 4 e não exibia os estereótipos GoF (`<<Adapter>>`, `<<Factory>>`, `<<Facade>>`, `<<Strategy>>`, `<<Observer>>`, `<<Singleton>>`, `<<Proxy>>`).

## 2. Decisão Arquitetural
1. **Preservar as implementações idiomáticas existentes (Zero Overengineering):**
   - Não criar uma classe `SupabaseSingleton` com `getInstance()` privado, pois em TypeScript/ES Modules a exportação `export const supabase = createClient(...)` já garante avaliação única, compartilhamento de sessão Auth e multiplexação de canais WebSocket Realtime.
   - Não criar classes intermediárias extras para `ProtectedRoute` e `BoxRestrito`, preservando o idioma declarativo do React Router v7 (`<Route element={<ProtectedRoute />}>` + `<Outlet context={...} />`).
2. **Documentação Arquitetural Completa (`src/patterns/singleton/README.md`, `src/patterns/proxy/README.md`, `src/patterns/README.md`):**
   - Documentar estrutura, participantes GoF, trechos reais do código, justificativa de engenharia e estratégia de testes de ambos os padrões.
3. **Atualização do Diagrama de Classes PlantUML (`out/diagramas/diagrama_classes_detalhado.puml`):**
   - Incorporar todos os módulos de `src/patterns/` (`GeminiAdapter`, `BotFactory`, `EntregaAtividadeFacade`, `FiltroStrategy`, `NotificacaoSubject`) e marcar explicitamente os 7 padrões com estereótipos UML (`<<Adapter>>`, `<<Factory>>`, `<<Facade>>`, `<<Strategy>>`, `<<Observer>>`, `<<Singleton>>`, `<<Proxy>>`), corrigindo comentários inválidos (`%%` → `'`).

## 3. Alternativas Consideradas e Descartadas (Anti-Decisões)
| Alternativa | Motivo do descarte |
|:---|:---|
| Criar classe `class SupabaseClientSingleton { private static instance... }` (como sugerido em `AnaliseDePossiveisDP.md`) | Redundante em ES Modules; quebraria imports existentes sem trazer nenhum ganho real de memória ou testabilidade |
| Duplicar a lógica de controle de sessão em uma classe Proxy fora do React Router | Incompatível com o ciclo de vida declarativo de rotas (`<Navigate />` e `<Outlet />`) do React Router v7 |

## 4. Mapeamento de Arquivos
- `src/lib/supabaseClient.ts` (Singleton nativo documentado)
- `src/components/ProtectedRoute.tsx` e `src/components/BoxRestrito.tsx` (Protection Proxies nativos documentados)
- `src/patterns/singleton/README.md`
- `src/patterns/proxy/README.md`
- `src/patterns/README.md`
- `out/diagramas/diagrama_classes_detalhado.puml`
- `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`

## 5. Antes vs. Depois
- **Antes:** `src/patterns/singleton/README.md` e `src/patterns/proxy/README.md` continham apenas rascunhos preliminares; `src/patterns/README.md` listava os padrões como `"Planejado"`; `out/diagramas/diagrama_classes_detalhado.puml` refletia apenas a arquitetura pré-refatoração sem as classes de `src/patterns/`.
- **Depois:** Documentação completa dos 7 padrões GoF em `src/patterns/`, tabela mestre sincronizada e diagrama de classes UML atualizado com pacotes, relacionamentos e estereótipos dos 7 padrões.

## 6. Análise de Risco e Mitigação
- **Risco:** Confundir o Protection Proxy de frontend (`ProtectedRoute` / `BoxRestrito`) com um mecanismo de segurança suficiente por si só.
- **Mitigação:** A documentação explicita que o Protection Proxy no SPA atua para controle de navegação/UX e prevenção de renderização indevida, enquanto a autorização de dados definitiva é imposta pelo **Row Level Security (RLS)** no PostgreSQL/Supabase.

## 7. Consequências (Trade-offs)
- **Positivas:** Coerência arquitetural total entre o código real, a aba interativa DCC061 e o diagrama de classes UML; demonstração clara de maturidade ao evitar *overengineering*.
- **Negativas:** Nenhuma.

## 8. Comandos de Rollback
`git checkout -- src/patterns/ out/diagramas/diagrama_classes_detalhado.puml src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`
