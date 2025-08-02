-- CreateTable
CREATE TABLE "public"."tokens" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "tick" INTEGER NOT NULL,
    "sqrtPriceX96" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "coinType" TEXT NOT NULL,
    "appType" TEXT NOT NULL,
    "blockNumber" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scan_history" (
    "id" TEXT NOT NULL,
    "startBlock" TEXT NOT NULL,
    "endBlock" TEXT NOT NULL,
    "tokensFound" INTEGER NOT NULL,
    "zoraTokens" INTEGER NOT NULL,
    "tbaTokens" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_poolId_key" ON "public"."tokens"("poolId");
