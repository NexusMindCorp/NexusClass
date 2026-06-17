import type { PerfilUsuario } from "@/hooks/AuthHooks/type"
import type { TurmaProps } from "@/hooks/LeituraDataHooks/leituraJson"
export type Option ='Ver Perfil' | 'Enviar Mensagem' | 'Adicionar aos Favoritos' | 'Denunciar';
export type AlunosTurmaProps = {
  turma: TurmaProps
  perfil: PerfilUsuario
  abrirChat: (contatoId: string) => void;
}

export type tableRowProps = {
  id: string
  nome: string
  foto?: string | null
  descricao?: string
}
