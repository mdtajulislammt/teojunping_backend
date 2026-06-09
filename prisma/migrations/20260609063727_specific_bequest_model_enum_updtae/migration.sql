/*
  Warnings:

  - The values [REAL_ESTATE,VEHICLE,JEWELLERY,MONEY,ART] on the enum `item_category` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "item_category_new" AS ENUM ('RESIDENTIAL_PROPERTY', 'COMMERCIAL_PROPERTY', 'LAND_PLOTS', 'CASH_BANK_ACCOUNT', 'STOCKS_SHARES', 'MUTUAL_FUNDS_BONDS', 'RETIREMENT_PENSIONS', 'LIFE_INSURANCE', 'JEWELLERY_PRECIOUS_METALS', 'ART_AND_ANTIQUES', 'COLLECTIBLES', 'VEHICLES', 'ELECTRONICS_GADGETS', 'FURNITURE_HOME_APPLIANCES', 'CLOTHING_ACCESSORIES', 'DIGITAL_ASSETS', 'INTELLECTUAL_PROPERTY', 'BUSINESS_INTEREST_EQUITY', 'PETS_LIVESTOCK', 'MEMORABILIA_SENTIMENTAL', 'OTHER');
ALTER TABLE "specific_bequests" ALTER COLUMN "item_category" TYPE "item_category_new" USING ("item_category"::text::"item_category_new");
ALTER TYPE "item_category" RENAME TO "item_category_old";
ALTER TYPE "item_category_new" RENAME TO "item_category";
DROP TYPE "public"."item_category_old";
COMMIT;
