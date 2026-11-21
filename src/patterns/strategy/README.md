# Strategy (`FiltroStrategy` & `SanitizacaoStrategy`)

## 1. Filtros de Domínio (`FiltroStrategy` — Fase 3)

**Por quê:** Antes da Fase 3, as regras de filtragem de turmas (`Inscritas`, `Disponíveis`, `Todas` + busca por matéria, professor, sala e código) estavam divididas entre `src/hooks/PesquisaHooks/usePesquisa.ts` e condicionais inline em `src/components/Pesquisar.tsx`. Da mesma forma, os filtros da Central de Dúvidas por papel (`aluno`, `professor`, `master`) e por status (`todas`, `pendentes`, `resolvidas`) estavam acoplados e duplicados em `src/components/DuvidasBox.tsx` e `src/components/AppSidebar.tsx`.

**Como funciona (`src/patterns/strategy/FiltroStrategy.ts`):**
- Contrato genérico `FiltroStrategy<T, Contexto = void>` com método `filtrar(itens: readonly T[], contexto: Contexto): T[]`.
- **Domínio de Turmas (`TurmaEntry`):**
  - `FiltroTurmaPorTextoStrategy`: busca case-insensitive por matéria, professor, sala ou código.
  - `FiltroTurmasInscritasStrategy` (`minhas`), `FiltroTurmasDisponiveisStrategy` (`disponiveis`) e `FiltroTodasTurmasStrategy` (`todas`), selecionadas via `obterEstrategiaFiltroTurma(abaAtiva, role)` e compostas em `filtrarEOrdenarTurmas`.
- **Domínio de Dúvidas (`Duvida`):**
  - `FiltroDuvidasPorPerfilStrategy`: isola a regra de visibilidade por papel (`aluno`, `professor`, `master` ou `null`).
  - `FiltroTodasDuvidasStrategy` (`todas`), `FiltroDuvidasPendentesStrategy` (`pendentes`) e `FiltroDuvidasResolvidasStrategy` (`resolvidas`), selecionadas via `obterEstrategiaStatusDuvida(status)` e compostas em `filtrarDuvidasPorPerfilEStatus`.

**Status:** **Concluído (Fase 3)** — 100% de cobertura em `testes/patterns/strategy/filtroStrategy.spec.ts`.

---

## 2. Sanitização Contextual OWASP XSS (`SanitizacaoStrategy` — Fase 6)

**Por quê:** A prevenção contra XSS (OWASP Cheat Sheet Series) exige algoritmos distintos conforme o contexto de destino — normalizar texto livre sem corromper operadores legítimos (`<`, `>`, `&`, `"`), restringir URLs por allowlist estrita `http(s):` e aplicar *HTML Entity Encoding* apenas em saídas HTML literais. Centralizar essas regras sob o padrão **Strategy (GoF)** evita regexes espalhadas, dispensa dependências externas desnecessárias (`DOMPurify` não é necessário por haver **0 usos** de `dangerouslySetInnerHTML`/`innerHTML`) e mantém toda a lógica testável em Nível 2 RBT (zero I/O).

**Como funciona (`src/patterns/strategy/SanitizacaoStrategy.ts`):**
- Contrato genérico `SanitizacaoStrategy<TEntrada = string, TSaida = string>` (`contexto: "texto" | "url" | "html"`, `sanitizar(entrada: TEntrada): TSaida`) e executor `executarSanitizacao(entrada, estrategia)`.
- **3 Estratégias Concretas Puras:**
  - `TextoEntradaStrategy` (`sanitizarTextoLinhaUnica`, `sanitizarTextoMultilinha`): remove bytes nulos e caracteres de controle ASCII invisíveis, normaliza quebras de linha e aplica `trim`/`maxLength` preservando `<`, `>`, `&` e `"` legítimos.
  - `UrlHttpSeguraStrategy` (`obterUrlHttpSegura`, `exigirUrlHttpSeguraOuNula`): allowlist estrita `http:`/`https:` (com suporte opcional a caminhos relativos seguros `/...`), bloqueando `javascript:`, `data:`, `vbscript:`, `file:`, espaços, caracteres de controle e credenciais embutidas.
  - `EscapeHtmlStrategy` (`escaparHtml`): converte `&`, `<`, `>`, `"` e `'` em entidades HTML seguras para contextos HTML literais.
- **Integração na aplicação:**
  - **Repositories de escrita:** `PerfilRepository`, `MuralRepository`, `DuvidaRepository`, `AtividadeRepository` e `ComunicacaoRepository` (normalização de entradas de texto e validação de `foto_url`).
  - **Pontos de saída/UI:** `PerfilAvatar.tsx`, `BoxEntregaAtividade.tsx`, `DuvidasBox.tsx` e `Mural.tsx` (proteção de `src`/`href`/`window.open`).
  - **Defesa em profundidade:** pareada com escape HTML + anti-CRLF + `rel="noopener noreferrer"` nas Edge Functions `resend-email` e `resend-suport`, cabeçalhos CSP em `vercel.json` e migração `16_protecao_urls_e_entradas.sql` no PostgreSQL.

**Status:** **Concluído (Fase 6 — Hardening XSS, 2026-11-21, Gianlucca Paiva / `GianluccaPaiva`)** — **100% Stmts / 97.87% Branch / 100% Funcs / 100% Lines** em `testes/patterns/strategy/sanitizacaoStrategy.spec.ts` (8 testes).
