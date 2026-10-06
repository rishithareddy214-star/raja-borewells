CREATE SEQUENCE IF NOT EXISTS "Enquiry_lead_id_seq";
CREATE SEQUENCE IF NOT EXISTS "Quotation_quotation_id_seq";

ALTER TABLE "Enquiry"
  ADD COLUMN IF NOT EXISTS "leadId" TEXT,
  ADD COLUMN IF NOT EXISTS "village" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "pincode" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "googleMaps" TEXT,
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "purpose" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "landSize" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "boreDiameter" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "serviceLabel" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "contactType" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "sourcePage" VARCHAR(300),
  ADD COLUMN IF NOT EXISTS "leadSource" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "deviceType" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "possibleDuplicate" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "followUpAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "followUpDone" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "BusinessProfile"
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "googleMapsUrl" TEXT;

ALTER TABLE "ServiceArea"
  ADD COLUMN IF NOT EXISTS "pincode" VARCHAR(20);

ALTER TABLE "AdminUser"
  ADD COLUMN IF NOT EXISTS "role" VARCHAR(20) NOT NULL DEFAULT 'ADMIN';

ALTER TABLE "ServiceRate"
  ALTER COLUMN "serviceId" DROP NOT NULL;

ALTER TABLE "Review"
  ADD COLUMN IF NOT EXISTS "permissionToPublish" BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE "Enquiry"
SET "leadId" = 'RB-LEGACY-' || "id"
WHERE "leadId" IS NULL;

ALTER TABLE "Enquiry"
  ALTER COLUMN "leadId" SET NOT NULL,
  ALTER COLUMN "leadId" SET DEFAULT (
    'RB-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
    lpad(nextval('"Enquiry_lead_id_seq"')::text, 4, '0')
  );

CREATE UNIQUE INDEX IF NOT EXISTS "Enquiry_leadId_key" ON "Enquiry"("leadId");
CREATE INDEX IF NOT EXISTS "Enquiry_phone_idx" ON "Enquiry"("phone");
CREATE INDEX IF NOT EXISTS "Enquiry_status_idx" ON "Enquiry"("status");
CREATE INDEX IF NOT EXISTS "Enquiry_area_idx" ON "Enquiry"("area");
CREATE INDEX IF NOT EXISTS "Enquiry_serviceLabel_idx" ON "Enquiry"("serviceLabel");
CREATE INDEX IF NOT EXISTS "Enquiry_leadSource_idx" ON "Enquiry"("leadSource");
CREATE INDEX IF NOT EXISTS "Enquiry_createdAt_idx" ON "Enquiry"("createdAt");
CREATE INDEX IF NOT EXISTS "Enquiry_followUpAt_followUpDone_idx" ON "Enquiry"("followUpAt", "followUpDone");
CREATE INDEX IF NOT EXISTS "ServiceArea_name_idx" ON "ServiceArea"("name");
CREATE INDEX IF NOT EXISTS "SiteVisit_phone_idx" ON "SiteVisit"("phone");
CREATE INDEX IF NOT EXISTS "SiteVisit_status_idx" ON "SiteVisit"("status");

CREATE TABLE IF NOT EXISTS "ContactEvent" (
  "id" TEXT NOT NULL,
  "contactType" VARCHAR(30) NOT NULL,
  "sourcePage" VARCHAR(300) NOT NULL,
  "serviceId" TEXT,
  "area" VARCHAR(200),
  "deviceType" VARCHAR(30) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ContactEvent_contactType_createdAt_idx" ON "ContactEvent"("contactType", "createdAt");
CREATE INDEX IF NOT EXISTS "ContactEvent_sourcePage_idx" ON "ContactEvent"("sourcePage");

CREATE TABLE IF NOT EXISTS "CallbackRequest" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "phone" VARCHAR(50) NOT NULL,
  "preferredTime" VARCHAR(30) NOT NULL,
  "message" TEXT,
  "status" VARCHAR(30) NOT NULL DEFAULT 'New',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CallbackRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CallbackRequest_status_createdAt_idx" ON "CallbackRequest"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "CallbackRequest_phone_idx" ON "CallbackRequest"("phone");

CREATE TABLE IF NOT EXISTS "CustomerNote" (
  "id" TEXT NOT NULL,
  "enquiryId" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerNote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerNote_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CustomerNote_enquiryId_createdAt_idx" ON "CustomerNote"("enquiryId", "createdAt");

CREATE TABLE IF NOT EXISTS "Quotation" (
  "id" TEXT NOT NULL,
  "quotationId" TEXT NOT NULL,
  "secureToken" TEXT NOT NULL,
  "enquiryId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(12,2) NOT NULL,
  "unit" VARCHAR(50) NOT NULL,
  "rate" DECIMAL(12,2) NOT NULL,
  "additionalCharges" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "grandTotal" DECIMAL(12,2) NOT NULL,
  "validity" VARCHAR(100),
  "terms" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Quotation_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Quotation_quotationId_key" ON "Quotation"("quotationId");
CREATE UNIQUE INDEX IF NOT EXISTS "Quotation_secureToken_key" ON "Quotation"("secureToken");
CREATE INDEX IF NOT EXISTS "Quotation_enquiryId_createdAt_idx" ON "Quotation"("enquiryId", "createdAt");

CREATE TABLE IF NOT EXISTS "AdminActivityLog" (
  "id" TEXT NOT NULL,
  "adminEmail" VARCHAR(200) NOT NULL,
  "action" VARCHAR(100) NOT NULL,
  "recordType" VARCHAR(100) NOT NULL,
  "recordId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminActivityLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AdminActivityLog_createdAt_idx" ON "AdminActivityLog"("createdAt");
