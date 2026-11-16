import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
const parameters = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const format = /^scrypt\$v1\$131072\$8\$1\$[a-f0-9]{32}\$[a-f0-9]{128}$/;
// Bound memory-heavy authentication work per API process.
let active = 0;
const waiting: (() => void)[] = [];
async function derive(password: string, salt: Buffer): Promise<Buffer> {
  if (active >= 2) {
    if (waiting.length >= 32) throw new Error("PASSWORD_SERVICE_BUSY");
    await new Promise<void>((resolve) => waiting.push(resolve));
  } else active++;
  try {
    return await new Promise<Buffer>((resolve, reject) =>
      scrypt(password, salt, 64, parameters, (error, key) =>
        error ? reject(error) : resolve(key),
      ),
    );
  } finally {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
}
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16),
    key = await derive(password, salt);
  return `scrypt$v1$131072$8$1$${salt.toString("hex")}$${key.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  const valid = typeof stored === "string" && format.test(stored);
  const pieces = valid ? stored!.split("$") : [];
  // Do equivalent hashing work for a missing account or Google-only account.
  const salt = valid ? Buffer.from(pieces[5]!, "hex") : Buffer.alloc(16);
  const expected = valid ? Buffer.from(pieces[6]!, "hex") : Buffer.alloc(64);
  const actual = await derive(password, salt),
    matches = timingSafeEqual(actual, expected);
  return valid && matches;
}
