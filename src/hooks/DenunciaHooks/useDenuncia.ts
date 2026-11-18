import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { comunicacaoRepository, extrairMensagemErroRepo, perfilRepository } from "@/repositories"

const defaultMotivos = [
  "Bullying/Assédio",
  "Conteúdo inapropriado",
  "Spam/Propaganda",
  "Comportamento ofensivo",
  "Perfil falso",
  "Problemas de segurança",
  "Outro",
]

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function useDenuncia() {
  const [motivos] = useState<string[]>(defaultMotivos)
  const [motivoSelecionado, setMotivoSelecionado] = useState<string>(motivos[0])
  const [detalhes, setDetalhes] = useState<string>("")

  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function submit(alvo: string, idAutor?: string) {
    setSending(true)
    setError(null)
    setSuccess(false)

    try {
      const autorResolvido =
        idAutor ||
        (await supabase.auth.getUser()).data.user?.id

      if (!autorResolvido) {
        throw new Error("Usuário não autenticado para registrar denúncia.")
      }

      let idDenunciado = alvo
      if (!UUID_REGEX.test(alvo)) {
        const perfilAlvo = await perfilRepository.buscarPorNome(alvo)
        if (!perfilAlvo) {
          throw new Error("Usuário denunciado não encontrado.")
        }
        idDenunciado = perfilAlvo.id
      }

      await comunicacaoRepository.criarDenuncia({
        idAutor: autorResolvido,
        idDenunciado,
        motivo: motivoSelecionado,
        descricao: detalhes,
      })

      setSuccess(true)
      setDetalhes("")
      setMotivoSelecionado(motivos[0])
    } catch (err: unknown) {
      setError(
        extrairMensagemErroRepo(
          err,
          "Erro de conexão ao enviar denúncia. Tente novamente.",
        ),
      )
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
