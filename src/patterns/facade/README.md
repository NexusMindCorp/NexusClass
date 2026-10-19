# Facade

**Por quê:** entregar uma atividade envolve higienizar o nome do arquivo, subir para o bucket `entregas_atividades/{atividade_id}/{aluno_id}/{arquivo}`, fazer `UPSERT` em `entregas_atividades` e tratar reenvio. Isso está misturado no hook/componente.

**Como funciona:** uma interface simples (`submeter(...)`) esconde Storage + banco. O componente chama só a fachada; as regras de backend (trigger de prazo, RLS) continuam valendo.

**Exemplo (esboço):**
```ts
export const entregaFacade = {
  submeter: (atividadeId: string, alunoId: string, arquivo: File) => Promise<void>
}
```
**Status:** Planejado (Fase 2)
