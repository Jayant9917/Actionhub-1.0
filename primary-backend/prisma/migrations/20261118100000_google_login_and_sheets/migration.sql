ALTER TABLE "User" ADD COLUMN "googleSubject" TEXT;
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");
CREATE TABLE "GoogleOAuthFlow" (
 "id" TEXT NOT NULL PRIMARY KEY, "ownerId" INTEGER, "purpose" TEXT NOT NULL,
 "bindingHash" TEXT NOT NULL, "nonceHash" TEXT NOT NULL, "verifier" TEXT NOT NULL, "name" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'pending', "credentialId" TEXT,
 "sessionHash" TEXT, "sessionExpiresAt" TIMESTAMP(3), "expiresAt" TIMESTAMP(3) NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "GoogleOAuthFlow_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "GoogleOAuthFlow_purpose_check" CHECK ("purpose" IN ('login','link','sheets'))
);
CREATE UNIQUE INDEX "GoogleOAuthFlow_sessionHash_key" ON "GoogleOAuthFlow"("sessionHash");
CREATE INDEX "GoogleOAuthFlow_expiresAt_idx" ON "GoogleOAuthFlow"("expiresAt");
