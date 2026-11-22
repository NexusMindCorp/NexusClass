# ADR-011: Hardening XSS/OWASP com Padrão Strategy (`SanitizacaoStrategy`) e Defesa em Profundidade

- **Data:** 2026-11-21
- **Autor:** Gianlucca Paiva (`GianluccaPaiva`)
- **Status:** Aceito e Implementado

---

## 1. Contexto
A auditoria de segurança combinando o pentest documentado em `Testes de segurança.pdf` (Reconhecimento, Burp Suite, Wapiti, SQLmap e Stored XSS) e as diretrizes da **OWASP Cheat Sheet Series** (`/owasp/cheatsheetseries` via Context7) identificou quatro lacunas concretas (`V-01` a `V-04`):
1. **V-01 (Alta):** `docker/edge_function/resend-email/source/index.ts` e `docker/edge_function/resend-suport/source/index.ts` interpolavam texto do usuário e links diretamente em templates HTML sem *HTML Entity Encoding*, sem proteção contra *CRLF header injection* no assunto e sem allowlist de protocolo.
2. **V-02 (Média–Alta):** URLs de imagem e anexo (`foto_url`, `banner_url` e links exibidos na UI) não possuíam validação estrita de protocolo `http:`/`https:`, permitindo strings como `javascript:` ou `data:text/html`.
3. **V-03 (Média — Wapiti):** `vercel.json` não definia cabeçalhos HTTP de segurança (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`).
4. **V-04 (Baixa–Média):** Os 5 Repositories de escrita gravavam strings livres sem normalização unificada contra bytes nulos (`\u0000`) e caracteres de controle ASCII invisíveis.

## 2. Decisão
Aplicar **defesa em profundidade** reutilizando o padrão GoF **Strategy** (estendendo o catálogo da Fase 3 / ADR-005) **sem adicionar dependências externas**:
1. **Novo módulo puro `src/patterns/strategy/SanitizacaoStrategy.ts`:**
   - Contrato genérico `SanitizacaoStrategy<TEntrada, TSaida>` + executor `executarSanitizacao`.
   - 3 estratégias concretas puras:
     - `TextoEntradaStrategy`: remove bytes nulos e caracteres de controle invisíveis, preservando `\n`, `\r`, `\t`, `<`, `>`, `&` e `"` (conforme OWASP, **não** aplicar HTML-escaping antes de gravar no banco para não corromper fórmulas e códigos acadêmicos).
     - `UrlHttpSeguraStrategy`: allowlist estrita `http:`/`https:` (bloqueando `javascript:`, `data:`, `vbscript:`, `file:`, espaços, caracteres de controle e credenciais embutidas).
     - `EscapeHtmlStrategy`: *HTML Entity Encoding* (`&`, `<`, `>`, `"`, `'`) para contextos HTML literais.
2. **Dispensa formal de `DOMPurify` (Combate ao Overengineering):** o código `src/` possui **`0` ocorrências** de `dangerouslySetInnerHTML` ou `innerHTML`, e o React 19 faz auto-escaping nativo no JSX. Introduzir `DOMPurify` adicionaria dependência desnecessária sem problema real.
3. **Hardening em todas as camadas:**
   - **Edge Functions (`V-01`):** refatoradas em `supabase/functions/resend-{email,suport}/index.ts` (espelhadas em `docker/edge_function/`) com autenticação JWT (`verify_jwt: true`), leitura direta no banco com checagem de titularidade (`id_autor` / `id_perfil === user.id` ou `master`), resolução de perfis reais e anexos 1FN com URLs assinadas (7 dias) via `v_storage_objetos`, suporte a múltiplos destinatários (`DESTINATARIO_EMAIL`), templates HTML responsivos com `escaparHtml()`, anti-CRLF no assunto, validação `http(s):` e `rel="noopener noreferrer"`; disparo *best-effort* integrado em `ComunicacaoRepository.ts` (`comunicacaoRepository.spec.ts`) e envio real validado via `scripts/validar-envio-resend.mjs` (`HTTP 200` para ambos os templates).
   - **PostgreSQL (`V-02` / `V-04`):** migração `docker/constructionsSQL/16_protecao_urls_e_entradas.sql` (2 constraints de URL + 8 constraints `ck_*_texto_sem_controle`, todas `NOT VALID` e idempotentes) consolidada em `01_esquema.sql`, validada ao vivo sob `ROLLBACK`.
   - **Hospedagem (`V-03`):** cabeçalhos HTTP de segurança configurados em `vercel.json` (CSP calibrada para Vite, Google Fonts `Inter`, Supabase e Gemini com `frame-ancestors 'none'`).
   - **Higienização documental (`V-05`):** redação real em nível de stream no `Testes de segurança.pdf` (páginas 3–6) removendo tokens, chaves, UUID e hosts sensíveis.

## 3. Consequências
- **Positivas:**
  - 0 novas dependências de runtime/build.
  - Cobertura de `SanitizacaoStrategy.ts` em **100% Stmts / 97.87% Branch / 100% Funcs / 100% Lines** (`testes/patterns/strategy/sanitizacaoStrategy.spec.ts` — 8 testes).
  - Proteção consistente na UI, Repositories, PostgreSQL, Edge Functions e camada HTTP.
- **Trade-offs / Cuidados:**
  - Caso o projeto passe a renderizar HTML rico (ex.: Markdown compilado com `dangerouslySetInnerHTML`), será necessário abrir novo ADR avaliando sanitizador HTML específico (`DOMPurify`).
  - `resend-email` (`v2`) e `resend-suport` (`v1`) já foram publicadas (`ACTIVE`, `verify_jwt: true`) e validadas ponta a ponta no Supabase de teste em 22/11/2026 (`HTTP 200` com anexo 1FN assinado); resta apenas confirmar a resposta HTTP de `vercel.json` (V-03) na hospedagem Vercel.
