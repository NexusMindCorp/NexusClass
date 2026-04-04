import * as React from "react"
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient"
import type { EscolaProps, TurmaProps } from "@/hooks/leituraJson"

type EscolaBanco = {
  id: string
  nome: string
  ano_letivo: number
}

type TurmaBanco = {
  id: string
  chave: string
  materia: string
  professor: string
  banner_url: string
  foto_professor_url: string
  sala: string
  turma: string
}

type AlunoBanco = {
  turma_id: string
  nome: string
}

function montarListaEscolar(
  escola: EscolaBanco,
  turmas: TurmaBanco[],
  alunos: AlunoBanco[]
): EscolaProps {
  const alunosPorTurma = new Map<string, string[]>()

  for (const aluno of alunos) {
    const listaAtual = alunosPorTurma.get(aluno.turma_id) ?? []
    listaAtual.push(aluno.nome)
    alunosPorTurma.set(aluno.turma_id, listaAtual)
  }

  const turmasMap: Record<string, TurmaProps> = {}
  for (const turma of turmas) {
    turmasMap[turma.chave] = {
      materia: turma.materia,
      professor: turma.professor,
      banners: turma.banner_url,
      alunos: alunosPorTurma.get(turma.id) ?? [],
      foto_professor: turma.foto_professor_url,
      sala: turma.sala,
      turma: turma.turma,
    }
  }

  return {
    escola: escola.nome,
    ano_letivo: escola.ano_letivo,
    turmas: turmasMap,
  }
}

export function useEscolaDados() {
  const [listaEscolar, setListaEscolar] = React.useState<EscolaProps>({
    escola: "",
    ano_letivo: new Date().getFullYear(),
    turmas: {},
  })
  const [carregandoEscola, setCarregandoEscola] = React.useState(false)
  const [erroEscola, setErroEscola] = React.useState<string | null>(null)

  const carregar = React.useCallback(async () => {
    if (!hasSupabaseConfig || !supabase) {
      setErroEscola("Supabase nao configurado para carregar turmas.")
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
        setErroEscola("Nao foi possivel carregar escolas no Supabase.")
        return
      }

      const escola = escolaData as EscolaBanco

      const { data: turmasData, error: turmasError } = await supabase
        .from("turmas_escolares")
        .select("id,chave,materia,professor,banner_url,foto_professor_url,sala,turma")
        .eq("escola_id", escola.id)

      if (turmasError || !turmasData) {
        setErroEscola("Nao foi possivel carregar turmas no Supabase.")
        return
      }

      const turmas = turmasData as TurmaBanco[]
      const turmaIds = turmas.map((turma) => turma.id)

      let alunos: AlunoBanco[] = []
      if (turmaIds.length > 0) {
        const { data: alunosData, error: alunosError } = await supabase
          .from("turma_alunos")
          .select("turma_id,nome")
          .in("turma_id", turmaIds)
          .order("nome", { ascending: true })

        if (alunosError) {
          setErroEscola("Nao foi possivel carregar alunos no Supabase.")
          return
        }

        alunos = (alunosData ?? []) as AlunoBanco[]
      }

      setListaEscolar(montarListaEscolar(escola, turmas, alunos))
    } catch {
      setErroEscola("Falha de conexao ao carregar dados do Supabase.")
    } finally {
      setCarregandoEscola(false)
    }
  }, [])

  React.useEffect(() => {
    void carregar()
  }, [carregar])

  return {
    listaEscolar,
    carregandoEscola,
    erroEscola,
  }
}
