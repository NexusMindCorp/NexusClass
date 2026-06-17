import type { PerfilUsuario } from "@/hooks/AuthHooks/type"
import type { TurmaProps } from "@/hooks/leituraJson"
export type EventoCalendario = {
  id: string
  titulo: string
  descricao: string
  data: string
  horario: string
  tipo: "pessoal" | "turma"
  turma_id: string | null
  autor_id: string
}

export type EventoCalendarioBanco = {
  id: string
  titulo: string
  descricao: string
  data: string
  horario: string | null
  tipo: "pessoal" | "turma"
  turma_id: string | null
  autor_id: string
}

export type ErroSupabase = {
  code?: string
  message?: string
  details?: string
}

export type UseCalendarioProps = {
  perfil: PerfilUsuario;
  inscricoes: Record<string, boolean>;
  turmasGlobais: Record<string, TurmaProps>;
}
export type CalendarioProps = {
  perfil: PerfilUsuario;
  inscricoes: Record<string, boolean>;
  turmasGlobais: Record<string, TurmaProps>;
};