import { supabase } from "@/lib/supabaseClient"
import { escolaTurmaRepository, perfilRepository } from "@/repositories"
import { toast } from "sonner"
import type { CarregamentoDadosProps, PerfilUsuario, TurmaProfessor } from "./type"

export function carregamentoDados({
  setPerfil,
  setMateriasProfessor,
  isMountedRef,
  lastUserIdRef,
  setSession,
  setLoading,
}: CarregamentoDadosProps) {
  const fetchPerfil = async (userId: string) => {
    try {
      const perfil = await perfilRepository.buscarPorId(userId)
      if (!perfil) {
        throw new Error("Perfil não encontrado para o usuário autenticado.")
      }
      setPerfil(perfil)
      return perfil
    } catch (error: unknown) {
      console.error("[useAuth] fetchPerfil - Captura de erro no catch:", error)
      toast.error("Erro ao carregar perfil", {
        description: "Não conseguimos buscar os dados da sua conta. Tente recarregar a página.",
      })
      return null as PerfilUsuario | null
    }
  }

  const fetchMateriasProfessor = async (userId: string, nomeProfessor = "Professor") => {
    try {
      const turmasEncontradas = await escolaTurmaRepository.listarTurmasProfessor(
        userId,
        nomeProfessor,
      )
      setMateriasProfessor(turmasEncontradas)
      return turmasEncontradas
    } catch (error: unknown) {
      toast.error("Erro ao carregar matérias do professor", {
        description: "Não conseguimos buscar as matérias relacionadas ao professor.",
      })
      console.error("useAuth.fetchMateriasProfessor erro:", error)
      return [] as TurmaProfessor[]
    }
  }

  const loadSessionAndData = async () => {
    try {
      const { data: { session: initialSession }, error } = await supabase.auth.getSession()
      if (error) {
        console.error("[useAuth] loadSessionAndData - Erro ao obter sessão:", error)
        throw error
      }
      if (!isMountedRef.current) return

      if (initialSession?.user) {
        lastUserIdRef.current = initialSession.user.id
        setSession(initialSession)
        const perfilCarregado = await fetchPerfil(initialSession.user.id)
        if (perfilCarregado?.role === "professor" && isMountedRef.current) {
          await fetchMateriasProfessor(initialSession.user.id, perfilCarregado.nome)
        }
      } else {
        lastUserIdRef.current = null
        setSession(null)
        setPerfil(null)
        setMateriasProfessor([])
      }
    } catch (err) {
      console.error("[useAuth] loadSessionAndData - Erro no fluxo inicial:", err)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  return { fetchPerfil, fetchMateriasProfessor, loadSessionAndData }
}
