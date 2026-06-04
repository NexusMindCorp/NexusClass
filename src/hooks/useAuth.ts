import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase, hasSupabaseConfig } from "@/lib/supabaseClient"

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!hasSupabaseConfig || !supabase) {
            setLoading(false)
            return
        }

        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error("Erro ao obter sessão:", error)
            } else {
                setSession(session)
            }
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => {
            subscription?.unsubscribe()
        }
    }, [])
    return { session, loading }
}