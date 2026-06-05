import { useRef, useCallback, useEffect } from "react"
import { useOutletContext } from "react-router-dom"
import { Navbar } from "@/components//Navbar"
import { AppSidebar } from "@/components//AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { GerenciadorTelas } from "@/components//GerenciadorTelas"
import { useGerenciador } from "@/hooks/useGerenciador"
import { useEscolaDados } from "@/hooks/useEscolaDados"
import { ChatBot } from "@/components/ChatBot"
import type { PerfilUsuario } from "@/hooks/useAuth"

export function LayoutPrincipal() {
  const { usuario, mudarInscricao, estaInscrito, marcarMural, navegarPara, } = useGerenciador()
  const { listaEscolar } = useEscolaDados()
  const chatBotRef = useRef<{ abrirComAjuda: () => void }>(null)
  const { perfil } = useOutletContext<{ perfil: PerfilUsuario }>()

  const abrirChatComAjuda = useCallback(() => {
    chatBotRef.current?.abrirComAjuda()
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar
        navegarPara={navegarPara}
        inscricoes={usuario.inscricoes}
        marcarMural={marcarMural}
        listaEscolar={listaEscolar}
        perfil={perfil}
      />

      <main className="pagina-principal">
        <Navbar />
        <div className="pagina-conteudo">
          <GerenciadorTelas
            usuario={usuario}
            mudarInscricao={mudarInscricao}
            estaInscrito={estaInscrito}
            marcarMural={marcarMural}
            navegarPara={navegarPara}
            listaEscolar={listaEscolar}
            abrirChatComAjuda={abrirChatComAjuda}
            perfil={perfil}
          />
        </div>
      </main>
      <ChatBot ref={chatBotRef} usuario={usuario} />
    </SidebarProvider>
  )
}