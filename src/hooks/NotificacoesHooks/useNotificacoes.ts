import { useEffect, useState } from "react"
import { obterObjetoLocalStorage, salvarObjetoLocalStorage } from "@/lib/utils"
import {
    CHAVE_INDICADORES_NOTIFICACAO,
    INDICADORES_PADRAO,
} from "./config"
import type { IndicadoresNotificacao } from "./type"

export function useNotificacoes(usuarioId: string) {
    const chaveArmazenamento = `${CHAVE_INDICADORES_NOTIFICACAO}:${usuarioId}`
    const [indicadores, setIndicadores] = useState<IndicadoresNotificacao>(() =>
        obterObjetoLocalStorage(chaveArmazenamento, INDICADORES_PADRAO)
    )

    useEffect(() => {
        salvarObjetoLocalStorage(chaveArmazenamento, indicadores)
    }, [chaveArmazenamento, indicadores])

    return {
        indicadoresNotificacao: indicadores,
        setIndicadoresNotificacao: setIndicadores,
    }
}
