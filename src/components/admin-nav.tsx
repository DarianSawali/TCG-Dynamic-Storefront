import Link from "next/link";

const linkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50";

const activeClass =
  "bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50";

type AdminNavProps = {
  current?: "dashboard" | "listings" | "pricing";
};

export function AdminNav({ current }: AdminNavProps) {
  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-zinc-200 pb-3 dark:border-zinc-800"
      aria-label="Admin"
    >
      <Link
        href="/admin"
        className={current === "dashboard" ? `${linkClass} ${activeClass}` : linkClass}
      >
        Dashboard
      </Link>
      <Link
        href="/admin/listings"
        className={current === "listings" ? `${linkClass} ${activeClass}` : linkClass}
      >
        Listings
      </Link>
      <Link
        href="/admin/pricing"
        className={current === "pricing" ? `${linkClass} ${activeClass}` : linkClass}
      >
        Pricing
      </Link>
    </nav>
  );
}
