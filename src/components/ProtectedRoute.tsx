import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/AuthHooks/useAuth";

export function ProtectedRoute() {
  const {
    session,
    loading,
    perfil,
    materiasProfessorNomes,
    atualizarPerfilLocal,
  } = useAuth();


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
      context={{
        session,
        perfil,
        materiasProfessor: materiasProfessorNomes,
        atualizarPerfilLocal,
      }}
    />
  );
}
