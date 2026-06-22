import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Eye, EyeClosed, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { getAssetPath } from "@/lib/assetPath";
import { capitalizerNomeTodo } from "@/lib/utils";

export function Login() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        navigate("/", { replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nome } },
        });
        if (error) throw error;

        navigate("/", { replace: true });
      }
    } catch (error: any) {
      let mensagem =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao tentar acessar a conta.";

      if (mensagem === "Invalid login credentials") {
        mensagem = "E-mail ou senha incorretos!";
      }

      toast.error("Erro no acesso", {
        description: mensagem,
      });

      setEmail("");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const visualizarSenha = () => {
    setShowPassword(!showPassword);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 w-full bg-[#080311] relative overflow-hidden">
      {/* Gradientes de fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_35%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.12),transparent_30%)]" />

      {/* Container Principal */}
      <div className="relative w-full max-w-6xl max-h-[95vh] rounded-[32px] overflow-hidden flex border border-purple-500/20 bg-[#0d0717]/90 backdrop-blur-xl shadow-[0_0_60px_rgba(139,92,246,0.12)]">
        {/* Lado Esquerdo - Formulário */}
        <div className="w-full md:w-1/2 p-6 md:p-10 lg:p-12 flex flex-col justify-center overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full border border-purple-500/30 flex items-center justify-center bg-black/20 overflow-hidden">
              <img
                src={getAssetPath("/Logos/Logo.png")}
                alt="Logo da Escola Nexus"
                className="w-11 h-11 object-contain"
              />
            </div>
            <span className="text-4xl font-bold tracking-tight">
              <span className="text-gradient">NexusClass</span>
            </span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">
            {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
          </h2>
          <p className="text-[#9f95ba] text-base mb-6 md:mb-6">
            {isLogin
              ? "Faça login para acessar sua plataforma de estudos."
              : "Junte-se a nós para começar a explorar."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label
                  htmlFor="nome"
                  className="text-white text-sm font-medium"
                >
                  Nome completo
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) =>
                      setNome(capitalizerNomeTodo(e.target.value))
                    }
                    required
                    className="h-12 bg-transparent border-purple-500/25 text-white pl-11 rounded-xl focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-sm font-medium">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-transparent border-purple-500/25 text-white pl-11 rounded-xl focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-white text-sm font-medium"
              >
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-transparent border-purple-500/25 text-white pl-11 pr-11 rounded-xl focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                />
                <button
                  type="button"
                  onClick={visualizarSenha}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeClosed size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between text-sm pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lembrar"
                    className="border-slate-600 data-[state=checked]:bg-purple-600"
                  />
                  <Label
                    htmlFor="lembrar"
                    className="text-slate-400 font-normal"
                  >
                    Lembrar de mim
                  </Label>
                </div>
                {/* Não vai existir sistema de recuperação de senha isso é apenas um exemplo */}
                <a
                  href="#"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Esqueceu sua senha?
                </a>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-4 h-12 w-full rounded-xl border-0 text-base font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:from-[#7C3AED] hover:to-[#DB2777] shadow-[0_8px_30px_rgba(236,72,153,0.2)]"
            >
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsLogin(!isLogin);
              }}
              className="text-purple-400 cursor-pointer font-semibold hover:text-purple-300 transition-colors"
            >
              {isLogin ? "Criar conta" : "Fazer login"}
            </button>
          </div>
        </div>

        {/* Lado Direito - Ilustração */}
        <div className="hidden md:block w-1/2 relative border-l border-purple-500/10 bg-[#0b0517]">
          <img
            src={getAssetPath("Logos/imgLivroCF.png")}
            alt="Ilustração de estudo"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
