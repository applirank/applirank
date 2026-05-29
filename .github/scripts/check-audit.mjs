#!/usr/bin/env node
// Evaluates `npm audit --json` output and fails the build only on high/critical
// advisories that are NOT explicitly allowlisted.
//
// Why this exists:
//   1. The project stubs out `@posthog/cli` via an aliased override
//      ("@posthog/cli": "npm:empty-npm-package@1.0.0"). npm 10 (bundled with
//      Node 20) crashes on aliased overrides during audit with
//      "Invalid comparator", so the workflow runs audit with npm 11.
//   2. Some high-severity advisories have no safe upstream fix yet and cannot be
//      patched without breaking changes. Those are documented below and allowed
//      until an upstream release resolves them.
//
// Usage: node check-audit.mjs <path-to-npm-audit-json>

import { readFileSync } from "node:fs";

// Advisories that are known, reviewed, and intentionally allowed because no
// non-breaking fix is available yet. Keep this list short and time-bound.
const ALLOWLIST = [
  {
    url: "https://github.com/advisories/GHSA-34r5-q4jw-r36m",
    package: "samlify",
    reason:
      "Surfaced transitively via @better-auth/sso, which pins samlify '~2.10.2'. " +
      "The patched samlify (>=2.13.0) is outside that range, so forcing it risks " +
      "breaking SAML/SSO. No @better-auth/sso release bumps samlify yet (latest 1.6.11). " +
      "Re-evaluate when @better-auth/sso ships a patched samlify.",
  },
];

const path = process.argv[2];
if (!path) {
  console.error("Usage: check-audit.mjs <audit-json-file>");
  process.exit(2);
}

let report;
try {
  report = JSON.parse(readFileSync(path, "utf8"));
} catch (err) {
  console.error(`Could not read/parse audit JSON at ${path}: ${err.message}`);
  process.exit(2);
}

// npm prints an `error` object when audit itself failed to run (e.g. the
// "Invalid comparator" crash on older npm). Treat that as a hard failure so we
// never silently skip the gate.
if (report.error) {
  console.error(`npm audit failed to run: ${report.error.summary || JSON.stringify(report.error)}`);
  process.exit(2);
}

const allowedUrls = new Set(ALLOWLIST.map((a) => a.url));
const vulns = report.vulnerabilities || {};

// Collect concrete advisory objects (high/critical) from every vulnerability's
// `via` chain. Transitive-only entries (whose `via` is just a package name)
// carry no advisory object and are covered once their root advisory is allowed.
const advisories = new Map(); // url -> { url, title, severity }
for (const vuln of Object.values(vulns)) {
  for (const via of vuln.via || []) {
    if (typeof via !== "object") continue;
    if (via.severity !== "high" && via.severity !== "critical") continue;
    if (via.url) advisories.set(via.url, { url: via.url, title: via.title, severity: via.severity });
  }
}

const blocking = [];
const allowed = [];
for (const adv of advisories.values()) {
  (allowedUrls.has(adv.url) ? allowed : blocking).push(adv);
}

if (allowed.length) {
  console.log("Allowlisted high/critical advisories (not blocking):");
  for (const a of allowed) console.log(`  - [${a.severity}] ${a.title} (${a.url})`);
}

if (blocking.length) {
  console.error("\nBlocking high/critical advisories:");
  for (const a of blocking) console.error(`  - [${a.severity}] ${a.title} (${a.url})`);
  console.error(
    "\nResolve these (bump/override the affected package) or, if there is no safe fix, " +
      "add the advisory to the ALLOWLIST in .github/scripts/check-audit.mjs with justification.",
  );
  process.exit(1);
}

console.log(`\nNo blocking high/critical advisories (${allowed.length} allowlisted).`);
process.exit(0);
