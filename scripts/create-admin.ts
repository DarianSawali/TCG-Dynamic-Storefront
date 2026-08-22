import "dotenv/config";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!email) throw new Error("ADMIN_EMAIL is required.");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters.");

  const passwordHash = await hashPassword(password);
  await db.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });
  console.log(`Admin account ready: ${email}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await db.$disconnect();
    process.exit(1);
  });
