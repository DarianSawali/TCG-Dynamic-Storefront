/** Standard TCG shelf conditions (best → worst). */
export type CardCondition = "NM" | "LP" | "MP" | "HP" | "DMG";

export const CARD_CONDITIONS: readonly CardCondition[] = [
  "NM",
  "LP",
  "MP",
  "HP",
  "DMG",
] as const;

export type ConditionMeta = {
  code: CardCondition;
  label: string;
  shortLabel: string;
  description: string;
  /** JustTCG API condition string */
  justTcgName: string;
  /** Mock / fallback price factor when only NM is stored */
  mockMultiplier: number;
};

export const CONDITION_META: Record<CardCondition, ConditionMeta> = {
  NM: {
    code: "NM",
    label: "Near Mint",
    shortLabel: "NM",
    description: "Minimal wear; corners and surface look clean.",
    justTcgName: "Near Mint",
    mockMultiplier: 1,
  },
  LP: {
    code: "LP",
    label: "Lightly Played",
    shortLabel: "LP",
    description: "Light edge or surface wear visible on close inspection.",
    justTcgName: "Lightly Played",
    mockMultiplier: 0.85,
  },
  MP: {
    code: "MP",
    label: "Moderately Played",
    shortLabel: "MP",
    description: "Noticeable wear; still tournament-legal for casual play.",
    justTcgName: "Moderately Played",
    mockMultiplier: 0.7,
  },
  HP: {
    code: "HP",
    label: "Heavily Played",
    shortLabel: "HP",
    description: "Heavy wear, creases, or whitening; priced for players.",
    justTcgName: "Heavily Played",
    mockMultiplier: 0.55,
  },
  DMG: {
    code: "DMG",
    label: "Damaged",
    shortLabel: "DMG",
    description: "Major flaws (tears, bends, ink loss). Sold as-is.",
    justTcgName: "Damaged",
    mockMultiplier: 0.4,
  },
};

export type ConditionPrice = {
  condition: CardCondition;
  label: string;
  shortLabel: string;
  description: string;
  priceCents: number | null;
};

export function buildConditionPrices(
  baseNmCents: number | null,
  overrides?: Partial<Record<CardCondition, number | null>>,
): ConditionPrice[] {
  return CARD_CONDITIONS.map((code) => {
    const meta = CONDITION_META[code];
    const override = overrides?.[code];
    let priceCents: number | null;
    if (override !== undefined) {
      priceCents = override;
    } else if (baseNmCents == null) {
      priceCents = null;
    } else {
      priceCents = Math.round(baseNmCents * meta.mockMultiplier);
    }
    return {
      condition: code,
      label: meta.label,
      shortLabel: meta.shortLabel,
      description: meta.description,
      priceCents,
    };
  });
}

export function priceForCondition(
  prices: ConditionPrice[],
  condition: CardCondition,
): number | null {
  return prices.find((p) => p.condition === condition)?.priceCents ?? null;
}

export function nmPrice(prices: ConditionPrice[]): number | null {
  return priceForCondition(prices, "NM");
}
