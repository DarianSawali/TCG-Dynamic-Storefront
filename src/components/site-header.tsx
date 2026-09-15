"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      aria-hidden
      className="size-5"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <rect x="4" y="4" width="6" height="6" />
          <rect x="14" y="4" width="6" height="6" />
          <rect x="4" y="14" width="6" height="6" />
          <rect x="14" y="14" width="6" height="6" />
        </>
      )}
    </svg>
  );
}

const mainNav = [
  { href: "/cards", label: "Explore" },
  { href: "/shop", label: "Shop" },
] as const;

export function SiteHeader({ shopifyItemCount }: { shopifyItemCount: number }) {
  const pathname = usePathname();
  const [mobileMenu, setMobileMenu] = useState({ open: false, pathname });
  const mobileMenuOpen = mobileMenu.open && mobileMenu.pathname === pathname;

  const closeMobileMenu = () => setMobileMenu({ open: false, pathname });

  const cartLink = (
    <Link
      href="/shopify-cart"
      aria-label={`Shopify cart with ${shopifyItemCount} items`}
      className={cartLinkClass}
      onClick={closeMobileMenu}
    >
      <CartIcon className="size-5 transition-transform duration-200 group-hover:-translate-y-px group-active:translate-y-0 motion-reduce:group-hover:translate-y-0 md:size-4" />
      {shopifyItemCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-pokedex px-1 font-mono text-[9px] font-semibold leading-4 text-white shadow-[0_0_10px_rgba(223,90,72,0.65)]">
          {shopifyItemCount}
        </span>
      ) : null}
    </Link>
  );

  return (
    <header
      className="sticky top-0 z-50 border-b border-pokedex/45 bg-[#1d1d1f]/95 text-pokedex-cream shadow-[0_8px_24px_-18px_rgba(223,90,72,0.8)] backdrop-blur"
      onKeyDown={(event) => {
        if (event.key === "Escape") closeMobileMenu();
      }}
    >
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
        <nav className="hidden items-center gap-2 md:flex" aria-label="Main">
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
          {cartLink}
          <Link
            href="/admin"
            className="inline-flex border border-pokedex-muted/40 bg-transparent px-2.5 py-1.5 font-mono text-[10px] tracking-wide text-pokedex-muted uppercase transition-colors hover:border-pokedex hover:text-pokedex-bright"
          >
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <button
            type="button"
            aria-label={
              mobileMenuOpen
                ? "Close navigation menu"
                : `Open navigation menu, cart has ${shopifyItemCount} items`
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-site-menu"
            onClick={() =>
              setMobileMenu({ open: !mobileMenuOpen, pathname })
            }
            className="group relative flex size-10 items-center justify-center rounded-full border border-pokedex/55 bg-pokedex-deep/55 text-pokedex-bright shadow-[inset_0_0_0_2px_rgba(0,0,0,0.18)] transition-[background-color,color,transform] hover:bg-pokedex hover:text-white active:scale-90 motion-reduce:transition-colors"
          >
            <MenuIcon open={mobileMenuOpen} />
            {!mobileMenuOpen && shopifyItemCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-pokedex px-1 font-mono text-[9px] font-semibold leading-4 text-white shadow-[0_0_10px_rgba(223,90,72,0.65)]">
                {shopifyItemCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div
          id="mobile-site-menu"
          className="border-t border-pokedex/35 bg-[#181719] px-4 pb-4 pt-3 shadow-[0_18px_30px_-18px_rgba(0,0,0,0.95)] md:hidden"
        >
          <nav
            aria-label="Mobile navigation"
            className="mx-auto grid max-w-6xl grid-cols-2 gap-2"
          >
            {[
              ...mainNav,
              { href: "/shopify-cart", label: "Cart" },
              { href: "/admin", label: "Admin" },
            ].map(({ href, label }, index) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobileMenu}
                  aria-current={active ? "page" : undefined}
                  className={`group flex min-h-16 items-center justify-between border px-3 py-3 font-mono text-xs tracking-wide uppercase transition-[border-color,background-color,color,transform] active:scale-[0.98] ${
                    active
                      ? "border-pokedex bg-pokedex-deep/80 text-pokedex-bright"
                      : "border-[#625253] bg-[#29282a] text-pokedex-muted hover:border-pokedex/75 hover:bg-pokedex-deep/45 hover:text-pokedex-cream"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {label}
                    {href === "/shopify-cart" && shopifyItemCount > 0 ? (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-pokedex px-1.5 text-[9px] font-semibold leading-5 text-white shadow-[0_0_10px_rgba(223,90,72,0.55)]">
                        {shopifyItemCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[9px] text-pokedex/80 group-hover:text-pokedex-bright">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
