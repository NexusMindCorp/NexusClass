import { useState } from "react";
import { toast } from "sonner";

export function ListagemConteudosInscritos({ usuario, listaEscolar, cancelarInscricao, estaInscrito }: { usuario: any; listaEscolar: any; cancelarInscricao: any; estaInscrito: any }) {
  const [carregandoAcao, setCarregandoAcao] = useState<string | null>(null);
  const handleSair = async (key: string) => {
    setCarregandoAcao(key);
    try {
      await cancelarInscricao(key);
    } catch (err) {
      toast.error("Erro ao sair da turma.");
    } finally {
      setCarregandoAcao(null);
    }
  };

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
            {listaEscolar.turmas && Object.keys(listaEscolar.turmas).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                  <p className="italic">Nenhuma inscrição encontrada.</p>
                </td>
              </tr>
            ) : (
              Object.entries(listaEscolar.turmas)
                .filter(([key]) => estaInscrito(key) || usuario.role === "master")
                .sort((a, b) => (a[1] as any).materia.localeCompare((b[1] as any).materia))
                .map(([key, turma]: [string, any]) => (
                <tr key={key} className="border-t border-[#2d2d32] hover:bg-[#2d2d32]/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{turma.materia}</td>
                  <td className="px-4 py-3 ">{turma.turma}</td>
                  <td className="px-4 py-3">{turma.professor}</td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-500 hover:text-white transition-all text-xs font-semibold disabled:opacity-50"
                      onClick={() => handleSair(key)}
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