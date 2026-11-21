import { cn, getCorMateria } from "@/lib/utils";
import { obterUrlHttpSegura } from "@/patterns/strategy/SanitizacaoStrategy";

type TurmaBannerProps = {
  chaveTurma: string;
  url?: string | null;
  alt: string;
  classNameImagem?: string;
};

export function TurmaBanner({ chaveTurma, url, alt, classNameImagem }: TurmaBannerProps) {
  const urlSegura = obterUrlHttpSegura(url, { permitirCaminhoRelativo: true });

  return (
    <>
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0 overflow-hidden", getCorMateria(chaveTurma))}
      >
        <div className="absolute -right-10 -top-24 size-80 rounded-full border-[28px] border-current opacity-25" />
        <div className="absolute -bottom-24 right-1/4 size-60 rotate-45 rounded-[3rem] bg-current opacity-15" />
      </div>
      {urlSegura && (
        <img
          key={urlSegura}
          src={urlSegura}
          alt={alt}
          className={cn("absolute inset-0 h-full w-full object-cover", classNameImagem)}
          onError={(event) => { event.currentTarget.hidden = true; }}
        />
      )}
    </>
  );
}
