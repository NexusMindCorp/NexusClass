import { useEffect, useState ,useCallback} from "react"
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient"
import type { EscolaProps, TurmaProps, UsuarioResumo, TurmaBanco } from "@/hooks/LeituraDataHooks/leituraJson"

export function useEscolaDados() {
  const [listaEscolar, setListaEscolar] = useState<EscolaProps>({
    escola: "",
    ano_letivo: new Date().getFullYear(),
    turmas: {},
  })
  const [carregandoEscola, setCarregandoEscola] = useState(false)
  const [erroEscola, setErroEscola] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase) {
      setErroEscola("Supabase não configurado para carregar turmas.")
      return
    }

    setCarregandoEscola(true)
    setErroEscola(null)

    try {
      const { data: escolaData, error: escolaError } = await supabase
        .from("escolas")
        .select("id,nome,ano_letivo")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()

      if (escolaError || !escolaData) {
        setErroEscola("Não foi possível carregar escolas no Supabase.")
        return
      }

      const { data: turmasData, error: turmasError } = await supabase
        .from("turmas_escolares")
        .select("id,chave,materia,banner_url,sala,turma")
        .eq("escola_id", escolaData.id)

      if (turmasError || !turmasData) {
        setErroEscola("Não foi possível carregar turmas no Supabase.")
        return
      }

      const turmas = turmasData as TurmaBanco[]
      const turmasId = turmas.map((turma) => turma.id)

      const alunosPorTurma = new Map<string, UsuarioResumo[]>()
      const professoresPorTurma = new Map<string, UsuarioResumo>()

      if (turmasId.length > 0) {
        const { data: profData } = await supabase
          .from("professor_turma")
          .select("turma_id,perfis(id,nome,foto_url)")
          .in("turma_id", turmasId)

        if (profData) {
          (profData as any[]).forEach((item: any) => {
            const perfil = Array.isArray(item.perfis) ? item.perfis[0] : item.perfis;
            if (perfil) {
              professoresPorTurma.set(item.turma_id, {
                id: perfil.id,
                nome: perfil.nome || '',
                foto_url: perfil.foto_url || null
              })
            }
          })
        }

        const { data: alunoData } = await supabase
          .from("aluno_turma")
          .select("turma_id,perfis(id,nome,foto_url)")
          .in("turma_id", turmasId)

        if (alunoData) {
          (alunoData as any[]).forEach((item: any) => {
            const perfil = Array.isArray(item.perfis) ? item.perfis[0] : item.perfis;

            if (perfil?.nome) {
              const listaAtual = alunosPorTurma.get(item.turma_id) || []
              listaAtual.push({
                id: perfil.id,
                nome: perfil.nome,
                foto_url: perfil.foto_url || null
              })
              alunosPorTurma.set(item.turma_id, listaAtual)
            }
          })
        }
      }

      const turmasFormatadas: Record<string, TurmaProps> = {}
      for (const turma of turmas) {
        const prof = professoresPorTurma.get(turma.id)

        turmasFormatadas[turma.id] = {
          materia: turma.materia || "",
          professor: prof?.nome || "Anônimo",
          professor_id: prof?.id,
          banners: turma.banner_url || "",
          alunos: alunosPorTurma.get(turma.id) || [],
          foto_professor: prof?.foto_url || "",
          sala: turma.sala || "",
          turma: turma.turma || "",
        }
      }

      setListaEscolar({
        escola: escolaData.nome,
        ano_letivo: escolaData.ano_letivo,
        turmas: turmasFormatadas,
      })
    } catch (error) {
      setErroEscola("Ocorreu um erro inesperado ao carregar os dados escolares.")
    } finally {
      setCarregandoEscola(false)
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  return { listaEscolar, carregandoEscola, erroEscola }
}