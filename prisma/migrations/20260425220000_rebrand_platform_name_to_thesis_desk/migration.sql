-- Rebrand: align stored platform name with The Thesis Desk (was Ghost Trading Academy).
UPDATE "SiteConfig"
SET
  "platformName" = 'The Thesis Desk',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'main'
  AND "platformName" = 'Ghost Trading Academy';

-- New rows and schema default should use the updated default.
ALTER TABLE "SiteConfig" ALTER COLUMN "platformName" SET DEFAULT 'The Thesis Desk';
