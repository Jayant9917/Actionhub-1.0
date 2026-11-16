import type { PrismaClient } from "./generated/prisma-new/client.js";
import { hashPassword } from "./passwords.js";
export async function migrateLegacyPasswords(db: Pick<PrismaClient, "user">, hash = hashPassword) {
  let upgraded = 0;
  while (true) {
    const users = await db.user.findMany({
      where: { passwordHashed: false, password: { not: null } },
      select: { id: true, password: true },
      orderBy: { id: "asc" },
      take: 25,
    });
    if (!users.length) return upgraded;
    for (const user of users) {
      if (user.password === null) continue;
      const hashed = await hash(user.password);
      // Another migration may win the same row. Never hash a hash or overwrite a concurrent change.
      const result = await db.user.updateMany({
        where: { id: user.id, passwordHashed: false, password: user.password },
        data: { password: hashed, passwordHashed: true },
      });
      upgraded += result.count;
    }
  }
}
