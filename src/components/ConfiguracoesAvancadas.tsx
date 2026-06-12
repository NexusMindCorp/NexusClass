import { useState } from "react";
import { Button } from "./ui/button";
import { BoxAlertaDeletaConta } from "./BoxAlertaDeletaConta";
import { ListagemConteudosInscritos } from "./ListagemConteudosInscritos";
import { useConfiguracoesAvancadas } from "@/hooks/useConfiguracoesAvancadas";
import { BoxRestrito } from "./BoxRestrito";
import { PerfilAvatar } from "./PerfilAvatar";
import { Trash2, EyeClosed, Eye } from "lucide-react";

export function ConfiguracoesAvancadas({ usuario, listaEscolar, cancelarInscricao, estaInscrito }: { usuario: any; listaEscolar: any; cancelarInscricao: any; estaInscrito: any }) {
  const { perfil, senhaDoInput, setSenhaDoInput, areaSensivel, setAreaSensivel, carregando, handleAlterarSenha, handleDeletarConta } = useConfiguracoesAvancadas();
  const [showPassword, setShowPassword] = useState(false);

  const isAluno = perfil?.role === "aluno";

  const mostrarSenha = () => {
    setShowPassword(!showPassword);
  }

  return isAluno ? (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-10">

      <div className="w-full bg-card border border-border rounded-2xl p-8 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row gap-8 items-start">

          <div className="flex-shrink-0">
            <div className="relative group">
              <PerfilAvatar
                classNameAvatar={`h-24 w-24 border-2 border-primary rounded-full`}
                classNameDiv={`flex h-full w-full shrink-0 items-center justify-center rounded-full text-foreground text-3xl`}
                foto={perfil?.foto_url}
                tipo="usuario"
                palavra={perfil?.nome}
              />
            </div>
          </div>

          <div className="flex-grow space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Configurações Avançadas</h2>
              <p className="text-muted-foreground mt-1">Gerencie a camada mais sensível da sua conta.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome</label>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-foreground font-medium">{perfil?.nome || "Não definido"}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">E-mail</label>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-foreground font-medium">{perfil?.email || "Não definido"}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Segurança da Conta
                </label>

                <div className="mt-3 flex flex-col sm:flex-row gap-3">

                  <div className="relative flex-grow">
                    <input
                      className="w-full px-3 py-2 pr-10 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                      placeholder="Digite a nova senha"
                      value={senhaDoInput}
                      type={showPassword ? "text" : "password"}
                      onChange={(e) => setSenhaDoInput(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={mostrarSenha}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeClosed size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <Button
                    size="lg"
                    onClick={handleAlterarSenha}
                    disabled={carregando || !senhaDoInput}
                    className="cursor-pointer"
                  >
                    {carregando ? "Processando..." : "Alterar Senha"}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-destructive">Zona de Perigo</p>
                  <p className="text-xs">Excluir sua conta é uma ação irreversível.</p>
                </div>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleDeletarConta}
                  className="cursor-pointer gap-2 font-bold transition-all duration-200  hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  <Trash2 className="h-5 w-5" />
                  Deletar Conta
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <ListagemConteudosInscritos usuario={usuario} listaEscolar={listaEscolar} cancelarInscricao={cancelarInscricao} estaInscrito={estaInscrito} />
      </div>

      {areaSensivel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <BoxAlertaDeletaConta onClose={() => setAreaSensivel(false)} />
        </div>
      )}

    </div>
  ) : (
    <BoxRestrito
    />
  );
}