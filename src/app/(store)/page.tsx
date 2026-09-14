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
          {getVisibleStoreSets().map((set) => {
            const href = showLocaleBadge(set.locale)
              ? `/cards?set=${encodeURIComponent(set.code)}&locale=${set.locale}`
              : `/cards?set=${encodeURIComponent(set.code)}`;

            return (
              <li key={`${set.code}-${set.locale}`}>
                <Link
                  href={href}
                  className="set-scope-card group relative flex min-h-32 flex-col overflow-hidden rounded-xl border border-[#625253] bg-[#1d1d1f] p-4 shadow-sm transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:border-pokedex-bright hover:shadow-[0_18px_36px_-22px_rgba(223,90,72,0.9)] focus-visible:border-pokedex-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex motion-reduce:transform-none motion-reduce:transition-colors"
                >
                  <span className="relative z-10 flex items-start justify-between gap-2">
                    <span className="font-medium text-pokedex-cream transition-colors duration-300 group-hover:text-white group-focus-visible:text-white">
                      {set.name}
                    </span>
                    {showLocaleBadge(set.locale) ? (
                      <span className="shrink-0 rounded bg-[#29282a] px-2 py-0.5 font-mono text-xs font-bold text-pokedex-muted transition-colors duration-300 group-hover:bg-black/20 group-hover:text-white group-focus-visible:bg-black/20 group-focus-visible:text-white">
                        {localeBadge(set.locale)}
                      </span>
                    ) : null}
                  </span>
                  {set.nameJa ? (
                    <span className="relative z-10 mt-1 text-sm text-pokedex-muted transition-colors duration-300 group-hover:text-white/75 group-focus-visible:text-white/75">
                      {set.nameJa}
                    </span>
                  ) : null}
                  <span className="relative z-10 mt-auto inline-flex items-center pt-4 text-sm font-medium text-pokedex-bright transition-colors duration-300 group-hover:text-white group-focus-visible:text-white">
                    Browse cards
                    <span className="ml-1.5 transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transform-none">
                      →
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-pokedex-muted">
          Product lines: {STORE_SERIES.map((s) => s.label).join(" · ")}.
        </p>
      </section>
    </div>
  );
}
