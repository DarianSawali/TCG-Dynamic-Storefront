"use client";

import { useActionState } from "react";
import {
  clearCartAction,
  removeCartLineAction,
  updateCartLineAction,
  type CartActionState,
} from "@/app/(store)/shopify-cart/actions";

const initialState: CartActionState = { status: "idle" };

export function CartLineControls({
  lineId,
  quantity,
}: {
  lineId: string;
  quantity: number;
}) {
  const [updateState, updateAction, updating] = useActionState(
    updateCartLineAction,
    initialState,
  );
  const [removeState, removeAction, removing] = useActionState(
    removeCartLineAction,
    initialState,
  );
  const pending = updating || removing;
  const state = removeState.status !== "idle" ? removeState : updateState;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <form action={updateAction}>
          <input type="hidden" name="lineId" value={lineId} />
          <input type="hidden" name="quantity" value={quantity - 1} />
          <button
            type="submit"
            disabled={pending || quantity <= 1}
            aria-label="Decrease quantity"
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700"
          >
            −
          </button>
        </form>
        <span className="min-w-6 text-center text-sm font-medium">{quantity}</span>
        <form action={updateAction}>
          <input type="hidden" name="lineId" value={lineId} />
          <input type="hidden" name="quantity" value={quantity + 1} />
          <button
            type="submit"
            disabled={pending || quantity >= 99}
            aria-label="Increase quantity"
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700"
          >
            +
          </button>
        </form>
        <form action={removeAction}>
          <input type="hidden" name="lineId" value={lineId} />
          <button
            type="submit"
            disabled={pending}
            className="ml-1 text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50 dark:text-red-400"
          >
            {removing ? "Removing…" : "Remove"}
          </button>
        </form>
      </div>
      {state.status !== "idle" ? (
        <p
          role="status"
          className={state.status === "error" ? "text-xs text-red-600" : "text-xs text-zinc-500"}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

export function ClearCartButton() {
  const [state, action, pending] = useActionState(clearCartAction, initialState);
  return (
    <div className="space-y-1">
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50 dark:text-red-400"
        >
          {pending ? "Clearing…" : "Clear cart"}
        </button>
      </form>
      {state.status === "error" ? (
        <p role="alert" className="text-xs text-red-600">{state.message}</p>
      ) : null}
    </div>
  );
}
