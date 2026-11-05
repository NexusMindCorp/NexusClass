# Protection Proxy (`ProtectedRoute.tsx` & `BoxRestrito.tsx`)

- **Categoria GoF:** Estrutural (*Structural Pattern — Protection Proxy*)
- **Implementação Real:** [`src/components/ProtectedRoute.tsx`](../../components/ProtectedRoute.tsx) e [`src/components/BoxRestrito.tsx`](../../components/BoxRestrito.tsx) (consumido em [`src/components/ConfiguracoesAvancadas.tsx`](../../components/ConfiguracoesAvancadas.tsx))
- **Status:** **Concluído / Documentado (Fase 5 — ADR-007)** · Testes de componente na Fase 6

## 1. Problema Real que Resolve
Em uma plataforma educacional com múltiplos papéis (`aluno`, `professor`, `master`) e rotas autenticadas:
1. O painel principal (`LayoutPrincipal`) não pode ser montado nem disparar consultas ao banco enquanto a sessão do usuário ainda está sendo verificada ou quando o usuário não está autenticado.
2. Telas de escopo restrito por papel — como a área de cancelamento de matrícula e exclusão de conta de estudante em `ConfiguracoesAvancadas` (`isAluno = perfil?.role === "aluno"`) — não devem expor controles sensíveis a perfis incompatíveis.

## 2. Participantes GoF no Código Real

| Participante GoF | Elemento no NexusClass | Responsabilidade |
|:---|:---|:---|
| **Client** | `App.tsx` (`<Routes>`) / `GerenciadorTelas.tsx` | Solicita a renderização da rota ou subtela sem conhecer os detalhes da verificação de sessão/papel |
| **Protection Proxy (Nível Rota)** | [`ProtectedRoute.tsx`](../../components/ProtectedRoute.tsx) | Intercepta o acesso à rota `/`: exibe *spinner* enquanto `loading === true`, redireciona para `/login` se `!session` e só monta o `<Outlet />` quando autenticado |
| **Protection Proxy (Nível Papel)** | [`ConfiguracoesAvancadas.tsx`](../../components/ConfiguracoesAvancadas.tsx) + [`BoxRestrito.tsx`](../../components/BoxRestrito.tsx) | Verifica `perfil?.role === "aluno"`; caso contrário, substitui o conteúdo real pelo componente de bloqueio `<BoxRestrito />` |
| **Real Subject** | `LayoutPrincipal.tsx` / Painel interno de `ConfiguracoesAvancadas` | Componente protegido que só é instanciado/renderizado após a aprovação do Proxy |

### Trecho Real (`src/components/ProtectedRoute.tsx`)
```tsx
export function ProtectedRoute() {
  const { session, loading, perfil, materiasProfessorNomes, atualizarPerfilLocal } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Outlet
      context={{ session, perfil, materiasProfessor: materiasProfessorNomes, atualizarPerfilLocal }}
    />
  );
}
```

## 3. Defesa em Profundidade (Frontend Proxy + Backend RLS)
O Protection Proxy no frontend impede navegação indevida e melhora a experiência do usuário, mas **a segurança real de dados reside no backend**: todas as tabelas do PostgreSQL no Supabase possuem políticas de **Row Level Security (RLS)** que validam `auth.uid()` e o papel do perfil em cada `SELECT`, `INSERT`, `UPDATE` e `DELETE`.
