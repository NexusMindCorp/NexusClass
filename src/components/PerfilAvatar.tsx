import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getCorMateria, getCorNomeUsuario } from "@/lib/utils";
import { obterUrlHttpSegura } from "@/patterns/strategy/SanitizacaoStrategy";
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
  const fotoSegura = obterUrlHttpSegura(foto, {
    permitirCaminhoRelativo: true,
  });
  const tipoPalavra =
    tipo === "usuario"
      ? getCorNomeUsuario(nome)
      : getCorMateria(nome);
  const classNameAvatarFinal = classNameAvatar
    ? { className: classNameAvatar }
    : {};
  return (
    <Avatar {...classNameAvatarFinal}>
      {fotoSegura && (
        <AvatarImage
          src={fotoSegura}
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
