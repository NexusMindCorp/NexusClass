import { useRef, useCallback, useEffect } from "react"
import { Navbar } from "@/components//Navbar"
import { AppSidebar } from "@/components//AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { GerenciadorTelas } from "@/components//GerenciadorTelas"

import { useGerenciador } from "@/hooks/useGerenciador"
import { useEscolaDados } from "@/hooks/useEscolaDados"
import { ChatBot } from "@/components/ChatBot"

export function LayoutPrincipal() {
  const { usuario, mudarInscricao, estaInscrito, marcarMural, navegarPara, limparEstado } = useGerenciador()
  const { listaEscolar } = useEscolaDados()
  const chatBotRef = useRef<{ abrirComAjuda: () => void }>(null)

  const abrirChatComAjuda = useCallback(() => {
    chatBotRef.current?.abrirComAjuda()
  }, [])

 /* useEffect(() => {
    return () => {
      limparEstado()
    }
  }, [limparEstado])
*/
  return (
    <SidebarProvider>
      <AppSidebar
        navegarPara={navegarPara}
        inscricoes={usuario.inscricoes}
        marcarMural={marcarMural}
        listaEscolar={listaEscolar}
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
          />
        </div>
      </main>
      <ChatBot ref={chatBotRef} usuario={usuario} />
    </SidebarProvider>
  )
}