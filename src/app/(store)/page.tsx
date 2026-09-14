import Link from "next/link";
import { HomeHeroCarousel } from "@/components/hero/home-hero-carousel";
import {
  STORE_SERIES,
  getVisibleStoreSets,
  localeBadge,
  showLocaleBadge,
} from "@/lib/sets";

export default function HomePage() {
  return (
    <div>
      {/* Full-bleed under the solid site header */}
      <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 -mt-8">
        <HomeHeroCarousel />
      </div>

      <section className="mt-10 space-y-4">
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
                <p className="font-medium text-zinc-950 dark:text-zinc-50">
                  {set.name}
                </p>
                {showLocaleBadge(set.locale) ? (
                  <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {localeBadge(set.locale)}
                  </span>
                ) : null}
              </div>
              {set.nameJa ? (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {set.nameJa}
                </p>
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
          Product lines: {STORE_SERIES.map((s) => s.label).join(" · ")}.
        </p>
      </section>
    </div>
  );
}
