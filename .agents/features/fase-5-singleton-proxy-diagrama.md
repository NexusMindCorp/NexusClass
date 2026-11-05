# Feature: Fase 5 — Documentação Arquitetural de Singleton (`supabaseClient.ts`) e Protection Proxy (`ProtectedRoute` / `BoxRestrito`) + Diagrama de Classes UML

- **Registro:** 2026-11-05
- **Autor / Responsável:** Gianlucca Paiva (`GianluccaPaiva`)
- **Status:** Concluído
- **Risco (RBT):** Nível 1 / Arquitetural (Catalogação formal de padrões nativos existentes + Diagrama PlantUML com estereótipos GoF; testes de componente para `ProtectedRoute` e `BoxRestrito` agendados para a Fase 6)
- **Validação:** `npx tsc -b --noEmit` (após atualizar `configEngenhariaSoftware.ts`) + `npm run test:run`

## 1. Visão Geral
1. **Documentação Técnica do Padrão Singleton (`src/patterns/singleton/README.md`):**
   - Documentar formalmente o módulo `src/lib/supabaseClient.ts` (`hasSupabaseConfig` e `supabase = createClient(...)`) como **Singleton idiomático via cache de ES Modules**.
   - Explicar os participantes GoF, o motivo de rejeitar uma classe `SupabaseSingleton.getInstance()` artificial (prevenção de *overengineering*), os pontos de consumo no sistema (`useAuth`, `EntregaAtividadeFacade`, `useDuvidas`, conectores Realtime de `NotificacaoSubject`, `useCalendario`, `useSuporte`, `carregamentoDados`) e como a fronteira é isolada nos testes automatizados (`setupTests.ts` + injeção de clientes nas fachadas/conectores).
2. **Documentação Técnica do Padrão Protection Proxy (`src/patterns/proxy/README.md`):**
   - Documentar formalmente os dois níveis de **Protection Proxy** já existentes na arquitetura:
     - **Proxy de Rota (`src/components/ProtectedRoute.tsx`):** intercepta o acesso ao `LayoutPrincipal` (*Real Subject*) em `src/App.tsx`, exibindo *spinner* enquanto `loading === true`, redirecionando para `/login` quando `!session` e repassando o contexto autenticado via `<Outlet context={...} />`.
     - **Proxy de Papel/Visualização (`src/components/BoxRestrito.tsx` em `src/components/ConfiguracoesAvancadas.tsx`):** bloqueia a renderização de áreas exclusivas de estudante (`perfil?.role === "aluno"`) para outros papéis, complementando a segurança de banco garantida pelo RLS (*Row Level Security*) do PostgreSQL/Supabase.
3. **Atualização do Catálogo de Padrões (`src/patterns/README.md`):**
   - Atualizar o status de todos os 7 padrões GoF do projeto (`Adapter`, `Factory`, `Facade`, `Strategy`, `Observer`, `Singleton` e `Proxy`) para refletir as entregas concluídas nas Fases 1 a 5.
4. **Atualização do Diagrama de Classes UML (`out/diagramas/diagrama_classes_detalhado.puml`):**
   - Atualizar o diagrama PlantUML da arquitetura adicionando todas as interfaces/classes de `src/patterns/` e aplicando os estereótipos `<<Singleton>>`, `<<Proxy>>`, `<<Adapter>>`, `<<Factory>>`, `<<Facade>>`, `<<Strategy>>` e `<<Observer>>`, além de corrigir a sintaxe de comentários PlantUML.
5. **Atualização dos Slides Interativos e Documentação Viva:**
   - Atualizar `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts` e `.docs/DOCUMENTACAO_APRESENTACAO.md` marcando a Fase 5 como **Concluído**.

## 2. Não-Objetivos (Non-Goals)
- Não criar classes invólucro redundantes para `supabaseClient.ts` ou `ProtectedRoute.tsx` (decisão fundacional de não praticar *overengineering* em `.docs/PLANEJAMENTO_REFATORACAO.md`).
- Os testes de componente com Testing Library para `ProtectedRoute`, `BoxRestrito` e filtro de dúvidas pertencem ao escopo da **Fase 6**.

## 3. UI/UX (consistência arquitetural)
- Atualização do card `"6 & 7. Singleton e Proxy (Documentados)"`, do roadmap e do cabeçalho da aba *Informações → Engenharia de Software (DCC061)* em `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`.

## 4. Acessibilidade
- Nenhuma alteração em componentes visuais.

## 5. Desempenho e Segurança
- Documenta explicitamente a defesa em profundidade: `ProtectedRoute` e `BoxRestrito` protegem a experiência e navegação no cliente, enquanto o **PostgreSQL Row Level Security (RLS)** garante a autorização real no banco de dados.

## 6. Arquivos Tocados
- `.agents/features/fase-5-singleton-proxy-diagrama.md` (novo)
- `.agents/decisions/adr-007-singleton-proxy-nativos-e-diagrama-uml.md` (novo)
- `.agents/INICIALIZACAO.md`
- `src/patterns/singleton/README.md`
- `src/patterns/proxy/README.md`
- `src/patterns/README.md`
- `out/diagramas/diagrama_classes_detalhado.puml`
- `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`
- `.docs/DOCUMENTACAO_APRESENTACAO.md`
- `relatorios/2026-11/2026-11-05-fase-5-singleton-proxy-diagrama.md` (novo)

## 7. Matriz de Risco
| Componente/Alvo | Nível RBT | Estratégia |
|:---|:---|:---|
| `src/lib/supabaseClient.ts` (Singleton) | Nível 2 / 3 | Validado em `testes/lib/utils.spec.ts` (100% de cobertura) e isolado por injeção nas Fases 2 e 4 |
| `ProtectedRoute.tsx` & `BoxRestrito.tsx` (Protection Proxy) | Nível 3 (Componente) | Catalogado e modelado no diagrama UML na Fase 5; testes de componente via Testing Library na Fase 6 |
| `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts` | Nível 1 | Validação estática obrigatória via `npx tsc -b --noEmit` |

## 8. Validação
- [x] Typecheck (`npx tsc -b --noEmit`) após atualizar `configEngenhariaSoftware.ts`
- [x] Sem regressão (`npm run test:run` — 7 suítes / 89 testes passando, 100% de cobertura em `src/lib` e `src/patterns`)
- [x] Diagrama UML `out/diagramas/diagrama_classes_detalhado.puml` atualizado com os 7 estereótipos GoF
- [x] `.docs/DOCUMENTACAO_APRESENTACAO.md` e `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts` atualizados

## 9. Procedimento de Rollback
Reverter `src/patterns/singleton/README.md`, `src/patterns/proxy/README.md`, `src/patterns/README.md`, `out/diagramas/diagrama_classes_detalhado.puml` e `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`.
