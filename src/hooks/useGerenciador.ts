import { useState } from "react";

export function useGerenciador() {
    const [usuario, setUsuario] = useState({
        inscricoes: {} as Record<string, boolean>,
        acessouMural: false,
        chaveMural: "",
    });

    const mudarInscricao = (materia: string) => {
        setUsuario((anterior) => ({
            ...anterior,
            inscricoes: {
                ...anterior.inscricoes,
                [materia]: !anterior.inscricoes[materia],
            },
        }));
    };

    const estaInscrito = (materia: string) => Boolean(usuario.inscricoes[materia]);

    const marcarMural = (key: string) => {
        setUsuario((anterior) => ({ ...anterior, acessouMural: true, chaveMural: key }));
    };

    return { usuario, mudarInscricao, estaInscrito, marcarMural };
}