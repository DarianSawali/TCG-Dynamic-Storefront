import type { Metadata } from "next";
import { AdminNav } from "@/components/admin-nav";

export const metadata: Metadata = {
  title: "Listings",
};

export default function AdminListingsPage() {
  return (
    <div className="space-y-6">
      <AdminNav current="listings" />
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Listings
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Create and edit listings, mock stock, and Shopify product links here
          later.
        </p>
      </div>
    </div>
  );
}
