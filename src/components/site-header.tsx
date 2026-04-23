import Link from "next/link";

const navLinkClass =
  "text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          Cardhouse
        </Link>
        <nav className="flex items-center gap-6" aria-label="Main">
          <Link href="/cards" className={navLinkClass}>
            Cards
          </Link>
          <Link href="/shop" className={navLinkClass}>
            Shop
          </Link>
          <Link
            href="/admin"
            className={`${navLinkClass} rounded-md border border-zinc-200 px-2.5 py-1 dark:border-zinc-700`}
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
