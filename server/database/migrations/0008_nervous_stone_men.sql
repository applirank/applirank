ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "require_resume" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "require_cover_letter" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "member_user_org_unique_idx" ON "member" USING btree ("user_id","organization_id");