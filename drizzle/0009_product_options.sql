ALTER TABLE "order_items" ADD COLUMN "details" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "options" jsonb DEFAULT '{"sizes":[],"maxFlavors":1,"groups":[]}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "half_pricing" text DEFAULT 'highest' NOT NULL;