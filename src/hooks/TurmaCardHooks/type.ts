import type { PerfilUsuario } from '@/hooks/AuthHooks/type';
export type TurmasProps = {
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