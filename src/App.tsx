import { useEffect, useRef } from "react"
import { Navbar } from "./components/Navbar"
import { AppSidebar } from "./components/AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ThemeProvider } from "./components/provedores/ThemeProvider"
import { GerenciadorTelas } from "./components/GerenciadorTelas"
import { Toaster, toast } from "sonner"
import { useGerenciador } from "./hooks/useGerenciador"
import { ChatBot } from "./components/ChatBot"
import { hasSupabaseConfig, supabase } from "./lib/supabaseClient"

type PayloadAlertaCalendario = {
  id: string
  evento_id: string
  titulo_evento: string
  mensagem: string
  minutos_antes?: number
  lembrete_para: string
  created_at: string
}

type EventoCalendarioNotificacao = {
  id: string
  titulo: string
  data: string
  horario: string
}

function formatarDataLocal(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

function montarDataEvento(data: string, horario: string) {
  const dataEvento = new Date(`${data}T${horario}`)
  return Number.isNaN(dataEvento.getTime()) ? null : dataEvento
}

function App() {
  const { usuario, mudarInscricao, estaInscrito, marcarMural, navegarPara } = useGerenciador();
  const alertasEnviadosRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      return
    }

    const supabaseClient = supabase

    const channel = supabaseClient
      .channel("alertas-calendario-5-min")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alertas_calendario",
        },
        (payload) => {
          const alerta = payload.new as PayloadAlertaCalendario
          const minuto = alerta.minutos_antes ?? "db"
          const chaveAlerta = `${alerta.evento_id}-${minuto}`

          if (alertasEnviadosRef.current.has(chaveAlerta)) {
            return
          }

          alertasEnviadosRef.current.add(chaveAlerta)
          toast.warning(alerta.mensagem || "Um evento comeca em 5 minutos.", {
            description: alerta.titulo_evento,
            duration: 12000,
          })
        }
      )
      .subscribe()

    return () => {
      void supabaseClient.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      return
    }

    const supabaseClient = supabase

    const verificarLembretesLocais = async () => {
      const agora = new Date()
      const hoje = formatarDataLocal(agora)
      const amanha = formatarDataLocal(new Date(agora.getTime() + 24 * 60 * 60 * 1000))

      const { data, error } = await supabaseClient
        .from("eventos_calendario")
        .select("id,titulo,data,horario")
        .not("horario", "is", null)
        .gte("data", hoje)
        .lte("data", amanha)

      if (error || !data) {
        return
      }

      for (const evento of data as EventoCalendarioNotificacao[]) {
        const dataEvento = montarDataEvento(evento.data, evento.horario)
        if (!dataEvento) {
          continue
        }

        const diferencaMs = dataEvento.getTime() - agora.getTime()
        if (diferencaMs <= 0) {
          continue
        }

        const diferencaMinutos = diferencaMs / 60000

        for (const alvo of [5, 1]) {
          const dentroDaJanela = diferencaMinutos <= alvo && diferencaMinutos > alvo - 1
          if (!dentroDaJanela) {
            continue
          }

          const chaveAlerta = `${evento.id}-${alvo}`
          if (alertasEnviadosRef.current.has(chaveAlerta)) {
            continue
          }

          alertasEnviadosRef.current.add(chaveAlerta)
          toast.warning(`Lembrete: "${evento.titulo}" comeca em ${alvo} minuto${alvo === 1 ? "" : "s"}.`, {
            description: evento.titulo,
            duration: 12000,
          })
        }
      }
    }

    void verificarLembretesLocais()
    const intervalo = window.setInterval(() => {
      void verificarLembretesLocais()
    }, 30000)

    return () => {
      window.clearInterval(intervalo)
    }
  }, [])

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar navegarPara={navegarPara} inscricoes={usuario.inscricoes} marcarMural={marcarMural} />

        <main className="pagina-principal">
          <Navbar />
          <div className="pagina-conteudo">
            <GerenciadorTelas
              usuario={usuario}
              mudarInscricao={mudarInscricao}
              estaInscrito={estaInscrito}
              marcarMural={marcarMural}
              navegarPara={navegarPara}
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