# YBase

> Free, open-source budget management for German non-profit associations.

YBase helps German (non-profit) associations manage their budgets when Excel gets too complicated.

## Free for Associations
We believe every association deserves proper budget tools. That's why we cover all hosting and server costs—so you can use YBase at no charge. No hidden fees, no premium tiers, just free budget management for the nonprofit community.

 [Young Founders Network e.V.](https://youngfounders.network) provides YBase **completely free** for other associations. We cover all server costs so you don't have to.

**The problem?**
Most budget tools are too expensive or too complex for associations. Excel is flexible but keeping track of all expenses is plenty of work.

**Our solution?**
Simple, free, intuitive budget and reimbursement tracking for non-profits.


## Features

- **Dashboard & Charts:** Visualize cashflow with income, expenses, and balance trends
- **Transaction Import:** Import CSV from Sparkasse, Volksbank, & Moss
- **Budget Transfers:** Move budgets between projects when plans change
- **Project Organization:** Assign expenses to projects, see remaining budgets
- **Reimbursements:** Submit expense and travel reimbursements with receipt uploads
- **Volunteer Allowance:** "Ehrenamtspauschale" forms with shareable links for external signatures
- **AI Assistant:** Chat with your budget data (admin/finance only)
- **Team Management:** Organize members into teams with project access control
- **Donor Export:** Export transactions by donor to CSV
- **Email Invitations:** Invite team members via email (powered by Resend)
- **Guided Onboarding:** Interactive tour for new users
- **Audit Logs:** Track all actions for transparency and compliance

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Convex](https://img.shields.io/badge/Convex-FF6F00?style=for-the-badge&logo=convex&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)

## Architecture

YBase uses Next.js App Router with protected and public routes:

- `app/(public)/` → Login and public pages
- `app/(protected)/` → Authenticated dashboard with sidebar navigation

Data flows through Convex for real-time sync. Every query is scoped by `organizationId` for data isolation.

**[Database Schema](docs/schema.md)** - Full ER diagram with all tables and relationships

### Money handling logic 💸

Transactions are categorized by status for budget calculations:

- **Processed**: Imported bank transactions that count towards project balance (Kontostand).
- **Expected**: Planned transactions that do NOT count towards balance and are shown separately as expected income/expenses.
- **Split**: Portions of income split across projects which are treated as processed and therefore count towards balance.
- **Transfer**: Internal budget moves between projects and also count towards balance.

## Self-Hosting

**Prerequisites:** Node.js 20+, pnpm, [Convex account](https://www.convex.dev/)

### 1. Clone & Install

```bash
git clone https://github.com/joelheile/ybase.git
cd ybase
pnpm install
npx convex dev  # Creates .env.local with CONVEX_DEPLOYMENT and NEXT_PUBLIC_CONVEX_URL
```

### 2. Initialize Auth

```bash
npx @convex-dev/auth
```

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://<your-convex-deployment>.convex.site/api/auth/callback/google`
4. Copy Client ID and Client Secret

### 4. Configure Environment Variables

Set in Convex Dashboard → Settings → Environment Variables or via CLI:

```bash
npx convex env set AUTH_GOOGLE_ID "your-google-client-id"
npx convex env set AUTH_GOOGLE_SECRET "your-google-client-secret"

# Optional
npx convex env set OPENAI_API_KEY "sk_proj_..."
npx convex env set RESEND_API_KEY "re_..."
```

### 5. Run

```bash
pnpm dev
```

Test CSV functionality with the [example file](docs/exampleTransactions.csv).

### 6. Deploy

```bash
npx convex deploy
npx vercel
```

Update `SITE_URL` to your production URL after deploying.

## Keyboard Shortcuts

| Shortcut | Action         |
| -------- | -------------- |
| `⌘ + B`  | Hide sidebar   |
| `⌘ + E`  | Plan expense   |
| `⌘ + I`  | Plan income    |
| `⌘ + P`  | Create project |
| `⌘ + D`  | Add donor      |

## Contributing

We're building a tool to support NGOs by making budgeting as easy as possible.

1. Fork the repo
2. Clone your fork locally
3. Create a feature branch (`git checkout -b feat/amazing-feature`)
4. Make and commit your changes
5. Push to your fork (`git push origin feat/amazing-feature`)
6. Open a Pull Request

**Ideas, feedback, or questions?**
[info@youngfounders.network](mailto:info@youngfounders.network) | [Open an issue](https://github.com/joelheile/ybase/issues)

## Testing

100% test coverage on lines and functions, ~96% on branches for unit and integration tests.

```bash
pnpm vitest run              # Unit & integration tests
pnpm vitest run --coverage   # Test coverage report
pnpm exec playwright test    # E2E tests
```

GitHub Actions runs both test suites on every push and PR.

---

<sub>Originally developed by [Joël Heil Escobar](https://www.linkedin.com/in/joel-heil-escobar) as a [CODE University](https://code.berlin/) Capstone project.</sub>

Built with ❤️ in Berlin
