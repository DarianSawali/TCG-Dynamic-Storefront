import {
  buildConditionPrices,
  nmPrice,
  type CardCondition,
  type ConditionPrice,
} from "@/lib/conditions";
import {
  setDisplayName,
  type CardLocale,
  type StoreSet,
} from "@/lib/sets";

export type { CardCondition, ConditionPrice };
export { buildConditionPrices, nmPrice };

export type StockLabel =
  | "In Stock"
  | "Low Stock"
  | "Out of Stock";

export type PriceSource = "justtcg" | "mock";

export type CatalogCard = {
  slug: string;
  name: string;
  setCode: string;
  locale: CardLocale;
  setName: string;
  collectorNumber: string;
  rarity?: string;
  /** Tailwind gradient utility classes (e.g. `from-violet-500 to-fuchsia-700`) */
  gradient: string;
  /** Per-condition shelf prices (NM → DMG) */
  conditionPrices: ConditionPrice[];
  /** NM market price (convenience; mirrors conditionPrices.NM) */
  marketPriceCents: number | null;
  stockLabel: StockLabel;
  /** When true, card appears on `/shop` as well as `/cards` */
  shopListed: boolean;
  /**
   * JustTCG `cardId` for batch price lookup. See
   * https://justtcg.com/docs — IDs look like `pokemon-{set}-{name}-{rarity}`.
   */
  justtcgCardId?: string;
  /**
   * TCGdex `id` for artwork (`GET https://api.tcgdex.net/v2/{locale}/cards/{id}`).
   */
  tcgdexCardId?: string;
  /** Base TCGdex image URL saved at fetch time; skips a live TCGdex call when present. */
  tcgdexImageUrl?: string | null;
};

/** After `getCatalogCards()` merges JustTCG prices and TCGdex image URLs. */
export type CatalogCardWithPricing = CatalogCard & {
  priceSource: PriceSource;
  /** Full HTTPS URL (e.g. …/high.webp) or null to use gradient placeholder. */
  imageUrl: string | null;
};

export function formatPrice(
  cents: number | null,
  currency: string = "USD",
): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

type MockCardInput = Omit<CatalogCard, "conditionPrices" | "marketPriceCents" | "setName"> & {
  nmCents: number | null;
  storeSet: StoreSet;
};

function mockCard(input: MockCardInput): CatalogCard {
  const { nmCents, storeSet, ...card } = input;
  const conditionPrices = buildConditionPrices(nmCents);
  return {
    ...card,
    setName: setDisplayName(storeSet.code, storeSet.locale),
    conditionPrices,
    marketPriceCents: nmPrice(conditionPrices),
  };
}

/** In-scope catalog: 151, Phantasmal Flames, and Ascended Heroes (EN + JP). */
export const mockCards: CatalogCard[] = [
  mockCard({
    slug: "mew-ex-151-en",
    name: "Mew ex",
    setCode: "sv03.5",
    locale: "en",
    storeSet: { code: "sv03.5", locale: "en", name: "151", series: "151" },
    collectorNumber: "193",
    rarity: "Ultra Rare",
    gradient: "from-pink-500 to-violet-700",
    nmCents: 6299,
    stockLabel: "Low Stock",
    shopListed: true,
    tcgdexCardId: "sv03.5-193",
  }),
  mockCard({
    slug: "charizard-ex-151-en",
    name: "Charizard ex",
    setCode: "sv03.5",
    locale: "en",
    storeSet: { code: "sv03.5", locale: "en", name: "151", series: "151" },
    collectorNumber: "006",
    rarity: "Double Rare",
    gradient: "from-orange-600 to-red-900",
    nmCents: 4499,
    stockLabel: "In Stock",
    shopListed: true,
    tcgdexCardId: "sv03.5-006",
  }),
  mockCard({
    slug: "mew-ex-151-ja",
    name: "ミュウex",
    setCode: "SV2a",
    locale: "ja",
    storeSet: {
      code: "SV2a",
      locale: "ja",
      name: "151",
      nameJa: "ポケモンカード151",
      series: "151",
    },
    collectorNumber: "151",
    rarity: "Ultra Rare",
    gradient: "from-pink-500 to-violet-700",
    nmCents: 5899,
    stockLabel: "In Stock",
    shopListed: true,
    tcgdexCardId: "SV2a-151",
  }),
  mockCard({
    slug: "charizard-ex-151-ja",
    name: "リザードンex",
    setCode: "SV2a",
    locale: "ja",
    storeSet: {
      code: "SV2a",
      locale: "ja",
      name: "151",
      nameJa: "ポケモンカード151",
      series: "151",
    },
    collectorNumber: "006",
    rarity: "Double Rare",
    gradient: "from-orange-600 to-red-900",
    nmCents: 4199,
    stockLabel: "Low Stock",
    shopListed: false,
    tcgdexCardId: "SV2a-006",
  }),
  mockCard({
    slug: "mega-charizard-x-phantasmal-en",
    name: "Mega Charizard X ex",
    setCode: "me02",
    locale: "en",
    storeSet: {
      code: "me02",
      locale: "en",
      name: "Phantasmal Flames",
      series: "phantasmal-flames",
    },
    collectorNumber: "013",
    rarity: "Double Rare",
    gradient: "from-orange-700 to-red-950",
    nmCents: 8999,
    stockLabel: "Low Stock",
    shopListed: true,
    tcgdexCardId: "me02-013",
  }),
  mockCard({
    slug: "mega-gengar-phantasmal-en",
    name: "Mega Gengar ex",
    setCode: "me02",
    locale: "en",
    storeSet: {
      code: "me02",
      locale: "en",
      name: "Phantasmal Flames",
      series: "phantasmal-flames",
    },
    collectorNumber: "056",
    rarity: "Double Rare",
    gradient: "from-violet-800 to-indigo-950",
    nmCents: 5499,
    stockLabel: "In Stock",
    shopListed: true,
    tcgdexCardId: "me02-056",
  }),
  mockCard({
    slug: "mega-charizard-x-inferno-ja",
    name: "メガリザードンXex",
    setCode: "M2",
    locale: "ja",
    storeSet: {
      code: "M2",
      locale: "ja",
      name: "Phantasmal Flames",
      nameJa: "インフェルノX",
      series: "phantasmal-flames",
    },
    collectorNumber: "013",
    rarity: "Double Rare",
    gradient: "from-orange-700 to-red-950",
    nmCents: 8499,
    stockLabel: "In Stock",
    shopListed: true,
    tcgdexCardId: "M2-013",
  }),
  mockCard({
    slug: "mega-heracross-inferno-ja",
    name: "メガヘラクロスex",
    setCode: "M2",
    locale: "ja",
    storeSet: {
      code: "M2",
      locale: "ja",
      name: "Phantasmal Flames",
      nameJa: "インフェルノX",
      series: "phantasmal-flames",
    },
    collectorNumber: "004",
    rarity: "Double Rare",
    gradient: "from-lime-600 to-emerald-900",
    nmCents: 2199,
    stockLabel: "In Stock",
    shopListed: false,
    tcgdexCardId: "M2-004",
  }),
  mockCard({
    slug: "mega-gengar-ascended-en",
    name: "Mega Gengar ex",
    setCode: "me02.5",
    locale: "en",
    storeSet: {
      code: "me02.5",
      locale: "en",
      name: "Ascended Heroes",
      series: "ascended-heroes",
    },
    collectorNumber: "125",
    rarity: "Ultra Rare",
    gradient: "from-purple-700 to-fuchsia-950",
    nmCents: 12999,
    stockLabel: "Low Stock",
    shopListed: true,
    tcgdexCardId: "me02.5-125",
  }),
  mockCard({
    slug: "mega-gardevoir-ascended-en",
    name: "Mega Gardevoir ex",
    setCode: "me02.5",
    locale: "en",
    storeSet: {
      code: "me02.5",
      locale: "en",
      name: "Ascended Heroes",
      series: "ascended-heroes",
    },
    collectorNumber: "089",
    rarity: "Double Rare",
    gradient: "from-emerald-500 to-teal-800",
    nmCents: 3799,
    stockLabel: "In Stock",
    shopListed: true,
    tcgdexCardId: "me02.5-089",
  }),
  mockCard({
    slug: "gengar-munikis-ja",
    name: "ゲンガー",
    setCode: "M3",
    locale: "ja",
    storeSet: {
      code: "M3",
      locale: "ja",
      name: "Ascended Heroes",
      nameJa: "ムニキスゼロ",
      series: "ascended-heroes",
    },
    collectorNumber: "049",
    rarity: "Rare",
    gradient: "from-violet-700 to-purple-950",
    nmCents: 1299,
    stockLabel: "In Stock",
    shopListed: false,
    tcgdexCardId: "M3-049",
  }),
  mockCard({
    slug: "mega-starmie-munikis-ja",
    name: "メガスターミーex",
    setCode: "M3",
    locale: "ja",
    storeSet: {
      code: "M3",
      locale: "ja",
      name: "Ascended Heroes",
      nameJa: "ムニキスゼロ",
      series: "ascended-heroes",
    },
    collectorNumber: "021",
    rarity: "Double Rare",
    gradient: "from-cyan-500 to-blue-900",
    nmCents: 2899,
    stockLabel: "In Stock",
    shopListed: true,
    tcgdexCardId: "M3-021",
  }),
];
