UPDATE "Enquiry"
SET "status" = CASE lower(btrim("status"))
  WHEN 'new' THEN 'NEW'
  WHEN 'contacted' THEN 'CONTACTED'
  WHEN 'quote sent' THEN 'QUOTE SENT'
  WHEN 'site visit' THEN 'SITE VISIT REQUESTED'
  WHEN 'site visit requested' THEN 'SITE VISIT REQUESTED'
  WHEN 'site visit completed' THEN 'SITE VISIT COMPLETED'
  WHEN 'scheduled' THEN 'WORK SCHEDULED'
  WHEN 'work scheduled' THEN 'WORK SCHEDULED'
  WHEN 'in progress' THEN 'WORK IN PROGRESS'
  WHEN 'work in progress' THEN 'WORK IN PROGRESS'
  WHEN 'completed' THEN 'COMPLETED'
  WHEN 'cancelled' THEN 'CANCELLED'
  ELSE "status"
END
WHERE lower(btrim("status")) IN (
  'new',
  'contacted',
  'quote sent',
  'site visit',
  'site visit requested',
  'site visit completed',
  'scheduled',
  'work scheduled',
  'in progress',
  'work in progress',
  'completed',
  'cancelled'
);

ALTER TABLE "Enquiry"
  ALTER COLUMN "status" SET DEFAULT 'NEW';
