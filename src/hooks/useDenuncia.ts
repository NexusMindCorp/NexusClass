import { useState } from "react"
// IMPORTANTE: Ajuste o caminho de importação do seu cliente Supabase
import { supabase } from "@/lib/supabaseClient"

const defaultMotivos = [
  "Bullying/Assédio",
  "Conteúdo inapropriado",
  "Spam/Propaganda",
  "Comportamento ofensivo",
  "Perfil falso",
  "Problemas de segurança",
  "Outro",
]

export function useDenuncia() {
  const [motivos] = useState<string[]>(defaultMotivos)
  const [motivoSelecionado, setMotivoSelecionado] = useState<string>(motivos[0])
  const [detalhes, setDetalhes] = useState<string>("")

  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function submit(aluno: string) {
    setSending(true)
    setError(null)
    setSuccess(false)
    
    try {
      const { error: supabaseError } = await supabase
        .from('denuncias')
        .insert([
          { 
            aluno_denunciado: aluno, 
            motivo: motivoSelecionado,
            descricao: detalhes || "Nenhum detalhe adicional fornecido.",
            status: 'pendente'
          }
        ])

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      setSuccess(true)
      setDetalhes("")
      setMotivoSelecionado(motivos[0])

    } catch (err: any) {
      setError(err?.message || "Erro de conexão ao enviar denúncia. Tente novamente.")
      setSuccess(false)
      throw err
    } finally {
      setSending(false)
    }
  }

  return {
    motivos,
    motivoSelecionado,
    setMotivoSelecionado,
    detalhes,
    setDetalhes,
    sending,
    error,
    success,
    submit,
  }
}