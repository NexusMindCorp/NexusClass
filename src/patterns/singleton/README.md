# Singleton (`src/lib/supabaseClient.ts`)

- **Categoria GoF:** Criacional (*Creational Pattern*)
- **Implementação Real:** [`src/lib/supabaseClient.ts`](../../lib/supabaseClient.ts)
- **Status:** **Concluído / Documentado (Fase 5 — ADR-007)**

## 1. Problema Real que Resolve
Diversos módulos do NexusClass consomem simultaneamente o Supabase para:
- Autenticação e sessão JWT (`useAuth.ts`, `useConfiguracoesAvancadas.ts`)
- Consultas e mutações PostgreSQL (`EntregaAtividadeFacade.ts`, `useDuvidas.ts`, `useMural.ts`, `useCalendario.ts`, `useSuporte.ts`, `carregamentoDados.ts`)
- Armazenamento de objetos no Supabase Storage (`EntregaAtividadeFacade.ts`, `useMural.ts`, `useDuvidas.ts`)
- Subscrição de canais WebSocket no Supabase Realtime (`conectarCanaisMuralRealtime`, `conectarCanalAlertasCalendarioRealtime`, `conectarCanalMensagensRealtime` em `NotificacaoSubject.ts`)

Se cada hook ou fachada chamasse `createClient(__URL_SUPABASE__, __KEY_SUPABASE__)` por conta própria, a aplicação abriria múltiplas conexões WebSocket concorrentes, duplicaria *listeners* de renovação de token (`onAuthStateChange`) e geraria avisos de múltiplas instâncias GoTrueClient no navegador.

## 2. Como Funciona no NexusClass (Singleton Idiomático em ES Modules)
```ts
// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js"
export const hasSupabaseConfig = Boolean(__URL_SUPABASE__ && __KEY_SUPABASE__)
export const supabase = createClient(__URL_SUPABASE__, __KEY_SUPABASE__)
```

Na especificação ECMAScript Modules (ESM), um módulo é **avaliado uma única vez** pelo runtime/bundler (Vite/Rollup) e suas exportações (`supabase` e `hasSupabaseConfig`) ficam armazenadas em cache no grafo de módulos. Qualquer `import { supabase } from "@/lib/supabaseClient"` em qualquer parte do sistema recebe **exatamente a mesma referência em memória**.

## 3. Decisão de Engenharia (Por que não criar uma classe `SupabaseSingleton`?)
Conforme registrado no [ADR-007](../../../.agents/decisions/adr-007-singleton-proxy-nativos-e-diagrama-uml.md) e no plano mestre (`.docs/PLANEJAMENTO_REFATORACAO.md`), envolver `createClient` em uma classe artificial estilo Java (`class SupabaseSingleton { private static instance... getInstance() }`) seria **overengineering** em TypeScript moderno, pois o próprio sistema de módulos ES já garante unicidade de instância com menor complexidade ciclomática.

## 4. Testabilidade e Cobertura
- As variáveis globais de build (`__URL_SUPABASE__` e `__KEY_SUPABASE__`) são isoladas em [`setupTests.ts`](../../../setupTests.ts) via `vi.stubGlobal`, garantindo **100% de cobertura** de `src/lib/supabaseClient.ts` sem conectar a servidores reais.
- Nos padrões de fronteira (`EntregaAtividadeFacade` e conectores de `NotificacaoSubject`), a instância singleton `supabase` funciona como valor padrão (*default parameter*), permitindo injetar clientes *fake/mock* determinísticos nos testes unitários.
