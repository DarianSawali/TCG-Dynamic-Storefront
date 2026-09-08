import "server-only";

import type { CatalogCardWithPricing } from "@/lib/catalog";
import type { CardLocale } from "@/lib/sets";

/** TCGdex returns a base path; append quality + extension per https://tcgdex.dev/assets */
export function tcgdexDisplayImageUrl(imageBase: string): string {
  return `${imageBase}/high.webp`;
}

type TcgdexCardJson = {
  image?: string;
  error?: string;
};

export async function getTcgdexCardImageUrl(
  tcgdexCardId: string,
  locale: CardLocale,
): Promise<string | null> {
  const url = `https://api.tcgdex.net/v2/${locale}/cards/${encodeURIComponent(tcgdexCardId)}`;
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

  const getImage = (id: string, locale: CardLocale): Promise<string | null> => {
    const key = `${locale}:${id}`;
    const hit = resolved.get(key);
    if (hit !== undefined) return Promise.resolve(hit);
    let p = pending.get(key);
    if (!p) {
      p = getTcgdexCardImageUrl(id, locale).then((url) => {
        resolved.set(key, url);
        pending.delete(key);
        return url;
      });
      pending.set(key, p);
    }
    return p;
  };

  return Promise.all(
    cards.map(async (card) => {
      if (card.tcgdexImageUrl) {
        return { ...card, imageUrl: tcgdexDisplayImageUrl(card.tcgdexImageUrl) };
      }
      if (!card.tcgdexCardId) {
        return { ...card, imageUrl: null };
      }
      const imageUrl = await getImage(card.tcgdexCardId, card.locale);
      return { ...card, imageUrl };
    }),
  );
}
