# npm dependency security remediation — 2026-09-15

Issue: #5

## Findings

The baseline audit reported six vulnerable package entries: two moderate and four high. Production-only audit reported two high entries, both caused by the transitive `sharp < 0.35.4` advisory surfaced through Next.js.

The remaining findings were development/tooling dependencies: Vitest / `@vitest/mocker`, `brace-expansion`, and `js-yaml`.

## Remediation

- Bumped the existing `sharp` override from `0.35.3` to `0.35.4`.
- Upgraded Vitest from the 3.x line to `5.0.0` to clear GHSA-82fw-gwwq-j7x9.
- Migrated the Vitest JSX transform setting from deprecated Vite `esbuild.jsx` to Vite 8 `oxc.jsx.runtime = "automatic"`.
- Ran non-forced `npm audit fix` to refresh vulnerable transitive dependencies in the lockfile.
- Did not use `npm audit fix --force`.

## Verification

The remediation workspace passed:

- `npm audit --audit-level=moderate` → 0 vulnerabilities
- `npm audit --omit=dev --audit-level=moderate` → 0 vulnerabilities
- Prettier
- TypeScript typecheck
- ESLint
- full Vitest suite
- Next.js production build

After restoring the normal repository CI workflow, the standard Quality Gates also passed on the committed remediation branch.

No Vercel Preview or Production deployment is part of this change.
