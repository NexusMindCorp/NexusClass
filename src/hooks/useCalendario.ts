import * as React from "react"
import { addDays } from "date-fns"
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient"

type EventoCalendario = {
  id: string
  titulo: string
  descricao: string
  data: string
  horario: string
}

type EventoCalendarioBanco = {
  id: string
  titulo: string
  descricao: string
  data: string
  horario: string | null
}

type ErroSupabase = {
  code?: string
  message?: string
  details?: string
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

export function useCalendario() {
  const usaSupabase = Boolean(supabase && hasSupabaseConfig)
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [eventos, setEventos] = React.useState<EventoCalendario[]>([])
  const [titulo, setTitulo] = React.useState("")
  const [descricao, setDescricao] = React.useState("")
  const [horario, setHorario] = React.useState("")
  const [carregandoEventos, setCarregandoEventos] = React.useState(false)
  const [salvandoEvento, setSalvandoEvento] = React.useState(false)
  const [erroBanco, setErroBanco] = React.useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  const carregarEventosSupabase = React.useCallback(async () => {
    if (!supabase) {
      return
    }

    setCarregandoEventos(true)
    setErroBanco(null)

    const { data, error } = await supabase
      .from("eventos_calendario")
      .select("id,titulo,descricao,data,horario")
      .order("data", { ascending: true })
      .order("horario", { ascending: true, nullsFirst: false })

    if (error) {
      setErroBanco(formatarErroSupabase(error, "carregar eventos"))
      setCarregandoEventos(false)
      return
    }

    const normalizados = (data as EventoCalendarioBanco[]).map((evento) => ({
      id: evento.id,
      titulo: evento.titulo,
      descricao: evento.descricao,
      data: evento.data,
      horario: evento.horario ?? "",
    }))

    setEventos(normalizados)
    setCarregandoEventos(false)
  }, [])

  React.useEffect(() => {
    if (!usaSupabase) {
      setErroBanco(
        "Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env."
      )
      return
    }

    void carregarEventosSupabase()
  }, [carregarEventosSupabase, usaSupabase])

  const datasComEvento = React.useMemo(() => {
    const unicas = new Set(eventos.map((evento) => evento.data))
    return Array.from(unicas).map(paraData)
  }, [eventos])

  const eventosDoDia = React.useMemo(() => {
    if (!date) {
      return []
    }

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
    if (!date || !titulo.trim()) {
      return
    }

    const tituloLimpo = titulo.trim()
    const descricaoLimpa = descricao.trim()
    const horarioLimpo = horario.trim()

    if (!usaSupabase || !supabase) {
      setErroBanco(
        "Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env."
      )
      return
    }

    setSalvandoEvento(true)
    setErroBanco(null)

    const { data, error } = await supabase
      .from("eventos_calendario")
      .insert({
        titulo: tituloLimpo,
        descricao: descricaoLimpa,
        data: paraChaveData(date),
        horario: horarioLimpo || null,
      })
      .select("id,titulo,descricao,data,horario")
      .single()

    if (error) {
      setErroBanco(formatarErroSupabase(error, "salvar evento"))
      setSalvandoEvento(false)
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
      },
    ])

    setTitulo("")
    setDescricao("")
    setHorario("")
    setSalvandoEvento(false)
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
    const novaData = addDays(new Date(), dias)
    setDate(novaData)
    setCurrentMonth(new Date(novaData.getFullYear(), novaData.getMonth(), 1))
  }

  return {
    usaSupabase,
    date,
    setDate,
    currentMonth,
    setCurrentMonth,
    titulo,
    setTitulo,
    descricao,
    setDescricao,
    horario,
    setHorario,
    carregandoEventos,
    salvandoEvento,
    erroBanco,
    datasComEvento,
    eventosDoDia,
    adicionarEvento,
    removerEvento,
    selecionarDataRelativa,
  }
}
