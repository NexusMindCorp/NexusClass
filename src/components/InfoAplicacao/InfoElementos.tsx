import type { LucideIcon } from "lucide-react";
import type { CardItem } from "./type";

export function SectionHeader({
  icone: Icone,
  titulo,
  descricao,
}: {
  icone: LucideIcon;
  titulo: string;
  descricao?: string;
}) {
  return (
    <div className="info-section-header">
      <div className="info-section-icon">
        <Icone className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">{titulo}</h2>
        {descricao && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {descricao}
          </p>
        )}
      </div>
    </div>
  );
}

export function InfoCard({ item }: { item: CardItem }) {
  const Icone = item.icone;

  return (
    <div className="info-mini-card">
      <div className="info-mini-icon">
        <Icone className="h-4 w-4" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{item.titulo}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {item.descricao}
        </p>
      </div>
    </div>
  );
}
