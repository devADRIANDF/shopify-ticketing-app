-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'VALID', 'SCANNED', 'INVALID', 'CANCELLED');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "shopifyOrderName" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "variantTitle" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "buyerEmail" TEXT NOT NULL,
    "buyerName" TEXT,
    "ticketType" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "qrData" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "scannedAt" TIMESTAMP(3),
    "scannedBy" TEXT,
    "shop" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventDate" TIMESTAMP(3),
    "eventName" TEXT,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "ticketTag" TEXT NOT NULL DEFAULT 'ticket',
    "autoEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "brandColor" TEXT NOT NULL DEFAULT '#5C6AC4',
    "brandLogo" TEXT,
    "emailTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_qrCode_key" ON "Ticket"("qrCode");

-- CreateIndex
CREATE INDEX "Ticket_shop_idx" ON "Ticket"("shop");

-- CreateIndex
CREATE INDEX "Ticket_shopifyOrderId_idx" ON "Ticket"("shopifyOrderId");

-- CreateIndex
CREATE INDEX "Ticket_qrCode_idx" ON "Ticket"("qrCode");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_buyerEmail_idx" ON "Ticket"("buyerEmail");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_shop_name_key" ON "EmailTemplate"("shop", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_shop_key" ON "AppSettings"("shop");
