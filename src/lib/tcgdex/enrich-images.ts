import "server-only";

import type { CatalogCardWithPricing } from "@/lib/catalog";

const TCGDEX_CARD_URL = "https://api.tcgdex.net/v2/en/cards";

/** TCGdex returns a base path; append quality + extension per https://tcgdex.dev/assets */
export function tcgdexDisplayImageUrl(imageBase: string): string {
  return `${imageBase}/high.webp`;
}

type TcgdexCardJson = {
  image?: string;
  error?: string;
};

async function fetchTcgdexImageForId(
  tcgdexCardId: string,
): Promise<string | null> {
  const url = `${TCGDEX_CARD_URL}/${encodeURIComponent(tcgdexCardId)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86_400 },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as TcgdexCardJson;
  if (data.error || !data.image) return null;
  return tcgdexDisplayImageUrl(data.image);
}

/**
 * Fills `imageUrl` from TCGdex (public GET, no API key). Deduplicates requests
 * when multiple listings share the same `tcgdexCardId`.
 */
export async function enrichTcgdexImages(
  cards: CatalogCardWithPricing[],
): Promise<CatalogCardWithPricing[]> {
  const pending = new Map<string, Promise<string | null>>();
  const resolved = new Map<string, string | null>();

  const getImage = (id: string): Promise<string | null> => {
    const hit = resolved.get(id);
    if (hit !== undefined) return Promise.resolve(hit);
    let p = pending.get(id);
    if (!p) {
      p = fetchTcgdexImageForId(id).then((url) => {
        resolved.set(id, url);
        pending.delete(id);
        return url;
      });
      pending.set(id, p);
    }
    return p;
  };

  return Promise.all(
    cards.map(async (card) => {
      if (!card.tcgdexCardId) {
        return { ...card, imageUrl: null };
      }
      const imageUrl = await getImage(card.tcgdexCardId);
      return { ...card, imageUrl };
    }),
  );
}
