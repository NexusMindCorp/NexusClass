import Navbar from "./components/Navbar"
import AppSidebar from "./components/AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ThemeProvider } from "./components/provedores/ThemeProvider"
import { GerenciadorTelas } from "./components/GerenciadorTelas"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar />

        <main className="pagina-principal">
          <Navbar />
          <div className="pagina-conteudo">
            <GerenciadorTelas />
          </div>
        </main>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App