import { useState } from "react";

type Option ='Ver Perfil' | 'Enviar Mensagem' | 'Adicionar aos Favoritos' | 'Denunciar';
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