-- Migration 0029: Onboarding Checklist
-- Adds org_onboarding table to persist the dismissal state per organization.
-- All step completion is derived at query-time from domain tables.

CREATE TABLE "org_onboarding" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"dismissed" boolean DEFAULT false NOT NULL,
	"dismissed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "org_onboarding" ADD CONSTRAINT "org_onboarding_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "org_onboarding_organization_id_idx" ON "org_onboarding" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_onboarding_organization_id_unique" ON "org_onboarding" USING btree ("organization_id");
