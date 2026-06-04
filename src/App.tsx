import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "./components/provedores/ThemeProvider"
import { Toaster } from "sonner"
import { Login } from "./components/Login"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { LayoutPrincipal } from "./Layout/LayoutPrincipal"
import { NotFound } from "./Layout/NotFound"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          {/* Rota Pública de Autenticação */}
          <Route path="/login" element={
            <>
              <Login />
              <Toaster position="top-center" richColors theme="dark" />
            </>
          } />

          {/* Rota Protegida que renderiza o painel completo */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<LayoutPrincipal />} />
          </Route>

          {/* Fallback para rotas inexistentes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      {/* Toaster global para notificações dentro do sistema */}
      <Toaster position="top-center" />
    </ThemeProvider>
  )
}

export default App