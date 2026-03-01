import { useState } from "react";

export function useGerenciador() {
    const [usuario, setUsuario] = useState({
        inscricoes: {} as Record<string, boolean>,
        acessouOq: "principal" as "mural" | "calendario" | "principal" | "pesquisar",
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
        setUsuario((anterior) => ({ ...anterior, acessouOq: "mural", chaveMural: key }));
    };

    const marcarCalendario = () => {
        setUsuario((anterior) => ({ ...anterior, acessouOq: "calendario" }));
    };

    const navegarPara = (tela: "mural" | "calendario" | "principal" | "pesquisar") => {
        setUsuario((anterior) => ({ ...anterior, acessouOq: tela }));
    };

    const marcarPesquisa = () => {
        setUsuario((anterior) => ({ ...anterior, acessouOq: "pesquisar" }));
    }

    return { usuario, mudarInscricao, estaInscrito, marcarMural, marcarCalendario, navegarPara, marcarPesquisa };
}