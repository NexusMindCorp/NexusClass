import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

export function ProtectedRoute() {
  const { session, loading, perfil, materiasProfessorNomes, atualizarPerfilLocal } = useAuth()

  // Mantém a tela de carregamento centralizada enquanto verifica a sessão
  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  // Se não houver sessão ativa, redireciona para a página de login
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Se houver sessão, renderiza os componentes filhos. 
  // Passamos o 'perfil' e a 'session' via context do Outlet para que qualquer 
  // rota filha consiga resgatar esses dados facilmente com useOutletContext()
  // Expor como `materiasProfessor` (string[]) para manter compatibilidade com ChatBot
  return <Outlet context={{ session, perfil, materiasProfessor: materiasProfessorNomes, atualizarPerfilLocal }} />
}
