import type { Metadata } from "next";
import { AdminNav } from "@/components/admin-nav";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <AdminNav current="dashboard" />
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Auth, metrics, and quick actions will live here after the database is
          connected.
        </p>
      </div>
    </div>
  );
}
