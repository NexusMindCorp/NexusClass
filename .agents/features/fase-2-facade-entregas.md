# Feature: Fase 2 — Padrão Facade na Entrega e Avaliação de Atividades (`EntregaAtividadeFacade`)

- **Registro:** 2026-11-05
- **Autor / Responsável:** Gabriel Lineker (`GabrielLineker`)
- **Status:** Concluído
- **Risco (RBT):** Nível 2 (`higienizarNomeArquivo`, `construirCaminhoArquivo`, `normalizarEntregasComPerfis` — lógica pura) | Nível 3 (`EntregaAtividadeFacade` + `useEntregas` — fronteira com Supabase Storage e PostgreSQL)
- **Validação:** `npx tsc -b --noEmit` + `npx vitest run testes/patterns/facade/ --silent` + `npm run test:coverage`

## 1. Visão Geral
1. **Padrão Facade (`src/patterns/facade/EntregaAtividadeFacade.ts`):** Criar a fachada `EntregaAtividadeFacade` implementando o contrato `IEntregaAtividadeFacade`, unificando e ocultando a orquestração entre dois subsistemas distintos do Supabase:
   - **Supabase Storage (`entregas_atividades`):** higienização determinística de nome de arquivo (`replace(/[^a-zA-Z0-9.-]/g, "_")`), montagem do path `{atividade_id}/{aluno_id}/{timestamp}-{nomeLimpo}`, upload com `{ upsert: true }` e geração de URL assinada (`createSignedUrl(caminho, 3600)`).
   - **PostgreSQL (`entregas_atividades`):** `upsert` de submissão/reenvio com resolução de conflito `onConflict: "atividade_id,aluno_id"`, consulta por papel (`maybeSingle` para `aluno` vs. listagem ordenada com join `perfis:aluno_id(nome)` e fallback `"Aluno Anônimo"` para `professor`/`master`) e `update` de avaliação docente (`nota`, `feedback`, `updated_at`).
2. **Desacoplamento de `useEntregas.ts` (`src/hooks/EntregasHooks/useEntregas.ts`):** Refatorar o hook para gerenciar exclusivamente o estado React (`entregaPropria`, `todasEntregas`, `loading`, `uploading`) e as notificações visuais (`toast` do `sonner`), delegando todas as operações de subsistema à `IEntregaAtividadeFacade` (com injeção opcional para testes sem rede) e eliminando todos os usos de `any`.
3. **Suíte de Testes Automatizados (`testes/patterns/facade/entregaAtividadeFacade.spec.ts`):** Criar testes unitários puros (Nível 2 RBT) para as transformações determinísticas e testes de fronteira/integração (Nível 3 RBT) com cliente Supabase mockado na borda e `FakeEntregaFacade` para o hook `useEntregas` (15 testes).

## 2. Não-Objetivos (Non-Goals)
- Não alterar a interface visual, estrutura JSX ou textos interativos de `src/components/BoxEntregaAtividade.tsx`.
- Não alterar políticas de RLS ou triggers de prazo (`no_prazo`) do banco PostgreSQL/Supabase.
- Não introduzir chamadas artificiais de IA na entrega (conforme §5 de `.docs/PLANEJAMENTO_REFATORACAO.md`).

## 3. UI/UX (consistência arquitetural)
- O contrato retornado por `useEntregas(atividadeId, perfil)` (`entregaPropria`, `todasEntregas`, `loading`, `uploading`, `enviarEntrega`, `avaliarEntrega`, `obterLinkArquivo`, `recarregar`) permanece 100% compatível com `BoxEntregaAtividade.tsx`.
- Atualização dos slides interativos em `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`.

## 4. Acessibilidade
- Nenhuma alteração em elementos visuais ou atributos de acessibilidade de `BoxEntregaAtividade.tsx`.

## 5. Desempenho e Segurança
- Higienização estrita de nomes de arquivos (`[^a-zA-Z0-9.-]` → `_`) antes do upload no bucket `entregas_atividades`.
- Interrupção imediata do fluxo caso o upload no Storage falhe, evitando gravação de registros órfãos ou inconsistentes na tabela `entregas_atividades`.
- Geração de links temporários assinados (`createSignedUrl` com expiração de 3600s) preservada.

## 6. Arquivos Tocados
- `.agents/features/fase-2-facade-entregas.md` (novo)
- `.agents/decisions/adr-004-facade-entrega-atividades.md` (novo)
- `.agents/INICIALIZACAO.md`
- `src/patterns/facade/EntregaAtividadeFacade.ts` (novo)
- `src/patterns/facade/README.md`
- `src/hooks/EntregasHooks/type.ts`
- `src/hooks/EntregasHooks/useEntregas.ts`
- `testes/patterns/facade/entregaAtividadeFacade.spec.ts` (novo)
- `.docs/DOCUMENTACAO_APRESENTACAO.md`
- `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts`
- `relatorios/2026-11/2026-11-05-fase-2-facade-entregas.md` (novo)

## 7. Matriz de Risco
| Componente/Alvo | Nível RBT | Estratégia |
|:---|:---|:---|
| `EntregaAtividadeFacade` (métodos estáticos puros) | Nível 2 (Lógica Pura) | Testes unitários determinísticos para higienização de nome, montagem de caminho e normalização de `perfis` (`aluno_nome`) |
| `EntregaAtividadeFacade` (submissão, consulta, avaliação, download) | Nível 3 (Fronteira Externa) | Testes com mock na borda de `IEntregaSupabaseClient` validando coordenação Storage + DB, aborto em falha de upload, `onConflict: "atividade_id,aluno_id"` e `vi.useFakeTimers()` |
| `src/hooks/EntregasHooks/useEntregas.ts` | Nível 3 (Integração Hook + Facade) | Testes com `FakeEntregaFacade` validando estados (`loading`, `uploading`, `entregaPropria`, `todasEntregas`) e disparo de `toast.success` / `toast.error` |

## 8. Validação
- [x] Typecheck (`npx tsc -b --noEmit`)
- [x] Testes da feature (`npx vitest run testes/patterns/facade/ --silent`)
- [x] Sem regressão (`npx vitest run` e `npm run test:coverage` — 5 suítes / 66 testes passando, 100% de cobertura em `src/lib` e `src/patterns`)
- [x] `.docs/DOCUMENTACAO_APRESENTACAO.md` e `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts` atualizados

## 9. Procedimento de Rollback
Reverter `src/hooks/EntregasHooks/useEntregas.ts` e `src/hooks/EntregasHooks/type.ts`, e remover `src/patterns/facade/EntregaAtividadeFacade.ts` e `testes/patterns/facade/entregaAtividadeFacade.spec.ts`.
