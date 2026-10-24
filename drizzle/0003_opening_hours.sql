ALTER TABLE "tenants" ADD COLUMN "opening_hours" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "status_override" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL;