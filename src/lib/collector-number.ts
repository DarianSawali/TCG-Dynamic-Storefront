/** Parse TCG collector numbers like "006", "193", "TG01" for stable sort. */
export function collectorNumberSortKey(collectorNumber: string): [number, string] {
  const trimmed = collectorNumber.trim();
  const match = trimmed.match(/^(\d+)/);
  const numeric = match ? Number.parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
  return [numeric, trimmed.toLowerCase()];
}

export function compareCollectorNumbers(a: string, b: string): number {
  const [aNum, aRest] = collectorNumberSortKey(a);
  const [bNum, bRest] = collectorNumberSortKey(b);
  if (aNum !== bNum) return aNum - bNum;
  return aRest.localeCompare(bRest);
}

export function sortByCollectorNumber<T extends { collectorNumber: string }>(
  cards: readonly T[],
): T[] {
  return [...cards].sort((a, b) =>
    compareCollectorNumbers(a.collectorNumber, b.collectorNumber),
  );
}

/** Set order, then collector number — for Explore PC boxes. */
export function sortCatalogForExplore<
  T extends { setCode: string; collectorNumber: string },
>(cards: readonly T[]): T[] {
  return [...cards].sort((a, b) => {
    const setCmp = a.setCode.localeCompare(b.setCode);
    if (setCmp !== 0) return setCmp;
    return compareCollectorNumbers(a.collectorNumber, b.collectorNumber);
  });
}

export function chunkIntoBoxes<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0) return [[]];
  if (items.length === 0) return [[]];
  const boxes: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    boxes.push(items.slice(i, i + size));
  }
  return boxes;
}
