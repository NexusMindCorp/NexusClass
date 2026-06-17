import { supabase } from "@/lib/supabaseClient"
import { useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { toast } from "sonner"
import { useOutletContext } from 'react-router-dom'
import type { PerfilUsuario } from '@/hooks/AuthHooks/type'
import { formFields } from "@/hooks/SuporteHooks/config"
export const sendContactEmail = async (formElement: HTMLFormElement, files: File[], perfil?: { nome: string; email: string } | null): Promise<void> => {
  const formData = new FormData(formElement);
  const nomeFromForm = String(formData.get("from_name") ?? "").trim();
  const emailFromForm = String(formData.get("from_email") ?? formData.get("reply_to") ?? "").trim();
  const nome = nomeFromForm || perfil?.nome || "";
  const email = emailFromForm || perfil?.email || "";
  const assunto = String(formData.get("subject") ?? "").trim();
  const mensagem = String(formData.get("message") ?? "").trim();

  if (!nome || !email || !assunto || !mensagem) {
    throw new Error("Preencha todos os campos antes de confirmar o envio.");
  }

  const urlsAnexos: string[] = [];

  
  if (files.length > 0) {
    for (const file of files) {
    
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Faz o upload para o bucket 'anexos_suporte'
      const { error: uploadError } = await supabase.storage
        .from('anexos_suporte')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error("Erro ao fazer upload do anexo: " + uploadError.message);
      }

      // Pega a URL pública da imagem recém-upada
      const { data: publicUrlData } = supabase.storage
        .from('anexos_suporte')
        .getPublicUrl(fileName);

      urlsAnexos.push(publicUrlData.publicUrl);
    }
  }

  
  const { error } = await supabase
    .from('suporte')
    .insert([
      { 
        nome,
        email,
        assunto,
        mensagem,
        anexos_urls: urlsAnexos, 
        status: 'pendente'
      }
    ]);

  if (error) {
    throw new Error(error.message);
  }
};

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
     
      await sendContactEmail(formRef.current, attachedFiles, perfil)
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
