"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  addToShopifyCart,
  type AddToCartState,
} from "@/app/(store)/shopify-actions";
import type { ShopifyProductVariant } from "@/lib/shopify/products";

const initialState: AddToCartState = { status: "idle" };

function formatPrice(variant: ShopifyProductVariant): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: variant.price.currencyCode,
  }).format(Number(variant.price.amount));
}

export function ShopifyBuyPanel({ variants }: { variants: ShopifyProductVariant[] }) {
  const firstAvailable = variants.find((variant) => variant.availableForSale);
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? variants[0]?.id ?? "");
  const [state, action, pending] = useActionState(addToShopifyCart, initialState);
  const selected = variants.find((variant) => variant.id === variantId);

  return (
    <div className="space-y-4 rounded-xl border border-[#625253] bg-[#1d1d1f] p-4">
      <div>
        <label htmlFor="shopify-condition" className="text-sm font-medium text-pokedex-cream">
          Condition
        </label>
        <select
          id="shopify-condition"
          value={variantId}
          onChange={(event) => setVariantId(event.target.value)}
          className="mt-1.5 w-full rounded-lg border border-[#625253] bg-[#29282a] px-3 py-2 text-sm text-pokedex-cream focus:border-pokedex focus:outline-none"
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id} disabled={!variant.availableForSale}>
              {variant.title} — {formatPrice(variant)}{variant.availableForSale ? "" : " — Out of stock"}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-500">Shopify price</p>
          <p className="text-2xl font-semibold text-pokedex-cream">
            {selected ? formatPrice(selected) : "Unavailable"}
          </p>
          {selected?.sku ? <p className="font-mono text-xs text-zinc-500">{selected.sku}</p> : null}
        </div>
        <form action={action}>
          <input type="hidden" name="merchandiseId" value={variantId} />
          <button
            type="submit"
            disabled={pending || !selected?.availableForSale}
            className="rounded-lg bg-pokedex px-4 py-2.5 text-sm font-medium text-white hover:bg-pokedex-bright disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {pending ? "Adding…" : selected?.availableForSale ? "Add to Shopify cart" : "Out of stock"}
          </button>
        </form>
      </div>

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-[#625253] pt-3">
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            Added. Cart now has {state.cart.totalQuantity} item{state.cart.totalQuantity === 1 ? "" : "s"}.
          </p>
          <Link href="/shopify-cart" className="text-sm font-medium text-pokedex hover:text-pokedex-bright hover:underline">
            View cart
          </Link>
        </div>
      ) : null}
    </div>
  );
}
