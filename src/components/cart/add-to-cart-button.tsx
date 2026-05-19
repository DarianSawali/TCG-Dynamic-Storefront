"use client";

import { useState } from "react";
import type { CatalogCardWithPricing } from "@/lib/catalog";
import { useCart } from "@/components/cart/cart-provider";

type AddToCartButtonProps = {
  card: CatalogCardWithPricing;
  className?: string;
};

export function AddToCartButton({ card, className }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const disabled = card.stockLabel === "Out of Stock";

  return (
    <button
      type="button"
      disabled={disabled}
      className={
        className ??
        "inline-flex w-full items-center justify-center rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
      }
      title={disabled ? "This card is currently out of stock" : undefined}
      onClick={() => {
        addItem({
          slug: card.slug,
          name: card.name,
          setName: card.setName,
          marketPriceCents: card.marketPriceCents,
          imageUrl: card.imageUrl,
          gradient: card.gradient,
        });
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 1200);
      }}
    >
      {disabled ? "Out of stock" : justAdded ? "Added" : "Add to cart"}
    </button>
  );
}
