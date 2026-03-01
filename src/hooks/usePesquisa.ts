import { listaEscolar } from "@/hooks/leituraJson"
import { useState, useMemo } from "react"

type UsePesquisaProps = {
    aoFecharPesquisa: () => void
}

export function usePesquisa({ aoFecharPesquisa }: UsePesquisaProps) {
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
        return Object.entries(listaEscolar.turmas).filter(([_, turma]) => {
            return (
                turma.materia.toLowerCase().includes(consulta) ||
                turma.professor.toLowerCase().includes(consulta) ||
                turma.sala.toLowerCase().includes(consulta) ||
                turma.turma.toLowerCase().includes(consulta)
            )
        })
    }, [textoPesquisa])

    return {
        textoPesquisa,
        setTextoPesquisa,
        aberto,
        mudarAberturaSheet,
        turmasFiltradas,
    }
}