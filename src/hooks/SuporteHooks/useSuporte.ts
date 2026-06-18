import { supabase } from "@/lib/supabaseClient"
import { useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { toast } from "sonner"
import { useOutletContext } from 'react-router-dom'
import type { PerfilUsuario } from '@/hooks/AuthHooks/type'
import { formFields } from "@/hooks/SuporteHooks/config"
import { sendContactEmail } from "@/hooks/SuporteHooks/loadData"


export function useSuporte() {

  const formRef = useRef<HTMLFormElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [sending, setSending] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const { perfil } = useOutletContext<{ session: unknown; perfil: PerfilUsuario | null }>()

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAttachedFiles(Array.from(event.target.files ?? []))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formRef.current) return

    setSending(true)

    try {
     
      await sendContactEmail({ formElement: formRef.current, files: attachedFiles, perfil, supabase })
      toast.success("Mensagem enviada com sucesso.")
      
      formRef.current.reset()
      setAttachedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ""
      
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Não foi possível enviar sua mensagem. Tente novamente.")
    } finally {
      setSending(false)
    }
  }

  return {
    formRef,
    fileInputRef,
    sending,
    attachedFiles,
    handleFileChange,
    handleSubmit,
    formFields,
    perfil
  }
}
