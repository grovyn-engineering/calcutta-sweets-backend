CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "shopCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "gstin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Customer_shopCode_idx" ON "Customer"("shopCode");
CREATE UNIQUE INDEX "Customer_shopCode_phone_key" ON "Customer"("shopCode", "phone");

ALTER TABLE "Customer"
ADD CONSTRAINT "Customer_shopCode_fkey"
FOREIGN KEY ("shopCode") REFERENCES "Shop"("shopCode") ON DELETE RESTRICT ON UPDATE CASCADE;
