import type { CatalogCardWithPricing } from "@/lib/catalog";
import { CardTile } from "@/components/card-tile";

type CardGridProps = {
  cards: CatalogCardWithPricing[];
  variant: "catalog" | "shop";
};

export function CardGrid({ cards, variant }: CardGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((card) => (
        <li key={card.slug}>
          <CardTile card={card} variant={variant} />
        </li>
      ))}
    </ul>
  );
}
