import { useState } from "react"

export function useConfiguracoes() {
    const[notificacoes, setNotificacoes] = useState(false)
    
    const clickarNotificacoes = () => {
        setNotificacoes(!notificacoes)
    }

    return {notificacoes, clickarNotificacoes}
}