import { useState, useCallback, useEffect, useMemo } from "react"
import { addDays } from "date-fns"
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient"
import type { TurmaProps } from "./leituraJson"
import type { PerfilUsuario } from "./useAuth"

type EventoCalendario = {
  id: string
  titulo: string
  descricao: string
  data: string
  horario: string
  tipo: "pessoal" | "turma"
  turma_id: string | null
  autor_id: string
}

type EventoCalendarioBanco = {
  id: string
  titulo: string
  descricao: string
  data: string
  horario: string | null
  tipo: "pessoal" | "turma"
  turma_id: string | null
  autor_id: string
}

type ErroSupabase = {
  code?: string
  message?: string
  details?: string
}

type UseCalendarioProps = {
  perfil: PerfilUsuario;
  inscricoes: Record<string, boolean>;
  turmasGlobais: Record<string, TurmaProps>;
}

function paraChaveData(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

function paraData(chaveData: string) {
  const [ano, mes, dia] = chaveData.split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}

function hojeLocal() {
  const agora = new Date()
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
}

function formatarErroSupabase(erro: ErroSupabase, acao: string) {
  if (erro.code === "PGRST205") {
    return `Falha ao ${acao}: PostgREST nao encontrou public.eventos_calendario no cache de schema. Rode o SQL em supabase/001_eventos_calendario.sql e recarregue o schema.`
  }

  if (erro.code === "42P01") {
    return `Falha ao ${acao}: tabela eventos_calendario nao existe. Rode o SQL em supabase/001_eventos_calendario.sql.`
  }

  if (erro.code === "42501") {
    return `Falha ao ${acao}: permissao negada (RLS). Verifique as policies da tabela eventos_calendario.`
  }

  const detalhes = erro.details ? ` (${erro.details})` : ""
  const mensagem = erro.message ? ` ${erro.message}${detalhes}` : ""
  return `Falha ao ${acao} no Supabase.${mensagem}`
}

export function useCalendario({ perfil, inscricoes, turmasGlobais }: UseCalendarioProps) {
  const usaSupabase = Boolean(supabase && hasSupabaseConfig)
  const [date, setDateState] = useState<Date>(hojeLocal())
  const [mostrarBoxAgendamento, setMostrarBoxAgendamento] = useState(false)
  const [eventos, setEventos] = useState<EventoCalendario[]>([])
  const [sobreEvento, setSobreEvento] = useState({ titulo: "", descricao: "", horario: "", tipo: "pessoal" as EventoCalendario["tipo"], turmaSelecionada: "" })
  const [processamentoEvento, setProcessamentoEvento] = useState({ carregandoEventos: false, salvandoEvento: false })
  const [erroBanco, setErroBanco] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  const removerEventosPassados = async () => {
    const hoje = hojeLocal()
    const hojeChave = paraChaveData(hoje)

    if (supabase) {
      const { error } = await supabase
        .from("eventos_calendario")
        .delete()
        .lt("data", hojeChave)

      if (error) {
        setErroBanco(formatarErroSupabase(error, "remover eventos passados"))
      }
    }

    setEventos((anteriores) =>
      anteriores.filter((evento) => paraData(evento.data) >= hoje)
    )
  }

  const carregarEventosSupabase = useCallback(async () => {
    if (!supabase) {
      return
    }
    await removerEventosPassados()
    setProcessamentoEvento((anterior) => ({ ...anterior, carregandoEventos: true }))
    setErroBanco(null)

    try {
      const { data, error } = await supabase
        .from("eventos_calendario")
        .select("id,titulo,descricao,data,horario")
        .order("data", { ascending: true })
        .order("horario", { ascending: true, nullsFirst: false })

      if (error) {
        setErroBanco(formatarErroSupabase(error, "carregar eventos"))
        return
      }

      const normalizados = (data as EventoCalendarioBanco[]).map((evento) => ({
        id: evento.id,
        titulo: evento.titulo,
        descricao: evento.descricao,
        data: evento.data,
        horario: evento.horario ?? "",
        tipo: evento.tipo,
        turma_id: evento.turma_id,
        autor_id: evento.autor_id,
      }))

      setEventos(normalizados)
    } catch {
      setErroBanco(
        "Falha ao carregar eventos no Supabase. Verifique sua conexao e as configuracoes de URL/chave no .env."
      )
    } finally {
      setProcessamentoEvento((anterior) => ({ ...anterior, carregandoEventos: false }))
    }
  }, [])

  useEffect(() => {
    if (!usaSupabase) {
      setErroBanco(
        "Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env."
      )
      return
    }

    void carregarEventosSupabase()
  }, [carregarEventosSupabase, usaSupabase])

  const datasComEvento = useMemo(() => {
    const unicas = new Set(eventos.map((evento) => evento.data))
    return Array.from(unicas).map(paraData)
  }, [eventos])

  const eventosDoDia = useMemo(() => {
    const chaveDataSelecionada = paraChaveData(date)
    return eventos
      .filter((evento) => evento.data === chaveDataSelecionada)
      .sort((a, b) => {
        if (a.horario && b.horario) {
          return a.horario.localeCompare(b.horario)
        }
        if (a.horario) {
          return -1
        }
        if (b.horario) {
          return 1
        }
        return 0
      })
  }, [date, eventos])

  const adicionarEvento = async () => {
    if (!date || !sobreEvento.titulo.trim()) {
      return
    }

    const tituloLimpo = sobreEvento.titulo.trim()
    const descricaoLimpa = sobreEvento.descricao.trim()
    const horarioLimpo = sobreEvento.horario.trim()

    if (!usaSupabase || !supabase) {
      setErroBanco(
        "Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env."
      )
      return
    }

    setProcessamentoEvento((anterior) => ({ ...anterior, salvandoEvento: true }))
    setErroBanco(null)

    const tipoFinal = perfil.role === "aluno" ? "pessoal" : sobreEvento.tipo
    const turmaIdFinal = tipoFinal === "pessoal" ? null : (sobreEvento.turmaSelecionada || null)

    try {
      const { data, error } = await supabase
        .from("eventos_calendario")
        .insert({
          titulo: tituloLimpo,
          descricao: descricaoLimpa,
          data: paraChaveData(date),
          horario: horarioLimpo || null,
          tipo: tipoFinal,
          turma_id: turmaIdFinal,
          autor_id: perfil.id,
        })
        .select("id,titulo,descricao,data,horario,tipo,turma_id,autor_id")
        .single()

      if (error) {
        setErroBanco(formatarErroSupabase(error, "salvar evento"))
        return
      }

      const eventoInserido = data as EventoCalendarioBanco
      setEventos((anteriores) => [
        ...anteriores,
        {
          id: eventoInserido.id,
          titulo: eventoInserido.titulo,
          descricao: eventoInserido.descricao,
          data: eventoInserido.data,
          horario: eventoInserido.horario ?? "",
          tipo: eventoInserido.tipo,
          turma_id: eventoInserido.turma_id,
          autor_id: eventoInserido.autor_id,
        },
      ])

      setSobreEvento({ titulo: "", descricao: "", horario: "", tipo: "pessoal", turmaSelecionada: "" })
      setDateState(hojeLocal())
      setMostrarBoxAgendamento(false)
    } catch {
      setErroBanco(
        "Falha ao salvar evento no Supabase. Verifique sua conexao e as configuracoes de URL/chave no .env."
      )
    } finally {
      setProcessamentoEvento((anterior) => ({ ...anterior, salvandoEvento: false }))
    }
  }

  const removerEvento = async (id: string) => {
    if (!usaSupabase || !supabase) {
      setErroBanco(
        "Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env."
      )
      return
    }

    setErroBanco(null)
    const { error } = await supabase.from("eventos_calendario").delete().eq("id", id)

    if (error) {
      setErroBanco(formatarErroSupabase(error, "remover evento"))
      return
    }

    setEventos((anteriores) => anteriores.filter((evento) => evento.id !== id))
  }

  const selecionarDataRelativa = (dias: number) => {
    const novaData = addDays(hojeLocal(), dias)
    setDateState(novaData)
    setCurrentMonth(new Date(novaData.getFullYear(), novaData.getMonth(), 1))
  }

  const selecionarDataCalendario = (novaData: Date | undefined) => {
    setDateState(novaData ?? hojeLocal())
    setMostrarBoxAgendamento(Boolean(novaData))

    if (novaData) {
      setCurrentMonth(new Date(novaData.getFullYear(), novaData.getMonth(), 1))
    }
  }

  const cancelarAgendamento = () => {
    setSobreEvento({ titulo: "", descricao: "", horario: "", tipo: "pessoal", turmaSelecionada: "" })
    setDateState(hojeLocal())
    setMostrarBoxAgendamento(false)
  }

  return {
    perfil,
    inscricoes,
    turmasGlobais,
    usaSupabase,
    date,
    selecionarDataCalendario,
    mostrarBoxAgendamento,
    cancelarAgendamento,
    currentMonth,
    setCurrentMonth,
    sobreEvento,
    setSobreEvento,
    processamentoEvento,
    erroBanco,
    datasComEvento,
    eventosDoDia,
    adicionarEvento,
    removerEvento,
    selecionarDataRelativa,
  }
}
