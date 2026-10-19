# Singleton (documentado — já existe)

**Por quê:** várias partes do app usam o Supabase; múltiplos clientes duplicariam conexões Realtime e sessão.

**Como funciona aqui:** `src/lib/supabaseClient.ts` exporta `supabase = createClient(...)`. Em módulos ES, o módulo é avaliado uma única vez, então a instância é única sem classe nem construtor privado. Criar uma classe `SupabaseSingleton` seria overengineering.

**Onde:** [`src/lib/supabaseClient.ts`](../../lib/supabaseClient.ts)
**Status:** Documentado (Fase 5)
