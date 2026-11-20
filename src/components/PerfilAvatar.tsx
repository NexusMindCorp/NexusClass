import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getCorMateria, getCorNomeUsuario } from "@/lib/utils";
type PerfilAvatarProps = {
  classNameAvatar?: string;
  classNameDiv?: string;
  foto?: string | undefined | null;
  tipo?: "materia" | "usuario";
  palavra?: string;
};
export function PerfilAvatar({
  classNameAvatar,
  classNameDiv,
  foto,
  tipo = "usuario",
  palavra,
}: PerfilAvatarProps) {
  const nome = palavra?.trim() || "U";
  const tipoPalavra =
    tipo === "usuario"
      ? getCorNomeUsuario(nome)
      : getCorMateria(nome);
  const classNameAvatarFinal = classNameAvatar
    ? { className: classNameAvatar }
    : {};
  return (
    <Avatar {...classNameAvatarFinal}>
      {foto?.trim() && (
        <AvatarImage
          src={foto}
          alt="Foto do Usuário"
          className="object-cover"
        />
      )}
      <AvatarFallback className={`${classNameDiv ?? ""} ${tipoPalavra}`.trim()}>
        {nome.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
