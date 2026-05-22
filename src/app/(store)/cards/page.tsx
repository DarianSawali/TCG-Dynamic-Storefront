import { CardGrid } from "@/components/card-grid";
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

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Explore the catalog
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          In scope for this shop: <strong>151</strong>,{" "}
          <strong>Phantasmal Flames</strong>, and <strong>Ascended Heroes</strong> (English).
          Art from TCGdex; optional JustTCG key for live NM–DMG prices.
        </p>
        <SetFilter activeSetCode={setCode} activeLocale={locale} />
        {activeSet ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Showing {cards.length} card{cards.length === 1 ? "" : "s"} from{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {activeSet.name}
              {activeSet.nameJa ? ` (${activeSet.nameJa})` : ""}
            </span>
            .
          </p>
        ) : null}
      </div>
      <CardGrid cards={cards} variant="catalog" />
    </div>
  );
}
