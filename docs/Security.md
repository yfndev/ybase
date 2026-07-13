# Security

YBase processes financial and reimbursement data. The application therefore
keeps authentication, authorization and organization isolation on the server.

## Runtime architecture

- The Next.js application runs as a standalone Docker container deployed by
  Coolify on Hetzner infrastructure.
- MongoDB is the primary database.
- Files and signatures are stored in S3-compatible Hetzner Object Storage.
- Coolify manages production environment variables and TLS termination.
- Google OAuth provides authentication through Auth.js.
- Brevo sends transactional email; PostHog provides product analytics.

## Application controls

- Every protected operation requires an authenticated user.
- Database access is scoped by `organizationId`.
- Roles distinguish members, finance users and administrators.
- Server-side Zod validation protects action and API inputs.
- Uploaded objects use generated keys and time-limited download URLs.
- Audit logs record important organization and reimbursement actions.
- Security headers deny framing, disable MIME sniffing and restrict referrer
  information.

## Secrets and deployment

- Credentials belong exclusively in Coolify environment variables.
- `.env` and `.env.local` are ignored by Git.
- Production email requires `SERVICE_STAGE=production`; non-production email is
  restricted by `BREVO_RECIPIENT_ALLOWLIST`.
- The application container runs as an unprivileged user.

## Reporting issues

Report security concerns to info@youngfounders.network.
