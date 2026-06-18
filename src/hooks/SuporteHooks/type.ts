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

export type sendContactEmailParams = {
  formElement: HTMLFormElement,
  files: File[],
  perfil?: { nome: string; email: string } | null
  supabase: any
}
