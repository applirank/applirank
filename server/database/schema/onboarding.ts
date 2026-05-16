import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { organization } from './auth'

/**
 * Per-organization onboarding state.
 *
 * All step *completion* is derived in real-time from domain tables (jobs,
 * candidates, applications, members, aiConfigs).  This table only stores the
 * dismissal intent so we don't re-show the checklist once the user hides it.
 */
export const orgOnboarding = pgTable('org_onboarding', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  dismissed: boolean('dismissed').notNull().default(false),
  dismissedAt: timestamp('dismissed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ([
  index('org_onboarding_organization_id_idx').on(t.organizationId),
  uniqueIndex('org_onboarding_organization_id_unique').on(t.organizationId),
]))
