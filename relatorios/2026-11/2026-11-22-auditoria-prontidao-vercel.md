# Relatório de Auditoria e Prontidão da Hospedagem Vercel (`vercel.json` e Branch `deploy`)

- **Autor:** Gianlucca Paiva (`GianluccaPaiva`)
- **Data:** 2026-11-22
- **Branch de trabalho:** `DesiningTeste` *(sem commit/merge ainda)*
- **Production Branch na Vercel:** `deploy`
- **Referência de segurança:** Achado **V-03** (Wapiti) em [`.docs/PENTEST_E_SEGURANCA_NEXUSCLASS.md`](../../.docs/PENTEST_E_SEGURANCA_NEXUSCLASS.md) e passo 3 de [`.agents/PLANO_FECHAMENTO_GIANLUCCA.md`](../../.agents/PLANO_FECHAMENTO_GIANLUCCA.md)

---

## 1. Por que esta verificação e atualização foram feitas?

Durante o fechamento de segurança pós-pentest, precisávamos garantir dois pontos críticos antes de promover a nova versão do NexusClass para produção:
1. **Confirmar se os cabeçalhos HTTP de segurança (`V-03`) já estavam em produção ou apenas na `DesiningTeste`.**
2. **Garantir que o [`vercel.json`](../../vercel.json) não quebraria a aplicação na Vercel** (bloqueando scripts, fontes, imagens, WebSocket Realtime ou chamadas ao Supabase/Gemini via CSP) nem a produção atual por divergência de banco de dados.

---

## 2. Diagnóstico das Branches (Motivo de NÃO promover ainda)

A inspeção direta das branches remotas (`git log` e `git show`) comprovou que a produção ainda não possui a refatoração nem os cabeçalhos de segurança:

| Branch | Último Commit | Situação encontrada |
|:---|:---|:---|
| **`origin/main`** | `76a80c7` | Branch antiga anterior à integração front+back; **não possui `vercel.json`**. |
| **`origin/deploy`** *(produção Vercel)* e **`origin/frontComBack`** | `ce69de1` *(v1.2.02)* | Contém o **`vercel.json` legado** (apenas `rewrites`, **sem seção `headers`**) e o código anterior ao esquema normalizado de 18 tabelas. |
| **`DesiningTeste`** *(atual)* | `1091263` + ajustes locais | Única branch com o novo esquema (18 tabelas), Repositories, `SanitizacaoStrategy`, `ESC-XXXXXXXX`, Edge Functions `resend-*` e os cabeçalhos HTTP de segurança. |

**Risco evitado:** promover `DesiningTeste` → `deploy` antes de conferir as variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) na Vercel derrubaria a produção caso a Vercel ainda estivesse apontando para o banco legado (`turmas_escolares`, `perfis`). Por isso, a alteração foi preparada e validada localmente sem commit/merge antecipado.

---

## 3. O que foi alterado em `vercel.json` e por quê

Em [`vercel.json`](../../vercel.json), foi adicionado o cabeçalho **`Strict-Transport-Security` (HSTS)** aos 5 cabeçalhos já configurados para remediar o achado **V-03** do scanner **Wapiti**, fechando os **6 cabeçalhos HTTP essenciais de segurança OWASP**:

| Cabeçalho HTTP | Valor Configurado | Por que foi incluído |
|:---|:---|:---|
| **`Content-Security-Policy` (CSP)** | `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' https: http: data: blob:; media-src 'self' data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com; upgrade-insecure-requests` | Mitiga XSS e exfiltração de dados restringindo estritamente de onde scripts, fontes, estilos e conexões de rede podem ser carregados (achado Wapiti). |
| **`Strict-Transport-Security` (HSTS)** *(novo)* | `max-age=31536000; includeSubDomains` | Força o navegador a usar exclusivamente HTTPS em visitas subsequentes (proteção contra *SSL stripping* / downgrade). A Vercel serve sempre em HTTPS, tornando o risco de ativação zero. |
| **`X-Frame-Options`** | `DENY` | Bloqueia embutimento em `<iframe>` contra *Clickjacking* (achado Wapiti; complementa `frame-ancestors 'none'` para navegadores antigos). |
| **`X-Content-Type-Options`** | `nosniff` | Impede que o navegador interprete arquivos com MIME incorreto como script executável (achado Wapiti). |
| **`Referrer-Policy`** | `strict-origin-when-cross-origin` | Evita vazamento de caminhos internos e parâmetros de URL para domínios externos. |
| **`Permissions-Policy`** | `camera=(), microphone=(), geolocation=()` | Desabilita APIs sensíveis do navegador que o NexusClass não utiliza (princípio do menor privilégio). |

---

## 4. Auditoria de Compatibilidade com o Código (Garantia de Zero Quebra)

Antes de encerrar a configuração do `vercel.json`, cada diretiva da CSP e do roteamento foi cruzada contra o código-fonte real:

1. **[`index.html`](../../index.html):** contém apenas `<script type="module" src="/src/main.tsx">` (zero `<script>` inline) → compatível com `script-src 'self'`.
2. **[`vite.config.ts`](../../vite.config.ts):** usa `const base = process.env.VERCEL ? '/' : (env.BASE_URL || '/NexusClassWeb/')` → resolve automaticamente `base = '/'` na Vercel.
3. **Origens externas em `src/` (`git grep "https://" src/`):**
   - `https://fonts.googleapis.com` (`src/index.css`) → liberado em `style-src` ✅
   - `https://fonts.gstatic.com` (arquivos `.woff2` da fonte `Inter`) → liberado em `font-src` ✅
   - `https://cdn.pixabay.com/...` (`src/components/Mural.tsx`) + avatares/banners externos → liberado em `img-src 'self' https: http: data: blob:` ✅
   - `https://*.supabase.co` e `wss://*.supabase.co` (Auth, PostgREST, Storage, Edge Functions, Realtime) → liberado em `connect-src` ✅
   - `https://generativelanguage.googleapis.com` (`GeminiAdapter` / SDK Gemini) → liberado em `connect-src` ✅

---

## 5. Validações Executadas Localmente

| Verificação | Comando / Método | Resultado |
|:---|:---|:---|
| **Sintaxe JSON de `vercel.json`** | `JSON.parse(fs.readFileSync('vercel.json'))` | **Passou ✅** (`headers=6`, `rewrites=3`) |
| **Build de Produção Vercel** | `$env:VERCEL='1'; npx vite build` | **Passou ✅** (`2937` módulos transformados em `8.29s`; `dist/index.html` gerado com `base = '/'`) |
| **Preservação do Git** | `git status -sb` | **Confirmado ✅** (nenhum commit nem merge realizado) |

---

## 6. Checklist para o Momento da Publicação (`DesiningTeste` → `deploy`)

Quando a dupla autorizar o commit e a promoção para produção na Vercel:
1. Conferir no painel da Vercel (*Settings → Environment Variables*) que `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_GEMINI_KEY` apontam para o **banco Supabase normalizado de 18 tabelas** (com as migrações `01`–`17` e Edge Functions `deletar-conta`, `resend-email` v2 e `resend-suport` v1 ativas).
2. Promover `DesiningTeste` → `deploy` (disparando o build automático da Vercel).
3. Validar na URL publicada em produção:
   - Presença dos **6 cabeçalhos HTTP** na resposta de `/login` (ex.: `curl -I https://<url-vercel>/login`);
   - Console do navegador (`DevTools`) sem nenhum erro de violação de CSP (`Refused to load...`);
   - Login e navegação básica sem tocar ou alterar as 4 contas reservadas da apresentação.
