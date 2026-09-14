"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  approveMarketPricesAction,
  type ApprovePricesState,
} from "@/app/admin/(protected)/pricing/actions";

const initialState: ApprovePricesState = { status: "idle" };

export function ApprovePricesForm({
  handle,
  count,
}: {
  handle: string;
  count: number;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    approveMarketPricesAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);

  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Update ${count} Shopify condition prices to the latest JustTCG values?`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="handle" value={handle} />
      <button
        type="submit"
        disabled={pending || count === 0}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Refreshing and updating…" : `Approve ${count} market prices`}
      </button>
      {state.status !== "idle" ? (
        <p
          role="status"
          className={`text-xs ${
            state.status === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
