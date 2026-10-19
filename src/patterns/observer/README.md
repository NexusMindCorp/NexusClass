# Observer

**Por quê:** há 5 canais Realtime (`mural_posts`, `atividades`, `entregas_atividades`, `mensagens`, `alertas_calendario`), cada um com seu próprio toast/atualização espalhado em hooks.

**Como funciona:** um sujeito (`NotificacaoSubject`) recebe os eventos do Realtime e notifica observadores inscritos (toast, badge, atualização de lista). Quem consome não conhece a origem do evento, e é possível inscrever/desinscrever (cleanup do `useEffect`).

**Exemplo (esboço):**
```ts
interface Observer<E> { atualizar(evento: E): void }
class Subject<E> { inscrever(o: Observer<E>): () => void; notificar(e: E): void }
```
**Status:** Planejado (Fase 4)
