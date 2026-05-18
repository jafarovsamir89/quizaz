-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "explanationRu" TEXT,
ADD COLUMN     "optionsRu" JSONB,
ADD COLUMN     "textRu" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clanId" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'az';

-- CreateTable
CREATE TABLE "Clan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "logoUrl" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hero" (
    "id" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "nameAz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "perkType" TEXT NOT NULL,
    "perkValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "descriptionAz" TEXT NOT NULL,
    "descriptionRu" TEXT NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "Hero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHero" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "heroId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserHero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveShow" (
    "id" TEXT NOT NULL,
    "titleAz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "questionIds" INTEGER[],
    "prizeCoins" INTEGER NOT NULL DEFAULT 10000,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveShow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Clan_name_key" ON "Clan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Hero_nameKey_key" ON "Hero"("nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "UserHero_userId_heroId_key" ON "UserHero"("userId", "heroId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "Clan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHero" ADD CONSTRAINT "UserHero_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHero" ADD CONSTRAINT "UserHero_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "Hero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
