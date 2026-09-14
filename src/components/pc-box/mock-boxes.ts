export type PcBoxCard = {
  id: string;
  name: string;
  set: string;
  rarity: string;
  price: string;
  /** Optional image URL later; null shows placeholder */
  imageUrl: string | null;
};

export type PcBox = {
  id: string;
  index: number;
  /** Matches store scope set names */
  title: "151" | "PHANTASMAL FLAMES" | "ASCENDED HEROES";
  /** Fixed 24 slots (6×4). null = empty cell. */
  slots: (PcBoxCard | null)[];
};

function card(
  partial: Omit<PcBoxCard, "imageUrl"> & { imageUrl?: string | null },
): PcBoxCard {
  return { imageUrl: null, ...partial };
}

function padSlots(filled: PcBoxCard[]): (PcBoxCard | null)[] {
  return [...filled, ...Array.from({ length: Math.max(0, 24 - filled.length) }, () => null)];
}

/**
 * Layout/prototype data only — one box per storefront set.
 * Scope: 151, Phantasmal Flames, Ascended Heroes (EN).
 */
export const MOCK_PC_BOXES: PcBox[] = [
  {
    id: "box-151",
    index: 1,
    title: "151",
    slots: padSlots([
      card({
        id: "mew-ex",
        name: "Mew ex",
        set: "151",
        rarity: "SAR",
        price: "$89.00",
      }),
      card({
        id: "charizard-ex",
        name: "Charizard ex",
        set: "151",
        rarity: "SIR",
        price: "$210.00",
      }),
      card({
        id: "pikachu",
        name: "Pikachu",
        set: "151",
        rarity: "IR",
        price: "$42.00",
      }),
      card({
        id: "alakazam-ex",
        name: "Alakazam ex",
        set: "151",
        rarity: "SAR",
        price: "$36.00",
      }),
      card({
        id: "venusaur-ex",
        name: "Venusaur ex",
        set: "151",
        rarity: "SAR",
        price: "$54.00",
      }),
      card({
        id: "blastoise-ex",
        name: "Blastoise ex",
        set: "151",
        rarity: "SAR",
        price: "$48.00",
      }),
    ]),
  },
  {
    id: "box-phantasmal",
    index: 2,
    title: "PHANTASMAL FLAMES",
    slots: padSlots([
      card({
        id: "pf-featured-1",
        name: "Featured Card A",
        set: "Phantasmal Flames",
        rarity: "SAR",
        price: "$64.00",
      }),
      card({
        id: "pf-featured-2",
        name: "Featured Card B",
        set: "Phantasmal Flames",
        rarity: "UR",
        price: "$48.00",
      }),
      card({
        id: "pf-featured-3",
        name: "Featured Card C",
        set: "Phantasmal Flames",
        rarity: "IR",
        price: "$22.00",
      }),
      card({
        id: "pf-featured-4",
        name: "Featured Card D",
        set: "Phantasmal Flames",
        rarity: "RR",
        price: "$8.00",
      }),
    ]),
  },
  {
    id: "box-ascended",
    index: 3,
    title: "ASCENDED HEROES",
    slots: padSlots([
      card({
        id: "ah-featured-1",
        name: "Featured Card A",
        set: "Ascended Heroes",
        rarity: "SAR",
        price: "$72.00",
      }),
      card({
        id: "ah-featured-2",
        name: "Featured Card B",
        set: "Ascended Heroes",
        rarity: "SIR",
        price: "$95.00",
      }),
      card({
        id: "ah-featured-3",
        name: "Featured Card C",
        set: "Ascended Heroes",
        rarity: "IR",
        price: "$28.00",
      }),
    ]),
  },
];

export function firstFilledSlotIndex(box: PcBox): number {
  const index = box.slots.findIndex((slot) => slot !== null);
  return index >= 0 ? index : 0;
}
