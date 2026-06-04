import { Navbar } from "./components/Navbar"
import { AppSidebar } from "./components/AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ThemeProvider } from "./components/provedores/ThemeProvider"
import { GerenciadorTelas } from "./components/GerenciadorTelas"
import { Toaster } from "sonner"
import { useGerenciador } from "./hooks/useGerenciador"
import { ChatBot } from "./components/ChatBot"
import { useEscolaDados } from "./hooks/useEscolaDados"
import { useRef, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Login } from "./components/Login"

function App() {
  const { usuario, mudarInscricao, estaInscrito, marcarMural, navegarPara } = useGerenciador()
  const { listaEscolar } = useEscolaDados()
  const chatBotRef = useRef<{ abrirComAjuda: () => void }>(null)
  const { session, loading } = useAuth()

  const abrirChatComAjuda = useCallback(() => {
    chatBotRef.current?.abrirComAjuda()
  }, [])

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <>
        <Login />
        <Toaster position="top-center" richColors theme="dark" />
      </>
    )
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
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
      <Toaster position="top-center" />
    </ThemeProvider>
  )
}

export default App