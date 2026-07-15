# CLAUDE.md

This file provides guidance to coding agents working with this repository.

## Project Overview

YBase is an open-source budget management application for German non-profit associations. It provides budget tracking, reimbursement workflows, and CSV import from German banks (Sparkasse, Volksbank, Moss).

## Commands

```bash
pnpm dev                     # Start Next.js dev server with turbopack
pnpm build                   # Production build
pnpm lint                    # Biome linting
pnpm lint:fix                # Biome linting with auto-fix
pnpm format                  # Prettier formatting
pnpm test                    # Unit/integration tests (Vitest)
pnpm test:e2e                # E2E tests (Playwright)
pnpm test:all                # Run Vitest and Playwright
pnpm coverage                # Tests with coverage report
```

**Run a single test file:**
```bash
pnpm vitest run app/lib/server/projects/projects.test.ts
pnpm exec playwright test e2e/reimbursements.spec.ts
```

## Architecture

**Tech Stack:** Next.js 16 (App Router) + MongoDB + Auth.js + TypeScript + Tailwind CSS + shadcn/ui

**Route Structure:**
- `app/(protected)/` - Authenticated routes (dashboard, projects, transactions, reimbursements)
- `app/(public)/` - Public routes (login, shareable forms)

**Backend:**
- `app/lib/db/` - MongoDB client, collections, indexes, and shared database types
- `app/lib/server/` - Server-only data access and domain actions grouped by feature
- `app/lib/auth/` - Auth.js configuration and authorization helpers
- Protected reads and writes are scoped by `organizationId` for multi-tenant data isolation

**Path Alias:** `@/` → `app/`

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

**User Roles:** `admin`, `finance`, `people_culture`, `member`

## Testing

- Use Vitest for unit/integration tests and Playwright for E2E flows; MongoDB integration tests use `mongodb-memory-server`
- Add tests for meaningful observable behavior, concrete regressions, and high-risk boundaries such as money, permissions, tenant isolation, destructive actions, and external integrations
- Do not add tests merely because code changed; skip styling, copy, trivial wiring, implementation details, and refactors without behavior changes
- Test at the lowest stable layer without duplicating coverage, and run the narrowest relevant test locally

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
