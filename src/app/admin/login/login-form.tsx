"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50" />
      </div>
      {state.error ? <p role="alert" className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
