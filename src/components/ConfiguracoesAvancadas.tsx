import { Button } from "./ui/button";
import { BoxAlertaDeletaConta } from "./BoxAlertaDeletaConta";
import { ListagemConteudosInscritos } from "./ListagemConteudosInscritos";
import { useConfiguracoesAvancadas } from "@/hooks/useConfiguracoesAvancadas";
import { BoxRestrito } from "./BoxRestrito";

export function ConfiguracoesAvancadas({ usuario, listaEscolar, cancelarInscricao, estaInscrito }: { usuario: any; listaEscolar: any; cancelarInscricao: any; estaInscrito: any }) {
    const { perfil, senhaDoInput, setSenhaDoInput, areaSensivel, setAreaSensivel, carregando, handleAlterarSenha, handleDeletarConta } = useConfiguracoesAvancadas();
    return perfil?.role === "aluno" || perfil?.role === "master" ? (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-10">
      
    
      <div className="w-full bg-[#1a1a1e] border border-[#2d2d32] rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
       
          <div className="flex-shrink-0">
            <div className="relative group">
              <img 
                src={perfil?.foto_url || "/Logos/avatar-padrao.png"} 
                alt="Foto do perfil" 
                className="w-24 h-24 rounded-full object-cover border-4 border-[#2d2d32] transition-transform group-hover:scale-105" 
              />
            </div>
          </div>

          <div className="flex-grow space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Configurações Avançadas</h2>
              <p className="text-gray-400 mt-1">Gerencie camada mais perigosa da sua conta.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#2d2d32]">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</label>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-white font-medium">{perfil?.nome || "Não definido"}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">E-mail</label>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-white font-medium">{perfil?.email || "Não definido"}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#2d2d32] space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Segurança da Conta</label>
                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                  <input 
                    type="password" 
                    className="flex-grow px-3 py-2 bg-[#2d2d32] border border-[#2d2d32] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#4c4c51]" 
                    placeholder="Digite a nova senha" 
                    value={senhaDoInput}
                    onChange={(e) => setSenhaDoInput(e.target.value)}
                  />
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleAlterarSenha} 
                    disabled={carregando || senhaDoInput.length < 6}
                  >
                    {carregando ? "Processando..." : "Alterar Senha"}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2d2d32]/50 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  <p className="font-semibold text-red-400">Zona de Perigo</p>
                  <p className="text-xs">Excluir sua conta é uma ação irreversível.</p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDeletarConta}>
                  Deletar Conta
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div> 
     

  
      <div className="w-full">
        <ListagemConteudosInscritos usuario={usuario} listaEscolar={listaEscolar} cancelarInscricao={cancelarInscricao} estaInscrito={estaInscrito}/>
      </div>

    
      {areaSensivel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <BoxAlertaDeletaConta onClose={() => setAreaSensivel(false)} />
        </div>
      )}

    </div>
  ) : (
    <BoxRestrito
    />
  );
}