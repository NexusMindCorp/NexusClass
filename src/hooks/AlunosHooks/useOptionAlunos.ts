import { useState } from "react";
import type { Option } from "./type"

export function useOptionAlunos() {
    const [opcaoSelecionada, setOpcaoSelecionada] = useState<Option | null>(null);
    const [nomeAluno, setNomeAluno] = useState<string>("");
    const handleOptionSelect = (option: Option | null, aluno?: string) => {
        setOpcaoSelecionada(option);
        if (option === null) {
            setNomeAluno("")
            return
        }
        if (aluno) {
            setNomeAluno(aluno);
        }
    }

    return {
        opcaoSelecionada,
        nomeAluno,
        handleOptionSelect,
    }
}