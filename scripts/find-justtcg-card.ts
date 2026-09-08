import "dotenv/config";
import { JustTCG } from "justtcg-js";

const query = process.argv[2]?.trim();
const number = process.argv[3]?.trim();

if (!query) {
  console.error("Usage: npx tsx scripts/find-justtcg-card.ts \"Charizard ex\" 006");
  process.exit(1);
}

if (!process.env.JUSTTCG_API_KEY?.trim()) {
  console.error("JUSTTCG_API_KEY is not configured.");
  process.exit(1);
}

async function main() {
  const client = new JustTCG({ apiKey: process.env.JUSTTCG_API_KEY });
  const response = await client.v1.cards.search(query!, {
    game: "Pokemon",
    ...(number ? { number } : {}),
    condition: ["NM", "LP", "MP", "HP", "DMG"],
    include_null_prices: true,
    limit: 20,
  });

  if (response.error) {
    throw new Error(`JustTCG lookup failed: ${response.error}`);
  }

  console.log(`Found ${response.data.length} candidate(s).`);
  for (const card of response.data) {
    console.log(JSON.stringify({
      id: card.id,
      name: card.name,
      set: card.set,
      setName: card.set_name,
      number: card.number,
      rarity: card.rarity,
      tcgplayerId: card.tcgplayerId,
      variants: card.variants.map((variant) => ({
        condition: variant.condition,
        printing: variant.printing,
        price: variant.price,
        lastUpdated: variant.lastUpdated,
      })),
    }, null, 2));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
