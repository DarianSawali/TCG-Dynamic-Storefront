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
    <div className="max-w-md space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div>
        <label
          htmlFor="card-condition"
          className="text-sm font-medium text-zinc-950 dark:text-zinc-50"
        >
          Condition
        </label>
        <select
          id="card-condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value as CardCondition)}
          className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
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
          <p className="text-2xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
            {formatPrice(selectedPrice)}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
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
