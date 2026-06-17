import { useRef, useCallback } from "react"
import { useOutletContext } from "react-router-dom"
import { Navbar } from "@/components//Navbar"
import { AppSidebar } from "@/components//AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { GerenciadorTelas } from "@/components//GerenciadorTelas"
import { useGerenciador } from "@/hooks/useGerenciador"
import { useEscolaDados } from "@/hooks/useEscolaDados"
import { ChatBot } from "@/components/ChatBot"
import type { PerfilUsuario } from "@/hooks/AuthHooks/useAuth"

export function LayoutPrincipal() {
  const { perfil, atualizarPerfilLocal } = useOutletContext<{
    perfil: PerfilUsuario
    atualizarPerfilLocal: (perfilAtualizado: PerfilUsuario) => void
  }>()
  const { usuario, mudarInscricao, estaInscrito, marcarMural, navegarPara, abrirChat, loadingInscricoes } = useGerenciador(perfil)
  const { listaEscolar } = useEscolaDados()
  const chatBotRef = useRef<{ abrirComAjuda: () => void }>(null)

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
        <Navbar perfil={perfil} atualizarPerfilLocal={atualizarPerfilLocal} />

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
            loadingInscricoes={loadingInscricoes}
            abrirChat={abrirChat}
          />
        </div>
      </main>
      <ChatBot ref={chatBotRef} usuario={usuario} listaEscolar={listaEscolar.turmas} />
    </SidebarProvider>
  )
}
