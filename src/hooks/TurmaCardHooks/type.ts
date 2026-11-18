import type { PerfilUsuario } from '@/hooks/AuthHooks/type';
export type TurmasProps = {
  id_escola?: string;
  materia: string;
  professor: string;
  banners: string;
  fotoProfessor: string;
  sala: string;
  turma: string;
  inscrito?: boolean;
  compacto?: boolean;
  modoPesquisa?: boolean;
  perfil: PerfilUsuario;
  clickInscrito?: () => void;
  clickMural?: () => void;
}