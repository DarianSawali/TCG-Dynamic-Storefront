"use client";

import { useActionState } from "react";
import {
  createTestCart,
  type CartTestState,
} from "@/app/(store)/shopify-test/actions";
import type { ShopifyProductVariant } from "@/lib/shopify/products";

const initialState: CartTestState = { status: "idle" };

function formatMoney(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount));
}

export function ShopifyCartTest({
  variants,
}: {
  variants: ShopifyProductVariant[];
}) {
  const [state, action, pending] = useActionState(createTestCart, initialState);
  const availableVariants = variants.filter((variant) => variant.availableForSale);

  return (
    <section className="space-y-4 rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
      <div>
        <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
          Isolated Shopify cart test
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Choose an in-stock variant. Shopify will create a new one-item test cart.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {availableVariants.map((variant) => (
          <form key={variant.id} action={action}>
            <input type="hidden" name="merchandiseId" value={variant.id} />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "Creating cart…" : `Add ${variant.title}`}
            </button>
          </form>
        ))}
      </div>

      {state.status === "error" ? (
        <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <div className="space-y-3 border-t border-violet-200 pt-4 dark:border-violet-900">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Shopify created a cart with {state.cart.totalQuantity} item: {" "}
            <strong>{state.cart.line.productTitle}</strong> — {state.cart.line.variantTitle}.
          </p>
          <p className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Subtotal: {formatMoney(state.cart.subtotal.amount, state.cart.subtotal.currencyCode)}
          </p>
          <a
            href={state.cart.checkoutUrl}
            className="inline-flex rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Continue to Shopify checkout
          </a>
        </div>
      ) : null}
    </section>
  );
}
