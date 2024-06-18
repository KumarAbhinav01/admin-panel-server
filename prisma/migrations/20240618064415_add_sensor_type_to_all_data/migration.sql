/*
  Warnings:

  - Added the required column `sensorType` to the `AllData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Step 1: Add the new column with a default value (nullable)
ALTER TABLE "AllData" ADD COLUMN "sensorType" TEXT DEFAULT 'ultrasonic';

-- Step 2: Update existing rows to have the default value
UPDATE "AllData" SET "sensorType" = 'ultrasonic' WHERE "sensorType" IS NULL;

-- Step 3: Make the column non-nullable and drop the default value
ALTER TABLE "AllData" ALTER COLUMN "sensorType" SET NOT NULL;
ALTER TABLE "AllData" ALTER COLUMN "sensorType" DROP DEFAULT;
