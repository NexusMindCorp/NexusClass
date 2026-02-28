import { useState } from "react";

export function useGerenciador() {
    const [usuario, setUsuario] = useState({inscrito: false});
    const mudarInscricao = () => {
        setUsuario({...usuario, inscrito: !usuario.inscrito});
    }

    return { usuario, mudarInscricao };
}