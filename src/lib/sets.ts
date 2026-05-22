/** Flip to `true` when ready to surface Japanese expansions in the storefront. */
export const SHOW_JAPANESE_LOCALE = false;

/** Storefront catalog: 151, Phantasmal Flames, Ascended Heroes (EN + JP in data). */
export type CardLocale = "en" | "ja";

export type StoreSet = {
  /** TCGdex set id (used in API URLs and DB `setCode`) */
  code: string;
  locale: CardLocale;
  /** English marketing name shown in UI */
  name: string;
  /** Japanese product name when locale is `ja` */
  nameJa?: string;
  series: "151" | "phantasmal-flames" | "ascended-heroes";
};

export const STORE_SETS: readonly StoreSet[] = [
  {
    code: "sv03.5",
    locale: "en",
    name: "151",
    series: "151",
  },
  {
    code: "SV2a",
    locale: "ja",
    name: "151",
    nameJa: "ポケモンカード151",
    series: "151",
  },
  {
    code: "me02",
    locale: "en",
    name: "Phantasmal Flames",
    series: "phantasmal-flames",
  },
  {
    code: "M2",
    locale: "ja",
    name: "Phantasmal Flames",
    nameJa: "インフェルノX",
    series: "phantasmal-flames",
  },
  {
    code: "me02.5",
    locale: "en",
    name: "Ascended Heroes",
    series: "ascended-heroes",
  },
  {
    code: "M3",
    locale: "ja",
    name: "Ascended Heroes",
    nameJa: "ムニキスゼロ",
    series: "ascended-heroes",
  },
] as const;

export const STORE_SET_CODES = STORE_SETS.map((s) => s.code);

export function isLocaleVisible(locale: CardLocale): boolean {
  return SHOW_JAPANESE_LOCALE || locale === "en";
}

/** Sets shown in filters, homepage, and catalog queries. */
export function getVisibleStoreSets(): readonly StoreSet[] {
  return SHOW_JAPANESE_LOCALE
    ? STORE_SETS
    : STORE_SETS.filter((s) => s.locale === "en");
}

export function getVisibleStoreSetCodes(): string[] {
  return getVisibleStoreSets().map((s) => s.code);
}

export function filterVisibleCards<T extends { locale: CardLocale }>(cards: T[]): T[] {
  return cards.filter((c) => isLocaleVisible(c.locale));
}

/** EN/JP pill on cards — only when both locales are enabled. */
export function showLocaleBadge(_locale: CardLocale): boolean {
  return SHOW_JAPANESE_LOCALE;
}

export type StoreSeries = StoreSet["series"];

export const STORE_SERIES: readonly {
  id: StoreSeries;
  label: string;
}[] = [
  { id: "151", label: "151" },
  { id: "phantasmal-flames", label: "Phantasmal Flames" },
  { id: "ascended-heroes", label: "Ascended Heroes" },
];

export function findStoreSet(code: string, locale: CardLocale): StoreSet | undefined {
  return STORE_SETS.find((s) => s.code === code && s.locale === locale);
}

export function formatSetLabel(set: StoreSet): string {
  if (set.locale === "ja" && set.nameJa) {
    return `${set.name} (${set.nameJa})`;
  }
  return set.name;
}

export function setDisplayName(setCode: string, locale: CardLocale): string {
  const set = findStoreSet(setCode, locale);
  if (!set) return setCode;
  return formatSetLabel(set);
}

export function isStoreSetCode(setCode: string): boolean {
  return STORE_SET_CODES.includes(setCode);
}

export function localeBadge(locale: CardLocale): string {
  return locale === "ja" ? "JP" : "EN";
}
