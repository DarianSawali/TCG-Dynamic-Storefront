# PokeCell TCG

A responsive headless Pokémon TCG storefront that combines a custom Next.js
shopping experience with Shopify checkout, live card data, and a protected
listing and pricing dashboard.

## What it does

- Presents the catalog as a responsive, Pokémon PC-box-inspired card browser.
- Loads card artwork from TCGdex and synchronized market prices from JustTCG.
- Uses Shopify's Storefront API for products, condition variants, inventory,
  persistent carts, and hosted checkout.
- Protects cart identifiers in encrypted, HTTP-only cookies.
- Provides authenticated admin sessions backed by PostgreSQL.
- Compares Shopify variants with market prices using approval thresholds and
  timed safeguards for significant price decreases.
- Audits catalog-to-Shopify health, including missing products, duplicate
  matches, publication status, SKUs, variants, and inventory.
- Generates and creates duplicate-safe, unpublished Shopify product drafts with
  five standardized condition variants.

## Stack

- Next.js 16, React 19, TypeScript, and Tailwind CSS
- PostgreSQL with Prisma ORM
- Shopify Storefront and GraphQL Admin APIs
- TCGdex card data and artwork
- JustTCG market pricing

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and add your PostgreSQL, Shopify, and optional
   JustTCG credentials. Never expose Admin API credentials or private Storefront
   tokens through `NEXT_PUBLIC_` variables.

3. Apply database migrations and seed the catalog:

   ```bash
   npm run db:setup
   ```

4. Create the first administrator:

   ```bash
   npm run admin:create
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Detailed Windows/PostgreSQL
instructions are available in [docs/postgres-setup.md](docs/postgres-setup.md).

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Create and validate a production build |
| `npm run lint` | Run ESLint |
| `npm run db:fetch-sets` | Import configured TCGdex sets |
| `npm run pricing:sync-catalog` | Synchronize stored JustTCG prices |
| `npm run shopify:check` | Verify Storefront API access |
| `npm run shopify:check-admin` | Verify Shopify Admin API access |
| `npm run shopify:check-listing-schema` | Validate listing-manager API compatibility |

## Safety model

Customer checkout remains hosted by Shopify. Administrative writes require an
authenticated server-side session, re-fetch current data before mutation, and
reject duplicate product matches or handle collisions. New products are created
as unpublished drafts with zero inventory and must be reviewed before they can
become sellable.

## Status

Active development. Catalog browsing, market-price synchronization, Shopify
cart/checkout, guarded repricing, listing health checks, and unpublished product
draft creation are implemented. Inventory editing and controlled Headless
publication are the next milestone.
