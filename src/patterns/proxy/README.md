# Proxy de Proteção (documentado — já existe)

**Por quê:** telas só podem ser vistas por usuários autenticados ou com o papel certo (aluno/professor/master).

**Como funciona aqui:** `ProtectedRoute` fica entre a rota e o `LayoutPrincipal`: se não há sessão, redireciona para `/login` (com spinner durante a verificação); `BoxRestrito` bloqueia conteúdo para quem não é aluno. O cliente (a rota) não sabe que há um intermediário. A segurança real continua no RLS do backend.

**Onde:** `ProtectedRoute` e `BoxRestrito` em `src/components/`.
**Teste planejado:** componente — sem sessão redireciona para `/login`.
**Status:** Documentado (Fase 5)
