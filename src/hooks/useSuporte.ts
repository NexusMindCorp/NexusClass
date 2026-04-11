import { useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { toast } from "sonner"

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
      { label: "Erro de visualização do calendário", value: "erro-visualizacao-calendario" },
      { label: "Erro de comunicação com o chatbot", value: "erro-comunicacao-chatbot" },
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

export const sendContactEmail = async (formElement: HTMLFormElement): Promise<void> => {
  const formData = new FormData(formElement);
  const nome = String(formData.get("from_name") ?? "").trim();
  const email = String(formData.get("from_email") ?? formData.get("reply_to") ?? "").trim();
  const assunto = String(formData.get("subject") ?? "").trim();
  const mensagem = String(formData.get("message") ?? "").trim();

  if (!nome || !email || !assunto || !mensagem) {
    throw new Error("Preencha todos os campos antes de confirmar o envio.");
  }

  await new Promise((resolve) => setTimeout(resolve, 250));
  console.log("Confirmação local de e-mail registrada:", { nome, email, assunto });
};

export function useSuporte() {
  const formRef = useRef<HTMLFormElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [sending, setSending] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAttachedFiles(Array.from(event.target.files ?? []))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formRef.current) return

    setSending(true)

    try {
      await sendContactEmail(formRef.current)
      toast.success("Mensagem enviada com sucesso.")
      formRef.current.reset()
      setAttachedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (error) {
      console.error(error)
      toast.error("Não foi possível enviar sua mensagem. Tente novamente.")
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
  }
}
