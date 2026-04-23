import { CardGrid } from "@/components/card-grid";
import { getCatalogCards } from "@/data/catalog";

export const metadata = {
  title: "Cards",
};

/** Refresh JustTCG-backed prices periodically (free tier: keep moderate). */
export const revalidate = 600;

export default async function CardsPage() {
  const cards = await getCatalogCards();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Card catalog
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Browse mock cards below. Art loads from{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            TCGdex
          </span>{" "}
          (no key). Set{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
            JUSTTCG_API_KEY
          </code>{" "}
          for live Near Mint prices on rows that define a JustTCG{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
            cardId
          </code>
          . See{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
            docs/CARD_DATA_PIPELINE.md
          </code>{" "}
          for the full flow.
        </p>
      </div>
      <CardGrid cards={cards} variant="catalog" />
    </div>
  );
}
