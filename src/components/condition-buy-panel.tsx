"use client";

import { useMemo, useState } from "react";
import type { CatalogCardWithPricing } from "@/lib/catalog";
import type { CardCondition } from "@/lib/conditions";
import { priceForCondition } from "@/lib/conditions";
import { formatPrice } from "@/lib/catalog";
import { useCart } from "@/components/cart/cart-provider";

type ConditionBuyPanelProps = {
  card: CatalogCardWithPricing;
};

export function ConditionBuyPanel({ card }: ConditionBuyPanelProps) {
  const { addItem } = useCart();
  const [condition, setCondition] = useState<CardCondition>("NM");
  const [justAdded, setJustAdded] = useState(false);

  const selectedPrice = useMemo(
    () => priceForCondition(card.conditionPrices, condition),
    [card.conditionPrices, condition],
  );

  const disabled = card.stockLabel === "Out of Stock";

  return (
    <div className="max-w-md space-y-4 rounded-xl border border-[#625253] bg-[#1d1d1f] p-4">
      <div>
        <label
          htmlFor="card-condition"
          className="text-sm font-medium text-pokedex-cream"
        >
          Condition
        </label>
        <select
          id="card-condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value as CardCondition)}
          className="mt-1.5 w-full rounded-lg border border-[#625253] bg-[#29282a] px-3 py-2 text-sm text-pokedex-cream focus:border-pokedex focus:outline-none"
        >
          {card.conditionPrices.map((row) => (
            <option key={row.condition} value={row.condition}>
              {row.shortLabel} — {row.label} ({formatPrice(row.priceCents)})
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          {card.conditionPrices.find((r) => r.condition === condition)?.description}
        </p>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Your price</p>
          <p className="text-2xl font-semibold tabular-nums text-pokedex-cream">
            {formatPrice(selectedPrice)}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-pokedex px-4 py-2.5 text-sm font-medium text-white transition hover:bg-pokedex-bright disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
          onClick={() => {
            addItem({
              slug: card.slug,
              name: card.name,
              setName: card.setName,
              condition,
              conditionLabel:
                card.conditionPrices.find((r) => r.condition === condition)?.label ??
                condition,
              marketPriceCents: selectedPrice,
              imageUrl: card.imageUrl,
              gradient: card.gradient,
            });
            setJustAdded(true);
            window.setTimeout(() => setJustAdded(false), 1200);
          }}
        >
          {disabled ? "Out of stock" : justAdded ? "Added" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
