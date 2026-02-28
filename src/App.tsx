import Navbar from "./components/Navbar"
import AppSidebar from "./components/AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ThemeProvider } from "./components/provedores/ThemeProvider"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar />

        <main className="pagina-principal">
          <Navbar />
          <div className="pagina-conteudo">
            <h1 className="text-2xl font-bold mt-4">Bem-vindo ao Classroom</h1>
          </div>
        </main>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App