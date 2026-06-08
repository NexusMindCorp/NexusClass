import { useEscolaDados } from "@/hooks/useEscolaDados";
import { useOutletContext } from "react-router-dom";
import type { PerfilUsuario } from "@/hooks/useAuth";
import { useMemo, useState, useEffect } from "react";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export function ListagemConteudosInscritos() {
  const { listaEscolar } = useEscolaDados();
  const { perfil } = useOutletContext<{ session: unknown; perfil: PerfilUsuario | null }>();
  
  const [minhasTurmasIds, setMinhasTurmasIds] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [carregandoAcao, setCarregandoAcao] = useState<string | null>(null);


  useEffect(() => {
    const buscarInscricoesAtualizadas = async () => {
      if (!hasSupabaseConfig || !supabase || !perfil?.id) return;

      const tabelaAssociativa = perfil.role === "aluno" ? "aluno_turma" : "professor_turma";
      const colunaFiltro = perfil.role === "aluno" ? "aluno_id" : "professor_id";

      try {
        const { data, error } = await supabase
          .from(tabelaAssociativa)
          .select("turma_id")
          .eq(colunaFiltro, perfil.id);

        if (error) throw error;

   
        if (data) {
          setMinhasTurmasIds(data.map((item) => item.turma_id));
        }
      } catch (error) {
        console.error("Erro ao buscar inscrições:", error);
      }
    };

    buscarInscricoesAtualizadas();
  }, [perfil, refreshTrigger]); 

 
  const cancelarInscricao = async (turmaId: string) => {
    if (!hasSupabaseConfig || !supabase || !perfil?.id) {
      toast.error("Erro de autenticação", { description: "Sessão inválida." });
      return;
    }

    setCarregandoAcao(turmaId);
    const tabelaAssociativa = perfil.role === "aluno" ? "aluno_turma" : "professor_turma";
    const colunaFiltro = perfil.role === "aluno" ? "aluno_id" : "professor_id";

    try {
      const { error } = await supabase
        .from(tabelaAssociativa)
        .delete()
        .eq(colunaFiltro, perfil.id)
        .eq("turma_id", turmaId);

      if (error) throw error;
      
      toast.success("Desinscrição realizada", { description: "Você saiu desta turma com sucesso." });
      
    
      setRefreshTrigger((prev) => prev + 1); 

    } catch (error: any) {
      toast.error("Erro ao sair da turma", { description: "Tente novamente mais tarde." });
    } finally {
      setCarregandoAcao(null);
    }
  };


  const turmasFiltradas = useMemo(() => {
    if (!perfil || !listaEscolar.turmas) return [];

    const verificaAcessoTurma = (turmaId: string) => {
      if (perfil.role === "master") return true;
      
      return minhasTurmasIds.includes(turmaId); 
    };
   
    return Object.entries(listaEscolar.turmas)
      .filter(([key]) => verificaAcessoTurma(key))
      .sort((a, b) => a[1].materia.localeCompare(b[1].materia));
      
  }, [listaEscolar.turmas, perfil, minhasTurmasIds]); 

  return (
    <div className="bg-[#1a1a1e] border border-[#2d2d32] rounded-2xl p-6 shadow-xl h-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Inscritos nos Murais</h2>
        <p className="text-sm text-gray-400">Gerencie suas turmas e inscrições.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="text-xs uppercase bg-[#2d2d32] text-gray-300">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Matéria</th>
              <th className="px-4 py-3 ">Turma</th>
              <th className="px-4 py-3">Professor</th>
              <th className="px-4 py-3 text-center rounded-tr-lg">Ação</th>
            </tr>
          </thead>
          <tbody>
            {turmasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                  <p className="italic">Nenhuma inscrição encontrada.</p>
                </td>
              </tr>
            ) : (
              turmasFiltradas.map(([key, turma]) => (
                <tr key={key} className="border-t border-[#2d2d32] hover:bg-[#2d2d32]/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{turma.materia}</td>
                  <td className="px-4 py-3 ">{turma.turma}</td>
                  <td className="px-4 py-3">{turma.professor}</td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-500 hover:text-white transition-all text-xs font-semibold disabled:opacity-50"
                      onClick={() => cancelarInscricao(key)}
                      disabled={carregandoAcao === key}
                    >
                      {carregandoAcao === key ? "Saindo..." : "Sair da Turma"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}