# Planejamento — Refatoração com Design Patterns + Testes (DCC061)

**Branch:** `DesiningTeste` · **Temas:** Padrões de Projeto + Testes de Software · **Princípio:** sem overengineering — cada padrão resolve um problema real do código atual.
Fonte da verdade do sistema: `AnaliseMaisAtualDoSistema.md`. Os trechos de `AnaliseDePossiveisDP.md` são apenas inspiração (contêm erros; ver §5).

## 1. Padrões escolhidos

| # | Padrão | Problema real no código | Alvo (a confirmar na leitura cirúrgica) | Teste associado |
|:---|:---|:---|:---|:---|
| 1 | **Adapter** | Gemini SDK instanciado direto em `useChatBot.ts` (`new GoogleGenerativeAI(__API_GEMINI_KEY__)`); impossível testar sem rede | `src/hooks/botsHooks/` → `IAssistenteIA` + `GeminiAdapter` | Fake `IAssistenteIA` em testes do hook; testa retry 503 do adapter com SDK mockado |
| 2 | **Factory** | Dois bots (Tigreso/Falcão) com configs distintas em `configBot.ts`; tela ativa decidida por `acessouOq` em `GerenciadorTelas` | `BotFactory.create(tipo)` (+ opcional `TelaFactory`) | Unitário puro: tipo → config/prompt corretos |
| 3 | **Facade** | `useEntregas` mistura storage (`entregas_atividades/{atividade}/{aluno}/{arquivo}`), higienização de nome, `UPSERT` e regras de reenvio | `EntregaAtividadeFacade.submeter()` consumida por `BoxEntregaAtividade` | Integração com cliente Supabase mockado na borda |
| 4 | **Strategy** | Filtros em `usePesquisa` (Inscritas/Disponíveis/Todas + busca) e `useDuvidas` (Todos/Pendente/Resolvida) com condicionais | `FiltroStrategy<T>` concretas por critério | Unitários puros por estratégia |
| 5 | **Observer** | 5 canais Realtime dispersos (mural, atividades, entregas, mensagens, alertas) cada um com toast/atualização própria | `NotificacaoSubject` com observers (toast, badge) | Unitário do subject + hook com subject fake |
| 6 | **Singleton** *(documentar)* | `src/lib/supabaseClient.ts` já é cliente único por módulo | Sem nova classe | — (citar como Singleton idiomático em ES modules) |
| 7 | **Proxy de proteção** *(documentar)* | `ProtectedRoute` e `BoxRestrito` já controlam acesso | Sem nova classe | Teste de componente: sem sessão → redireciona `/login` |

**Descartados:** *Template Method* (formulários muito diferentes → seria forçado) e *Proxy de cache* (só se sobrar tempo, em `useEscolaDados`).

## 2. Estratégia de Testes (tema 2)
| Camada | Ferramenta | Alvo | Nível RBT |
|:---|:---|:---|:---|
| Unitário puro | Vitest | `src/lib/utils.ts` (datas, `extrairUrlsAnexo`, `formatarErroSupabase`, hashing), Strategies, Factories | 2 |
| Unitário com fake/mock de borda | Vitest | Adapter, Facade, Observer | 3 |
| Componente | Testing Library + user-event | `ProtectedRoute`, `BoxRestrito`, filtro de dúvidas | 3 |
| E2E | Playwright | login → entrar na turma → entregar atividade | 3 |
| Cobertura | `@vitest/coverage-v8` (pedir aval) | relatório antes/depois | — |
Convenções: ver `.agents/rules/testing-policy.md`. Testes em `testes/` (alias `@ts`).

## 3. Fases e Ordem
| Fase | Entrega | Critério de pronto |
|:---|:---|:---|
| 0 | Base de testes: stubs de globais em `setupTests.ts`, testes de `utils.ts`, baseline de cobertura | `vitest run` verde; baseline registrada |
| 1 | Adapter + Factory (bots) | Hook do chatbot testável sem rede; comportamento idêntico |
| 2 | Facade (entrega) | Componente chama só a Facade; testes de upload/upsert |
| 3 | Strategy (pesquisa/dúvidas) | Condicionais removidas; testes por estratégia |
| 4 | Observer (Realtime) | Toasts/badges via subject; sem regressão |
| 5 | Documentar Singleton e Proxy; atualizar diagrama `out/diagramas/diagrama_classes_detalhado.puml` com estereótipos | Diagrama + doc |
| 6 | Testes de componente + E2E + cobertura final | Relatório antes/depois |
| 7 | **Apresentação Interativa DCC061 na aplicação (`InfoAplicacao.tsx`)** + limpeza final da árvore Git | Seletor na aba *Informações* (`Modelagem de Sistemas` vs `Engenharia de Software`) mantendo identidade visual (`info-slide-card`, `InfoCard`, cores) com slides de Design Patterns (Antes/Depois) e Testes/Cobertura + pastas internas ocultadas do repo final |

Cada fase: spec em `.agents/features/`, ADR em `.agents/decisions/`, entrada em `DOCUMENTACAO_APRESENTACAO.md`.
- **Regra de Continuidade entre Fases (Trabalho em Dupla):** Como as fases são divididas entre os integrantes da dupla via Git, **toda atualização ou início de nova fase deve obrigatoriamente consultar o estado deixado pelo processo anterior** (bloco *Ponto de Retomada* em `.docs/DOCUMENTACAO_APRESENTACAO.md` + último relatório em `relatorios/<mes-ano>/` + suíte de testes existente) e continuar a partir dali, garantindo que novas implementações consumam os contratos, mocks e padrões já estabelecidos sem retrabalho nem regressão.
- **Limpeza Final pós-Fase 7 (Ocultar Governança na Entrega):** Durante as Fases 0 a 7, `.agents/`, `.docs/`, `relatorios/` e `AGENTS.md` ficam rastreados no Git para sincronizar a dupla. Ao concluir a Fase 7, executar:
  ```bash
  git rm -r --cached .agents .docs relatorios AGENTS.md
  ```
  Em seguida, readicionar esses 4 itens ao `.gitignore` e commitar (`chore: oculta arquivos internos de governanca da arvore final`), mantendo-os nos discos locais e no histórico de commits, mas deixando a raiz do repositório limpa para a entrega.

## 4. Decisões Fundacionais (ADR-001)
- ✅ Local dos padrões: `src/patterns/<padrao>/` com README por padrão (ADR-001, aprovado).
- ✅ `@vitest/coverage-v8@5.0.0` instalado (ADR-001); snapshot de cobertura a cada fase.
- ✅ E2E (Docker + Supabase local): deixado exclusivamente para a **Fase 6** (por último), com limpeza imediata pós-execução (`supabase stop --no-backup` + `docker system prune`). Caso o SSD primário aperte, o disco virtual do Docker pode ser movido para o SSD secundário (~180 GB livres).

## 5. Correções ao `AnaliseDePossiveisDP.md` (não copiar literalmente)
| Trecho | Problema | Correção |
|:---|:---|:---|
| Singleton class | Cliente já é único | Documentar o módulo existente |
| GeminiAdapter via `fetch` | Template string sem `$`; projeto usa SDK | Adapter envolve o SDK e o Function Calling atuais |
| Facade | Bucket `arquivos_atividades` / tabela `entregas` inexistentes; caminho sem `${}` | Usar `entregas_atividades` e caminho `{atividade_id}/{aluno_id}/{arquivo}` + `UPSERT` |
| Facade chamando IA | Artificial, custa API | Remover |
| Proxy/Observer | `turma_alunos`, `mural`, `perfis(*)` | Reais: `aluno_turma`, `mural_posts`, `perfis` |
| `any` e `console.log` | Violam guidelines | Tipagem forte, sem logs |

## 6. Riscos
- Refatorar sem testes → mitigado pela Fase 0.
- Overengineering → limite de 5 padrões implementados.
- Tempo de apresentação 15–20 min → priorizar 3–4 padrões bem demonstrados com antes/depois.

## 7. Entregáveis do trabalho
Documento-texto (DOCX/PDF, 2 temas: definição, histórico, importância, ferramentas, normas, profissões, certificações, impacto da IA) · código no Git · slides PDF. A doc viva `DOCUMENTACAO_APRESENTACAO.md` alimenta a parte prática.
