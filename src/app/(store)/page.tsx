import Link from "next/link";
import { STORE_SERIES, getVisibleStoreSets, localeBadge, showLocaleBadge } from "@/lib/sets";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
          Pokémon TCG · focused inventory
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
          151, Phantasmal Flames, and Ascended Heroes.
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          This storefront lists cards from those three English expansions
          (Japanese inventory is prepared but hidden for now).
          Browse by set, compare NM through DMG prices, and add shop listings to your cart.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/cards"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Explore catalog
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Shop
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Sets in scope
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {getVisibleStoreSets().map((set) => (
            <li
              key={`${set.code}-${set.locale}`}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-zinc-950 dark:text-zinc-50">{set.name}</p>
                {showLocaleBadge(set.locale) ? (
                  <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {localeBadge(set.locale)}
                  </span>
                ) : null}
              </div>
              {set.nameJa ? (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{set.nameJa}</p>
              ) : null}
              <Link
                href={
                  showLocaleBadge(set.locale)
                    ? `/cards?set=${encodeURIComponent(set.code)}&locale=${set.locale}`
                    : `/cards?set=${encodeURIComponent(set.code)}`
                }
                className="mt-3 inline-flex text-sm font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
              >
                Browse cards →
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Product lines: {STORE_SERIES.map((s) => s.label).join(" · ")}. See{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-900">docs/STORE_SCOPE.md</code>.
        </p>
      </section>
    </div>
  );
}
