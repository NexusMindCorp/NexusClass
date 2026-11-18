import { useState, useCallback, useEffect, useMemo } from "react"
import { addDays } from "date-fns"
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient"
import { comunicacaoRepository } from "@/repositories"
import type { ErroSupabase, EventoCalendario, UseCalendarioProps } from "./type"
import {paraChaveData, paraData, hojeLocal, formatarErroSupabase, montarDataEvento} from "@/lib/utils"

function eventoAindaAtivo(evento: EventoCalendario, agora = new Date()) {
  if (!evento.horario) {
    return paraData(evento.data) >= hojeLocal()
  }

  const dataEvento = montarDataEvento(evento.data, evento.horario)
  return Boolean(dataEvento && dataEvento > agora)
}

export function useCalendario({ perfil, inscricoes, turmasGlobais }: UseCalendarioProps) {
  const usaSupabase = Boolean(supabase && hasSupabaseConfig)
  const [date, setDateState] = useState<Date>(hojeLocal())
  const [mostrarBoxAgendamento, setMostrarBoxAgendamento] = useState(false)
  const [eventos, setEventos] = useState<EventoCalendario[]>([])
  const [sobreEvento, setSobreEvento] = useState({ titulo: "", descricao: "", horario: "", tipo: "pessoal" as EventoCalendario["tipo"], turmaSelecionada: "" })
  const [processamentoEvento, setProcessamentoEvento] = useState({ carregandoEventos: false, salvandoEvento: false })
  const [erroBanco, setErroBanco] = useState<string | null>(
    usaSupabase
      ? null
      : "Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env."
  )
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  const carregarEventosSupabase = useCallback(async () => {
    if (!supabase || !perfil?.id) {
      return
    }
    setProcessamentoEvento((anterior) => ({ ...anterior, carregandoEventos: true }))
    setErroBanco(null)

    try {
      const idsTurmas = Object.keys(inscricoes || {}).filter(
        (turmaId) => inscricoes[turmaId]
      )
      const eventosCarregados = await comunicacaoRepository.listarEventos(
        perfil,
        idsTurmas,
        paraChaveData(hojeLocal())
      )
      setEventos(eventosCarregados.filter((evento) => eventoAindaAtivo(evento)))
    } catch (error) {
      setErroBanco(
        formatarErroSupabase(error as ErroSupabase, "carregar eventos")
      )
    } finally {
      setProcessamentoEvento((anterior) => ({ ...anterior, carregandoEventos: false }))
    }
  }, [perfil.id, perfil.role, inscricoes])

  useEffect(() => {
    if (!usaSupabase) {
      return
    }

    const carregamentoAgendado = window.setTimeout(() => {
      void carregarEventosSupabase()
    }, 0)

    return () => {
      window.clearTimeout(carregamentoAgendado)
    }
  }, [carregarEventosSupabase, usaSupabase])

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setEventos((eventosAtuais) =>
        eventosAtuais.filter((evento) => eventoAindaAtivo(evento))
      )
    }, 30000)

    return () => {
      window.clearInterval(intervalo)
    }
  }, [])

  const datasPorTipoEvento = useMemo(() => {
    const pessoais = new Set<string>()
    const turmas = new Set<string>()

    eventos.forEach((evento) => {
      if (evento.tipo === "pessoal") {
        pessoais.add(evento.data)
      }

      if (evento.tipo === "turma") {
        turmas.add(evento.data)
      }
    })

    const mistas = new Set(
      Array.from(pessoais).filter((data) => turmas.has(data))
    )

    return {
      pessoais: Array.from(pessoais)
        .filter((data) => !mistas.has(data))
        .map(paraData),
      turmas: Array.from(turmas)
        .filter((data) => !mistas.has(data))
        .map(paraData),
      mistas: Array.from(mistas).map(paraData),
    }
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

    if (!horarioLimpo) {
      setErroBanco("Informe o horário do evento.")
      return
    }

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
      const eventoInserido = await comunicacaoRepository.criarEvento({
        titulo: tituloLimpo,
        descricao: descricaoLimpa,
        data: paraChaveData(date),
        horario: horarioLimpo,
        tipo: tipoFinal,
        idTurma: turmaIdFinal,
        idAutor: perfil.id,
      })

      setEventos((anteriores) => [...anteriores, eventoInserido])

      setSobreEvento({ titulo: "", descricao: "", horario: "", tipo: "pessoal", turmaSelecionada: "" })
      setDateState(hojeLocal())
      setMostrarBoxAgendamento(false)
    } catch (error) {
      setErroBanco(formatarErroSupabase(error as ErroSupabase, "salvar evento"))
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
    try {
      await comunicacaoRepository.excluirEvento(id)
      setEventos((anteriores) => anteriores.filter((evento) => evento.id !== id))
    } catch (error) {
      setErroBanco(formatarErroSupabase(error as ErroSupabase, "remover evento"))
    }
  }

  const selecionarDataRelativa = (dias: number) => {
    const novaData = addDays(hojeLocal(), dias)
    setDateState(novaData)
    setCurrentMonth(new Date(novaData.getFullYear(), novaData.getMonth(), 1))
  }

  const selecionarDataCalendario = (novaData: Date | undefined) => {
    const dataSelecionada = novaData ?? date

    setDateState(dataSelecionada)
    setMostrarBoxAgendamento(true)
    setCurrentMonth(
      new Date(dataSelecionada.getFullYear(), dataSelecionada.getMonth(), 1)
    )
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
    datasComEventoPessoal: datasPorTipoEvento.pessoais,
    datasComEventoTurma: datasPorTipoEvento.turmas,
    datasComEventosMistos: datasPorTipoEvento.mistas,
    eventosDoDia,
    adicionarEvento,
    removerEvento,
    selecionarDataRelativa,
  }
}
