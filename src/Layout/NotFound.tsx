import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import { getAssetPath } from "@/lib/assetPath"

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 w-full bg-[#080311] relative overflow-hidden">
      {/* Gradientes de fundo para manter o padrão visual */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.15),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.1),transparent_40%)]" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-md">
        {/* Logo opcional no topo */}
        <div className="w-16 h-16 rounded-full border border-purple-500/30 flex items-center justify-center bg-black/20 overflow-hidden mb-4 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
          <img src={getAssetPath("/Logos/Logo.png")} alt="NexusClass Logo" className="w-14 h-14 object-contain" />
        </div>

        <h1 className="text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-sm">
          404
        </h1>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Página não encontrada</h2>
          <p className="text-slate-400 text-base">
            Ops! Parece que você se perdeu no espaço acadêmico. A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        <Button 
          onClick={() => navigate("/", { replace: true })}
          className="mt-8 h-12 px-6 rounded-xl border-0 text-base font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:from-[#7C3AED] hover:to-[#DB2777] shadow-[0_8px_30px_rgba(236,72,153,0.2)] flex items-center gap-2 transition-all hover:scale-105"
        >
          <Home size={20} />
          Voltar para o Início
        </Button>
      </div>
    </div>
  )
}