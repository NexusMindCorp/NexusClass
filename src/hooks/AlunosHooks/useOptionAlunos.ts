import { useState } from "react";
import type { Option } from "./type"

export function useOptionAlunos() {
    const [opcaoSelecionada, setOpcaoSelecionada] = useState<Option | null>(null);
    const [nomeAluno, setNomeAluno] = useState<string>("");
    const [idAluno, setIdAluno] = useState<string>("");

    const handleOptionSelect = (option: Option | null, aluno?: string, alunoId?: string) => {
        setOpcaoSelecionada(option);
        if (option === null) {
            setNomeAluno("")
            setIdAluno("")
            return
        }
        if (aluno) {
            setNomeAluno(aluno);
        }
        if (alunoId) {
            setIdAluno(alunoId);
        }
    }

    return {
        opcaoSelecionada,
        nomeAluno,
        idAluno,
        handleOptionSelect,
    }
}
