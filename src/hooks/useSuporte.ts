import { supabase } from "@/lib/supabaseClient"
import { useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { toast } from "sonner"
import { useOutletContext } from 'react-router-dom'
import type { PerfilUsuario } from '@/hooks/useAuth'

export type FormField = {
  key: string
  titulo: string
  id: string
  nome: string
  escritoNoInputbox: string
  decricao: string
  tipo?: string
  textArea?: boolean
  required?: boolean
  inputOption?: Array<{
    label: string
    value: string
  }>
}

export const formFields: FormField[] = [
  {
    key: "name",
    titulo: "Nome",
    id: "nome",
    nome: "from_name",
    escritoNoInputbox: "Digite seu nome completo",
    decricao: "Nome de quem está solicitando o suporte.",
    required: true,
  },
  {
    key: "email",
    titulo: "Email",
    id: "email",
    nome: "reply_to",
    escritoNoInputbox: "Digite seu email",
    decricao: "Usado para retorno da equipe.",
    tipo: "email",
    required: true,
  },
  {
    key: "subject",
    titulo: "Assunto",
    id: "subject",
    nome: "subject",
    escritoNoInputbox: "Selecione o assunto",
    decricao: "Selecione o assunto que melhor descreve o problema.",
    inputOption: [
      { label: "Dúvida geral sobre o site", value: "duvida-geral" },
      { label: "Erro técnico no site", value: "erro-tecnico" },
      { label: "Solicitação de recurso ou melhoria", value: "solicitacao-recurso" },
      { label: "Erro de visualização do mural", value: "erro-visualizacao-mural" },
      { label: "Erro de visualização do perfil", value: "erro-visualizacao-perfil" },
      { label: "Erro de visualização das atividades", value: "erro-visualizacao-atividades" },
      { label: "Erro de visualização dos posts", value: "erro-visualizacao-posts" },
      { label: "Erro de visualização das dúvidas", value: "erro-visualizacao-duvidas" },
      { label: "Erro de visualização das pesquisas", value: "erro-visualizacao-pesquisas" },
      { label: "Erro de visualização do calendário", value: "erro-visualizacao-calendario" },
      { label: "Erro de comunicação com o chatbot", value: "erro-comunicacao-chatbot" },
      { label: "Erro de acesso as configurações avançadas", value: "erro-acesso-configuracoes" },
      { label: "Acesso à conta", value: "acesso-conta" },
      { label: "Atendimento urgente", value: "atendimento-urgente" },
    ],
    required: true,
  },
  {
    key: "message",
    titulo: "Mensagem",
    id: "message",
    nome: "message",
    escritoNoInputbox:
      "Descreva o problema, passos para reproduzir e o que você esperava acontecer.",
    decricao: "Inclua prints, tela afetada e horário, se possível.",
    textArea: true,
    required: true,
  },
]

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
