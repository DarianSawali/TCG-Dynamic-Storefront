import "dotenv/config";
import { mockCards } from "../src/lib/catalog";
import { mergeJustTcgPrices } from "../src/lib/justtcg/merge-catalog-prices";
import { db } from "../src/lib/db";
import { observeJustTcgPrices } from "../src/lib/pricing/observations";

async function main() {
  const cards = await mergeJustTcgPrices(mockCards);
  const liveCards = cards.filter((card) => card.priceSource === "justtcg");
  if (!liveCards.length) {
    throw new Error("No live JustTCG prices were returned; no observations recorded.");
  }

  const result = await observeJustTcgPrices(liveCards);
  console.log(
    JSON.stringify(
      {
        liveCards: liveCards.length,
        recordedConditions: result.recordedCount,
        priorConfirmationCandidates:
          result.previousByCardCondition.size,
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
