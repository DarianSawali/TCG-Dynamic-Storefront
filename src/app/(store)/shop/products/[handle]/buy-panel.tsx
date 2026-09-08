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
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div>
        <label htmlFor="shopify-condition" className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
          Condition
        </label>
        <select
          id="shopify-condition"
          value={variantId}
          onChange={(event) => setVariantId(event.target.value)}
          className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
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
          <p className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {selected ? formatPrice(selected) : "Unavailable"}
          </p>
          {selected?.sku ? <p className="font-mono text-xs text-zinc-500">{selected.sku}</p> : null}
        </div>
        <form action={action}>
          <input type="hidden" name="merchandiseId" value={variantId} />
          <button
            type="submit"
            disabled={pending || !selected?.availableForSale}
            className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {pending ? "Adding…" : selected?.availableForSale ? "Add to Shopify cart" : "Out of stock"}
          </button>
        </form>
      </div>

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            Added. Cart now has {state.cart.totalQuantity} item{state.cart.totalQuantity === 1 ? "" : "s"}.
          </p>
          <Link href="/shopify-cart" className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">
            View cart
          </Link>
        </div>
      ) : null}
    </div>
  );
}
