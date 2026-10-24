# 🤖 Diretrizes do Projeto para Agentes de IA (AGENTS.md)

> **Índice Mestre Completo:** Leia [`.agents/INICIALIZACAO.md`](.agents/INICIALIZACAO.md) no início de sessões com tarefas de implementação.

## Stack & Ambiente
- **Projeto:** NexusClass (plataforma educacional) — trabalho DCC061 (Design Patterns + Testes de Software)
- **Stack:** React 19 + TypeScript 5.9 + Vite 7 + Tailwind 4 + Shadcn/Radix + Supabase + Gemini (`@google/generative-ai`) + Vitest
- **Plataforma Alvo:** Web SPA (Vercel / GitHub Pages)
- **Branch de trabalho:** `DesiningTeste` (todas as refatorações acontecem aqui)
- **Validação de Código Obrigatória:** Execute `npx tsc -b --noEmit` exclusivamente após alterações em arquivos de código (.ts/.tsx). É expressamente proibido executar o compilador após edições exclusivas em arquivos Markdown (.md).

## Restrições Invioláveis
- NUNCA introduzir bibliotecas concorrentes às existentes sem ADR prévio em `.agents/decisions/` + aval humano.
- NUNCA instalar pacotes sem usar o gerenciador oficial da stack (`npm install`).
- NUNCA criar testes unitários para código puramente visual/UI (Nível 1 RBT).
- NUNCA ler arquivos inteiros desnecessariamente; usar Symbol-First Lookup (`git grep -n` + leitura fatiada).
- NUNCA recomendar ferramentas ou bibliotecas sem pesquisa ativa em tempo real (Active Research Mandate).
- NUNCA alterar textos institucionais, científicos ou botões interativos existentes sem solicitação.
- NUNCA tratar o README.md como fonte normativa — em caso de conflito com `.agents/`, as políticas de governança prevalecem. Sinalizar divergências ao usuário.
- SEMPRE documentar proativamente antes de codificar (spec em `features/`, ADR em `decisions/`, erro em `troubleshooting/`).
- **Overengineering é proibido:** aplicar apenas os padrões do plano (`.docs/PLANEJAMENTO_REFATORACAO.md`), cada um com problema real no código. Sem Template Method forçado.
- **Continuidade e Transição de Fase (Handoff em Dupla):** Antes de iniciar qualquer atualização ou avançar para uma nova fase, é **obrigatório** verificar o que foi feito no processo anterior lendo o bloco **Ponto de Retomada (Handoff)** em `.docs/DOCUMENTACAO_APRESENTACAO.md` e o último relatório em `relatorios/<mes-ano>/`. Toda evolução deve partir exatamente do estado deixado pela etapa anterior (respeitando contratos, testes e decisões já consolidados) e seguir o `.docs/PLANEJAMENTO_REFATORACAO.md`.
- **Identificação Obrigatória de Autoria (Dupla: Gabriel Lineker & Gianlucca Paiva):** Toda modificação em documentação viva, tabelas de progresso, relatórios (`relatorios/`), specs (`features/`), ADRs (`decisions/`) e `troubleshooting/` **deve registrar explicitamente quem fez a alteração** (detectado via `git config user.name`: `GabrielLineker` ou `GianluccaPaiva`), permitindo que o parceiro saiba exatamente quem realizou cada etapa e de onde retomar.
- **Doc viva, Slides da Aplicação e Relatório obrigatórios (Versionados no Git):** ao fim de cada sessão/fase, atualizar `.docs/DOCUMENTACAO_APRESENTACAO.md` (incluindo o autor no bloco de Handoff, no Painel de Progresso e no Diário de Sessões), atualizar os slides interativos da aba Informações em `src/hooks/InfoAplicacao/configEngenhariaSoftware.ts` (status da fase, métricas de cobertura e exemplos antes/depois) e gerar o relatório em `relatorios/<mes-ano>/` com o campo `Autor`. Ambas as pastas são **públicas/versionadas no Git** para permitir sincronização contínua entre os membros da dupla.
- Fonte da verdade do sistema: `.docs/AnaliseMaisAtualDoSistema.md`. Os exemplos de código de `.docs/AnaliseDePossiveisDP.md` contêm bugs e nomes de tabelas errados — **não copiar**; adaptar ao código real.

## Governança de Pastas
| Pasta | Quando Acessar |
|:---|:---|
| `.agents/rules/` | Consultar padrões, políticas de teste e infraestrutura |
| `.agents/features/` | Planejar ou implementar nova funcionalidade/refatoração |
| `.agents/decisions/` | Mudança de lib, padrão ou infraestrutura (ADR obrigatório) |
| `.agents/troubleshooting/` | Erros de build, testes, ambiente |
| `.docs/` | Planejamento e documentação viva de apresentação (**versionada no Git** para handoff da dupla) |
| `relatorios/` | Relatórios de fim de sessão e ponto de retomada (**versionada no Git** para handoff da dupla) |
