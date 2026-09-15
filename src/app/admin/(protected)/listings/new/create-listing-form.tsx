"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createListingDraftAction,
  type CreateListingState,
} from "@/app/admin/(protected)/listings/new/actions";

const initialState: CreateListingState = { status: "idle" };

export function CreateListingForm({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createListingDraftAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.push(`/admin/listings?created=${encodeURIComponent(state.handle)}`);
    }
  }, [router, state]);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-zinc-300 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Create ${title} as an unpublished Shopify draft with zero inventory?`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <label className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          name="confirm"
          value="yes"
          required
          className="mt-0.5 size-4 accent-zinc-950 dark:accent-zinc-100"
        />
        <span>
          I reviewed the title, SKUs, prices, and safety defaults. Create one
          Shopify draft without publishing it or adding inventory.
        </span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
      >
        {pending ? "Rechecking and creating…" : "Create unpublished Shopify draft"}
      </button>
      {state.status === "error" ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
