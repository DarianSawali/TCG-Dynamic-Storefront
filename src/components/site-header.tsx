"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinkClass =
  "inline-flex items-center border border-transparent px-2.5 py-2 font-mono text-[11px] font-medium tracking-wide text-pokedex-muted uppercase transition-[color,border-color,background-color,transform] hover:border-pokedex-muted/60 hover:bg-white/5 hover:text-pokedex-cream active:scale-[0.96] motion-reduce:transition-colors motion-reduce:active:scale-100";

const cartLinkClass =
  "group relative flex size-9 shrink-0 items-center justify-center text-pokedex-cream transition-[color,transform] duration-200 ease-out hover:text-pokedex-bright active:scale-[0.92] motion-reduce:transition-colors motion-reduce:active:scale-100";

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.41L23 6H6" />
    </svg>
  );
}

const mainNav = [
  { href: "/cards", label: "Explore" },
  { href: "/shop", label: "Shop" },
] as const;

export function SiteHeader({ shopifyItemCount }: { shopifyItemCount: number }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-pokedex/45 bg-[#1d1d1f]/95 text-pokedex-cream shadow-[0_8px_24px_-18px_rgba(223,90,72,0.8)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="group relative font-mono text-sm font-bold tracking-[0.12em] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] motion-reduce:transform-none"
        >
          <span className="relative z-10 inline-flex items-baseline">
            <span className="text-pokedex-cream transition-colors group-hover:text-white">
              Poke
            </span>
            <span className="text-pokedex-bright transition-colors group-hover:text-[#ff9a89]">
              Cell
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          {mainNav.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`${navLinkClass} ${
                  active
                    ? "border-pokedex bg-pokedex/15 text-pokedex-bright shadow-[inset_0_-2px_0_var(--color-pokedex)]"
                    : ""
                }`}
              >
                {label}
              </Link>
            );
          })}
          <Link
            href="/shopify-cart"
            aria-label={`Shopify cart with ${shopifyItemCount} items`}
            className={cartLinkClass}
          >
            <CartIcon className="size-4 transition-transform duration-200 group-hover:-translate-y-px group-active:translate-y-0 motion-reduce:group-hover:translate-y-0" />
            {shopifyItemCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center bg-pokedex px-1 font-mono text-[9px] font-semibold leading-4 text-white shadow-[0_0_10px_rgba(223,90,72,0.65)]">
                {shopifyItemCount}
              </span>
            ) : null}
          </Link>
          <Link
            href="/admin"
            className="hidden border border-pokedex-muted/40 bg-transparent px-2.5 py-1.5 font-mono text-[10px] tracking-wide text-pokedex-muted uppercase transition-colors hover:border-pokedex hover:text-pokedex-bright sm:inline-flex"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
