# Security

We take security seriously at YBase. Here's how we protect your financial data.

## Authentication & Authorization

**OAuth instead of Password**

- OAuth 2.0 with Google eliminates password vulnerabilities
- Implemented with [Convex Auth](https://labs.convex.dev/auth) in `convex/auth.ts`

**Organizational Isolation**

- Every query is filtered by `organizationId`
- Organizations can only access their own data

**Role-Based Access Control**

- `member` submits and views their own reimbursements; `finance` manages organization-wide submissions; `admin` has full control
- `requireRole()` validates finance and admin actions in `app/lib/auth/session.ts`

## Data Protection

**Credentials & Secrets**

- All secrets stored server-side in Convex Dashboard
- Client never receives API keys

**Encryption**

- HTTPS/TLS enforced by Convex and Vercel
- Database encrypted at rest on Convex Cloud

**JWT Security**

- Tokens signed with private keys
- HTTPOnly cookies with SameSite=Strict

## API Security

**Input Validation**

- Every function argument validated with Convex validators

**Type-Safe Queries**

- Prevents NoSQL injection attacks

**Internal Functions**

- Sensitive operations use `internalMutation`/`internalQuery`

## Third Party Integrations

**Stripe**

- Webhook signature verification
- No credit card data stored

## Attack Prevention

**XSS**

- CSP headers configured
- React escapes user input

**Rate Limiting**

- Built into Convex

**Infrastructure**

- Vercel: HTTPS, DDoS protection, CDN
- Convex Cloud: managed security patches, encrypted backups

## Threat Model

For STRIDE analysis and data flow diagrams, see [ThreatModel.md](ThreatModel.md).

## Report an Issue

Email info@youngfounders.network with security concerns.
