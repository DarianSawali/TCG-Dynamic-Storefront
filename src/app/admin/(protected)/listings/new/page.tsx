import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { getCatalogCards } from "@/data/catalog";
import { findCatalogCardForShopifyProduct } from "@/lib/pricing/shopify-match";
import { getShopifyAdminProducts } from "@/lib/shopify/admin";
import { buildShopifyListingDraft } from "@/lib/shopify/listing-draft";

export const metadata: Metadata = {
  title: "Listing draft",
};

type PageProps = {
  searchParams: Promise<{ card?: string | string[] }>;
};

function value(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function yesNo(input: boolean): string {
  return input ? "Yes" : "No";
}

export default async function NewListingPreviewPage({ searchParams }: PageProps) {
  const slug = value((await searchParams).card);
  if (!slug) notFound();

  const [cards, products] = await Promise.all([
    getCatalogCards(),
    getShopifyAdminProducts(),
  ]);
  const card = cards.find((item) => item.slug === slug);
  if (!card) notFound();

  const existingProducts = products.filter(
    (product) => findCatalogCardForShopifyProduct(product, cards)?.slug === card.slug,
  );
  const draft = buildShopifyListingDraft(card);
  const blocked = draft.blockers.length > 0 || existingProducts.length > 0;

  return (
    <div className="space-y-6">
      <AdminNav current="listings" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/listings"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
          >
            ← Back to listings
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            Review listing draft
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Preview only. Nothing on this page can create or modify a Shopify product.
          </p>
        </div>
        <span className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
          No Shopify writes
        </span>
      </div>

      {existingProducts.length > 0 ? (
        <section className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          Creation is blocked because {existingProducts.length} existing Shopify
          product{existingProducts.length === 1 ? " already matches" : "s already match"} this card.
        </section>
      ) : null}

      {draft.blockers.length > 0 || draft.warnings.length > 0 ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
          <h2 className="font-semibold text-amber-950 dark:text-amber-100">
            Preflight checks
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-amber-900 dark:text-amber-200">
            {draft.blockers.map((message) => (
              <li key={message}>Blocked: {message}</li>
            ))}
            {draft.warnings.map((message) => (
              <li key={message}>Review: {message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-[10rem_minmax(0,1fr)] sm:p-6">
        <div className="relative mx-auto aspect-[5/7] w-full max-w-40 overflow-hidden rounded-md border border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
          {draft.imageUrl ? (
            <Image
              src={draft.imageUrl}
              alt={card.name}
              fill
              className="object-contain p-1"
              sizes="160px"
            />
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <DraftField label="Title" value={draft.title} />
            <DraftField label="Handle" value={draft.handle} mono />
            <DraftField label="Set" value={`${card.setName} (${card.setCode})`} />
            <DraftField label="Collector number" value={`#${card.collectorNumber}`} />
            <DraftField label="Shopify status" value={draft.status} />
            <DraftField label="Product option" value={draft.optionName} />
          </div>
          <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Description
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {draft.description}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
            Proposed condition variants
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Prices come from the synchronized catalog. Inventory intentionally starts at zero.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-950/60">
              <tr>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Initial quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {draft.variants.map((variant) => (
                <tr key={variant.condition}>
                  <td className="px-4 py-3 font-medium text-zinc-950 dark:text-zinc-50">
                    {variant.title}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {variant.sku}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {variant.price == null ? "Missing" : `$${variant.price}`}
                  </td>
                  <td className="px-4 py-3 text-right">{variant.inventoryQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
          Safety defaults
        </h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <DraftField label="Requires shipping" value={yesNo(draft.requiresShipping)} />
          <DraftField label="Track quantity" value={yesNo(draft.trackQuantity)} />
          <DraftField
            label="Sell when out of stock"
            value={yesNo(draft.continueSellingWhenOutOfStock)}
          />
          <DraftField
            label="Publish to Headless"
            value={yesNo(draft.publishToHeadless)}
          />
        </dl>
      </section>

      <section className="rounded-xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        {blocked
          ? "Resolve the blockers above before creation can be enabled."
          : "Draft is eligible. The next stage will add an explicit confirmation step that creates this as an unpublished Shopify draft."}
      </section>
    </div>
  );
}

function DraftField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-sm text-zinc-950 dark:text-zinc-50 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}
