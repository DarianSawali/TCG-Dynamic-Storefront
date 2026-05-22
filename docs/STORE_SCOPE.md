# Store catalog scope

This storefront intentionally sells **only** these Pokémon TCG expansions.

**Storefront visibility:** English sets are shown by default. Japanese sets remain in seed/mock data but are hidden until `SHOW_JAPANESE_LOCALE` is set to `true` in `src/lib/sets.ts`.

| Product line | English (TCGdex) | Japanese (TCGdex, hidden for now) |
|--------------|------------------|-----------------------------------|
| **151** | `sv03.5` — 151 | `SV2a` — ポケモンカード151 |
| **Phantasmal Flames** | `me02` — Phantasmal Flames | `M2` — インフェルノX (Inferno X) |
| **Ascended Heroes** | `me02.5` — Ascended Heroes | `M3` — ムニキスゼロ |

Configuration lives in `src/lib/sets.ts`. The database only loads cards whose `setCode` is in that list (`STORE_SET_CODES`).

To add more sets later, extend `STORE_SETS`, seed cards with matching `setCode` / `locale`, and re-run `npm run db:seed`.
