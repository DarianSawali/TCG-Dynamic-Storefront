import { ExplorePcBox } from "@/components/pc-box/explore-pc-box";
import { SetFilter } from "@/components/set-filter";
import { getCatalogCards } from "@/data/catalog";
import { getVisibleStoreSets, isLocaleVisible } from "@/lib/sets";
import type { CardLocale } from "@/lib/sets";

export const metadata = {
  title: "Explore",
};

/** Refresh JustTCG-backed prices periodically (free tier: keep moderate). */
export const revalidate = 600;

type Props = {
  searchParams: Promise<{ set?: string; locale?: string }>;
};

export default async function CardsPage({ searchParams }: Props) {
  const params = await searchParams;
  const setCode = params.set;
  const localeParam =
    params.locale === "ja" || params.locale === "en" ? params.locale : undefined;
  const locale =
    localeParam && isLocaleVisible(localeParam as CardLocale)
      ? (localeParam as CardLocale)
      : undefined;

  const cards = await getCatalogCards(
    setCode || locale ? { setCode, locale } : undefined,
  );

  const activeSet = setCode
    ? getVisibleStoreSets().find(
        (s) => s.code === setCode && (locale == null || s.locale === locale),
      )
    : undefined;

  const boxTitle = activeSet
    ? activeSet.name.toUpperCase()
    : "ALL SETS";

  return (
    <div className="-mx-4 space-y-6 bg-[#101011] px-4 py-8 sm:-mx-6 sm:px-6 sm:py-10">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="font-mono text-[11px] tracking-[0.2em] text-pokedex-bright/90 uppercase">
            Catalog · PC storage
          </p>
          <h1 className="font-mono text-xl tracking-wide text-zinc-100 sm:text-2xl">
            Explore the catalog
          </h1>
          <p className="max-w-2xl font-mono text-xs leading-relaxed text-zinc-500 sm:text-sm">
            In scope: <span className="text-zinc-300">151</span>,{" "}
            <span className="text-zinc-300">Phantasmal Flames</span>, and{" "}
            <span className="text-zinc-300">Ascended Heroes</span> (English).
            Pick a set tab, browse slots by collector number, and use ◀ ▶ to see
            more boxes.
          </p>
        </div>

        <SetFilter activeSetCode={setCode} activeLocale={locale} />

        {activeSet ? (
          <p className="font-mono text-xs text-zinc-500">
            Showing {cards.length} card{cards.length === 1 ? "" : "s"} from{" "}
            <span className="text-zinc-300">
              {activeSet.name}
              {activeSet.nameJa ? ` (${activeSet.nameJa})` : ""}
            </span>
            , ordered by #.
          </p>
        ) : (
          <p className="font-mono text-xs text-zinc-500">
            Showing {cards.length} card{cards.length === 1 ? "" : "s"} across all
            sets, ordered by # within the current filter.
          </p>
        )}
      </div>

      <ExplorePcBox
        key={`${setCode ?? "all"}:${locale ?? "all"}`}
        cards={cards}
        boxTitle={boxTitle}
      />
    </div>
  );
}
