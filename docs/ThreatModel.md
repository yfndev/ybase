# Threat model

## Trust boundaries

```text
Browser
  |
  v
Coolify reverse proxy / TLS on Hetzner
  |
  v
YBase Next.js container
  |-- MongoDB
  |-- Hetzner Object Storage
  |-- Google OAuth
  |-- Brevo
  `-- PostHog
```

Browser input and all external service responses are untrusted. Authentication,
role checks, organization scoping and input validation are enforced inside the
Next.js server before data reaches MongoDB or object storage.

## Principal risks and controls

| Risk                                   | Primary controls                                                  |
| -------------------------------------- | ----------------------------------------------------------------- |
| Account impersonation                  | Google OAuth, signed sessions, HTTP-only cookies                  |
| Cross-organization access              | Server-side `organizationId` scoping and role checks              |
| Manipulated form or API input          | Zod validation and server-side authorization                      |
| Unauthorized file access               | Generated object keys and short-lived signed URLs                 |
| Accidental email delivery from staging | `SERVICE_STAGE` plus recipient allowlist                          |
| Secret disclosure                      | Coolify-managed environment variables and ignored local env files |
| Untraceable financial changes          | Organization-scoped audit logs                                    |

## Infrastructure assumptions

YBase relies on Hetzner for physical infrastructure and network availability,
and on Coolify for container deployment and TLS configuration. Google, Brevo
and PostHog remain external processors with their own trust boundaries.
