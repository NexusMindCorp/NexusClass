import { useState, useMemo } from "react"
import type { TurmaProps } from "@/hooks/leituraJson"

type UsePesquisaProps = {
    aoFecharPesquisa: () => void
    turmas: Record<string, TurmaProps>
}

export function usePesquisa({ aoFecharPesquisa, turmas }: UsePesquisaProps) {
    const [textoPesquisa, setTextoPesquisa] = useState("")
    const [aberto, setAberto] = useState(true)

    const mudarAberturaSheet = (estaAberto: boolean) => {
        setAberto(estaAberto)
        if (!estaAberto) {
            aoFecharPesquisa()
        }
    }

    const turmasFiltradas = useMemo(() => {
        if (!textoPesquisa.trim()) return []

        const consulta = textoPesquisa.toLowerCase()
        return Object.entries(turmas).filter(([_, turma]) => {
            return (
                turma.materia.toLowerCase().includes(consulta) ||
                turma.professor.toLowerCase().includes(consulta) ||
                turma.sala.toLowerCase().includes(consulta) ||
                turma.turma.toLowerCase().includes(consulta)
            )
        })
    }, [textoPesquisa, turmas])

    return {
        textoPesquisa,
        setTextoPesquisa,
        aberto,
        mudarAberturaSheet,
        turmasFiltradas,
    }
}