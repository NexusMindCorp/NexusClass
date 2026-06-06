import { useState } from "react";

export function ListagemConteudosInscritos() {
  const [inscritos, setInscritos] = useState([]); 

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
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Matéria</th>
              <th className="px-4 py-3">Professor</th>
              <th className="px-4 py-3 text-center">Ação</th>
            </tr>
          </thead>
          <tbody>
            {inscritos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center italic text-gray-500">
                  Nenhuma inscrição encontrada.
                </td>
              </tr>
            ) : (
              inscritos.map((inscrito: any) => (
                <tr key={inscrito.id} className="border-b border-[#2d2d32] hover:bg-[#222228] transition-colors">
                  <td className="px-4 py-3 text-white">{inscrito.nome}</td>
                  <td className="px-4 py-3">{inscrito.materia}</td>
                  <td className="px-4 py-3">{inscrito.professor}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-500 hover:text-white transition-all text-xs">
                      Sair
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