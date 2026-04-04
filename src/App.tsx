import { Navbar } from "./components/Navbar"
import { AppSidebar } from "./components/AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ThemeProvider } from "./components/provedores/ThemeProvider"
import { GerenciadorTelas } from "./components/GerenciadorTelas"
import { Toaster } from "sonner"
import { useGerenciador } from "./hooks/useGerenciador"
import { ChatBot } from "./components/ChatBot"
import { useEscolaDados } from "./hooks/useEscolaDados"

function App() {
  const { usuario, mudarInscricao, estaInscrito, marcarMural, navegarPara } = useGerenciador()
  const { listaEscolar } = useEscolaDados()

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
            />
          </div>
        </main>
        <ChatBot />
      </SidebarProvider>
      <Toaster position="top-center" />
    </ThemeProvider>
  )
}

export default App