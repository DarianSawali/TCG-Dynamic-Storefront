import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200/80 bg-zinc-50/80 dark:border-zinc-800/80 dark:bg-zinc-950/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Pokémon and related assets are trademarks of Nintendo, Creatures
          Inc., and GAME FREAK inc.
        </p>
        <div className="flex gap-6 text-sm">
          <Link
            href="/cards"
            className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Explore
          </Link>
          <Link
            href="/shop"
            className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Shop
          </Link>
        </div>
      </div>
    </footer>
  );
}
