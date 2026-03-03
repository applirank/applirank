/**
 * ─────────────────────────────────────────────
 * Centralized Access Control — single source of truth
 * ─────────────────────────────────────────────
 *
 * This file defines EVERY permission in the system.  It is imported by
 * both the server (auth.ts) and the client (auth-client.ts) so roles
 * and statements are always in sync.
 *
 * Design principles:
 *   • Deny by default — if a permission isn't listed here, it's denied.
 *   • Three built-in roles only (owner / admin / member) — no custom ones.
 *   • Import from `better-auth/plugins/access` to keep bundle small.
 *   • Merge with `defaultStatements` so Better Auth's own org/member/invitation
 *     permissions are preserved alongside our ATS-specific ones.
 */

import { createAccessControl } from 'better-auth/plugins/access'
import {
  defaultStatements,
  adminAc,
  memberAc,
  ownerAc,
} from 'better-auth/plugins/organization/access'

// ─── ATS-specific resource → action map ────────────────────────────
// Every resource the app manages is declared here with its allowed actions.
// `as const` is mandatory for TypeScript inference.

const atsStatements = {
  job: ['create', 'read', 'update', 'delete'],
  candidate: ['create', 'read', 'update', 'delete'],
  application: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'delete'],
  comment: ['create', 'read', 'update', 'delete'],
  activityLog: ['read'],
} as const

// ─── Merged statement (Better Auth defaults + ATS resources) ───────
export const statements = {
  ...defaultStatements,
  ...atsStatements,
} as const

// ─── Access Controller ─────────────────────────────────────────────
export const ac = createAccessControl(statements)

// ─── Role definitions ──────────────────────────────────────────────
//
// owner   — org creator.  EVERYTHING including delete org / manage billing.
// admin   — hiring managers.  Full CRUD on ATS resources + invite members.
// member  — recruiters.  Read jobs, manage candidates/applications in pipeline.

export const owner = ac.newRole({
  // Inherit all default owner permissions (org:*, member:*, invitation:*)
  ...ownerAc.statements,
  // ATS permissions — full control
  job: ['create', 'read', 'update', 'delete'],
  candidate: ['create', 'read', 'update', 'delete'],
  application: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'delete'],
  comment: ['create', 'read', 'update', 'delete'],
  activityLog: ['read'],
})

export const admin = ac.newRole({
  // Inherit default admin permissions (no org:delete, no owner transfer)
  ...adminAc.statements,
  // ATS permissions — full CRUD
  job: ['create', 'read', 'update', 'delete'],
  candidate: ['create', 'read', 'update', 'delete'],
  application: ['create', 'read', 'update', 'delete'],
  document: ['create', 'read', 'delete'],
  comment: ['create', 'read', 'update', 'delete'],
  activityLog: ['read'],
})

export const member = ac.newRole({
  // Inherit default member permissions (read-only on org data)
  ...memberAc.statements,
  // ATS permissions — read jobs, manage own pipeline
  job: ['read'],
  candidate: ['create', 'read', 'update'],
  application: ['create', 'read', 'update'],
  document: ['create', 'read'],
  comment: ['create', 'read', 'delete'],
  activityLog: ['read'],
})
