import "dotenv/config";
import { db } from "../src/lib/db";

async function main() {
  const [count, latest, mappedCards] = await Promise.all([
    db.priceSnapshot.count({ where: { source: "justtcg" } }),
    db.priceSnapshot.findMany({
      where: { source: "justtcg" },
      orderBy: { fetchedAt: "desc" },
      take: 10,
      select: {
        condition: true,
        amountCents: true,
        fetchedAt: true,
        card: { select: { slug: true } },
      },
    }),
    db.card.findMany({
      where: { justtcgCardId: { not: null } },
      select: { slug: true, justtcgCardId: true },
    }),
  ]);

  console.log(JSON.stringify({ count, mappedCards, latest }, null, 2));
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
