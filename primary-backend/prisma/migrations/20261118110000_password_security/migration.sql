ALTER TABLE "User" ADD COLUMN "passwordHashed" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "AuthRateLimit" ("key" TEXT NOT NULL PRIMARY KEY,"hits" INTEGER NOT NULL,"resetAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX "AuthRateLimit_resetAt_idx" ON "AuthRateLimit"("resetAt");
