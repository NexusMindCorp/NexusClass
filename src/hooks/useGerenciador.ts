import { useState } from "react";

export function useGerenciador() {
    const [usuario, setUsuario] = useState({inscrito: false, acessouMural: false, chaveMural: ""});
    const mudarInscricao = () => {
        setUsuario({...usuario, inscrito: !usuario.inscrito});
    }
    const marcarMural = (key: string) => {
        setUsuario({...usuario, acessouMural: true, chaveMural: key});
    }

    return { usuario, mudarInscricao, marcarMural };
}