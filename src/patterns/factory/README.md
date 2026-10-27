# Factory (`BotFactory`)

**Por quê:** a plataforma possui dois assistentes virtuais com identidades, escopos e instruções de sistema distintos (**Tigreso** para tutoria acadêmica com *Function Calling* e **Falcão Peregrino** para dúvidas sobre Acordo de Uso e Privacidade). Antes, a montagem do `JsonInstruction` e da sessão ficava espalhada em condicionais dentro de `useChatBot.ts`.

**Como funciona:** `BotFactory` centraliza a resolução do tipo (`'tigreso' | 'falcao'`), a formatação do resumo de perfil e inscrições por papel (`aluno`, `professor`, `master`) e a instanciação de `IAssistenteIA` (`GeminiAdapter`) com a configuração exata de cada assistente.

**Exemplo de uso:**
```ts
import { BotFactory } from "@/patterns/factory/BotFactory";

const tipo = BotFactory.resolverTipoBot(isHelpMode);
const assistente = BotFactory.criarAssistente(tipo, {
  perfil,
  inscricoes,
  listaEscolar,
  materiasProfessor,
  toolHandlers,
});
```

**Status:** Concluído (Fase 1 — Autor: Gianlucca Paiva)
