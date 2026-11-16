import { PrismaClient } from "../src/generated/prisma-new/client.js";
import { migrateLegacyPasswords } from "../src/password-migration.js";
const db = new PrismaClient();
migrateLegacyPasswords(db)
  .then((count) => {
    console.log(`Password migration complete: ${count} account(s) upgraded.`);
  })
  .catch(() => {
    console.error("Password migration failed. API startup must wait until it completes.");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
