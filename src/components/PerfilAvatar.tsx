import { Avatar, AvatarImage } from "./ui/avatar";
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
  const tipoPalavra =
    tipo === "usuario"
      ? getCorNomeUsuario(palavra || "U")
      : getCorMateria(palavra || "U");
  const classNameAvatarFinal = classNameAvatar
    ? { className: classNameAvatar }
    : {};
  return (
    <Avatar {...classNameAvatarFinal}>
      {!foto || foto === "" ? (
        <div className={`${classNameDiv} ${tipoPalavra}`.trim()}>
          {(palavra || "U").charAt(0).toUpperCase()}
        </div>
      ) : (
        <AvatarImage
          src={foto}
          alt="Foto do Usuário"
          className="object-cover"
        />
      )}
    </Avatar>
  );
}
