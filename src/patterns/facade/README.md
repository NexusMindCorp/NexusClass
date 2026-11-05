# Facade (`EntregaAtividadeFacade`)

**Por quê:** entregar, listar, baixar e avaliar uma atividade exige coordenar dois subsistemas distintos do Supabase — o bucket de armazenamento (`supabase.storage.from("entregas_atividades")`) e o banco relacional (`supabase.from("entregas_atividades")`) — além de higienizar o nome do arquivo, construir o caminho `${atividade_id}/${aluno_id}/${timestamp}-${nomeLimpo}`, tratar o reenvio via `UPSERT` (`onConflict: "atividade_id,aluno_id"`) e normalizar o join `perfis:aluno_id(nome)`. Antes, toda essa lógica estava acoplada dentro do hook `useEntregas.ts`.

**Como funciona:** a classe `EntregaAtividadeFacade` (contrato `IEntregaAtividadeFacade`) unifica e oculta os subsistemas de Storage e PostgreSQL. O hook `useEntregas` gerencia apenas o estado React (`entregaPropria`, `todasEntregas`, `loading`, `uploading`) e os toasts, delegando toda operação de domínio à fachada.

**Exemplo de uso:**
```ts
import { EntregaAtividadeFacade } from "@/patterns/facade/EntregaAtividadeFacade";

const facade = new EntregaAtividadeFacade();

// Submissão atômica (Storage upload + PostgreSQL upsert)
await facade.submeter({
  atividadeId: "ativ-1",
  alunoId: "aluno-1",
  arquivo: file,
});
```

**Status:** Concluído (Fase 2 — Autor: Gabriel Lineker)
