# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YBase is an open-source budget management application for German non-profit associations. It provides budget tracking, reimbursement workflows, and CSV import from German banks (Sparkasse, Volksbank, Moss).

## Commands

```bash
pnpm dev                     # Start Next.js dev server with turbopack
pnpm dev:stripe              # Dev with Stripe webhooks + Convex backend
pnpm build                   # Production build
pnpm lint                    # Biome linting with auto-fix
pnpm format                  # Prettier formatting
pnpm test                    # Run all tests (Vitest + Playwright)
pnpm vitest run              # Unit/integration tests only
pnpm vitest run --coverage   # Tests with coverage report
pnpm exec playwright test    # E2E tests only
```

**Run a single test file:**
```bash
pnpm vitest run convex/projects/queries.test.ts
pnpm exec playwright test e2e/createTransactionAndProject.spec.ts
```

## Architecture

**Tech Stack:** Next.js 16 (App Router) + Convex (real-time serverless backend) + TypeScript + Tailwind CSS + shadcn/ui

**Route Structure:**
- `app/(protected)/` - Authenticated routes (dashboard, projects, transactions, reimbursements)
- `app/(public)/` - Public routes (login, shareable forms)

**Backend (Convex):**
- `convex/schema.ts` - Database schema definition
- Each feature has its own directory: `convex/{feature}/queries.ts`, `functions.ts`, `*.test.ts`
- All queries are scoped by `organizationId` for multi-tenant data isolation

**Path Aliases:**
- `@/` → `app/`
- `@/convex/` → `convex/`

## Key Domain Concepts

**Transaction Status:**
- `processed` - Bank transactions that count toward project balance
- `expected` - Planned transactions that do NOT count toward balance

**Transaction Types:**
- Regular transactions (imported or manual)
- Split transactions (`splitFromTransactionId`) - income split across projects, counted as processed
- Transfer transactions (`transferId`) - internal budget moves, counted toward balance

**Tax Spheres (German non-profit categories):**
- `non-profit` (Ideeller Bereich)
- `asset-management` (Vermögensverwaltung)
- `purpose-operations` (Zweckbetrieb)
- `commercial-operations` (Wirtschaftlicher Geschäftsbetrieb)

**User Roles:** `admin`, `lead`, `member`

## Testing

- **Vitest** for unit/integration tests (`convex/**/*.test.ts`, `app/**/*.test.ts`)
- **Playwright** for E2E tests (`e2e/*.spec.ts`)
- Convex tests use `convex-test` with edge-runtime environment
- Test helpers in `convex/test.setup.ts`

## Documentation

- `docs/schema.md` - Database ER diagram
- `docs/Security.md` - Security implementation
- `docs/ThreatModel.md` - Threat analysis
- `docs/exampleTransactions.csv` - Test data for CSV import

## Code Style

**Before making any changes:** Do not make changes until you have 95% confidence that you know what to build. Ask follow-up questions until you have that confidence.

**Priority order when working on code:**
1. Fix all errors first
2. Simplify components as much as possible
3. Remove unnecessary code

**Principles:**
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- Remove code, don't add code
- No nested code blocks
- No complex syntax
- Flat is better than nested

**Naming:**
- No single-letter variable names except:
  - `e` for events
  - `q` for queries
  - `t` for test contexts

**Readability:**
- Write code that reads like plain English
- Early returns over nested conditionals
- Extract complex conditions into named variables
- Prefer simple loops over chained array methods when clearer

## Git Commits

- NEVER add Co-Authored-By lines
- NEVER add Claude as co-author
- Keep commit messages short and natural language
- Examples: "added new index for transaction query", "fixed user permissions bug", "removed unused imports"
