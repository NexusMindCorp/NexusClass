# Publicação e Validação Ponta a Ponta — `resend-email` e `resend-suport`

- **Autor:** Gianlucca Paiva (`GianluccaPaiva`)
- **Data:** 2026-11-22
- **Branch:** `DesiningTeste`
- **Ambiente:** Supabase de teste (`REF_DO_PROJETO`)

---

## 1. Resumo da Publicação
As duas Edge Functions de notificação por e-mail foram publicadas com autenticação obrigatória (`verify_jwt: true`) e conectadas ao fluxo real da SPA em [`src/repositories/ComunicacaoRepository.ts`](../../src/repositories/ComunicacaoRepository.ts):

| Edge Function | Versão Publicada | Status | Segurança & Recursos |
|:---|:---|:---|:---|
| **`resend-email`** | `v2` | **ACTIVE** (`verify_jwt: true`) | Valida JWT (`401`) e titularidade em `public.denuncia` (`403`/`404`), resolve nomes/e-mails em `public.perfil`, aplica escape HTML OWASP + anti-CRLF e envia template HTML responsivo via Resend. |
| **`resend-suport`** | `v1` | **ACTIVE** (`verify_jwt: true`) | Valida JWT (`401`) e titularidade em `public.ticket_suporte` (`403`/`404`), resolve perfil + anexos 1FN (`ticket_suporte_anexo` + `v_storage_objetos`), gera links assinados (7 dias) validados `http(s):` com `rel="noopener noreferrer"` e configura `reply_to`. |

- **Secrets configurados no painel do Supabase (*Edge Functions → Secrets*):** `RESEND_API_KEY` e `DESTINATARIO_EMAIL` (destinado à caixa do mantenedor, compatível com `onboarding@resend.dev`; sem nenhuma credencial versionada no Git).
- **Conexões conferidas na SPA:**
  - Denúncia: `BoxDenunciaAluno` → `useDenuncia.ts` → `comunicacaoRepository.criarDenuncia()` → `supabase.functions.invoke("resend-email", { body: { id_denuncia } })` (*best-effort*).
  - Suporte: `Suporte` → `useSuporte.ts` → `sendContactEmail()` → `comunicacaoRepository.criarTicketSuporte()` → `AnexoStorageFacade.anexar()` (1FN) → `supabase.functions.invoke("resend-suport", { body: { id_suporte } })` (*best-effort*).

---

## 2. Evidência da Validação Ponta a Ponta (Ao Vivo)
Executado teste ponta a ponta isolado com **conta descartável própria** (sem tocar em nenhuma das 4 contas reservadas da apresentação em [`.agents/PLANO_FECHAMENTO_GIANLUCCA.md`](../../.agents/PLANO_FECHAMENTO_GIANLUCCA.md)):

| Verificação | Resultado | Evidência |
|:---|:---|:---|
| Chamada sem JWT em `resend-email` | **Passou** | `HTTP 401` |
| Chamada sem JWT em `resend-suport` | **Passou** | `HTTP 401` |
| Fluxo real Denúncia (`INSERT` → `resend-email` v2 com payload `<script>`) | **Passou** | `HTTP 200` · `{"enviado":true,"destinatarios":1}` |
| Fluxo real Suporte + Upload Storage + `ticket_suporte_anexo` (1FN) → `resend-suport` v1 | **Passou** | `HTTP 200` · `{"enviado":true,"destinatarios":1,"anexos":1}` |
| Limpeza automática via `deletar-conta` | **Passou** | `arquivos_removidos: 1`, `arquivos_com_falha: 0`, `storage_limpeza_parcial: false` |

---

## 3. Próximos Passos do Fechamento
Conforme [`.agents/PLANO_FECHAMENTO_GIANLUCCA.md`](../../.agents/PLANO_FECHAMENTO_GIANLUCCA.md):
1. Conferir cabeçalhos HTTP de [`vercel.json`](../../vercel.json) (V-03) na hospedagem Vercel e decidir formalmente sobre **reenvio de confirmação de e-mail**.
2. Conferir submissão da **DCC061** (cópias externas com Gabriel) e decisão do Grupo 24 sobre exportação dos binários finais da **E4/DCC060** (`grupo24/der.png` + PDF).
3. Consolidar documentação/limpeza Git pós-Fase 7 após confirmação da dupla (preservando as 4 contas reservadas da apresentação).
