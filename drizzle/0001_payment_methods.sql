CREATE TYPE "public"."payment_method" AS ENUM('online', 'cash', 'card_on_delivery', 'pix_on_delivery');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" "payment_method" DEFAULT 'online' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "change_for_cents" integer;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "accepts_cash" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "accepts_card_on_delivery" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "accepts_pix_on_delivery" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "accepts_online" boolean DEFAULT false NOT NULL;