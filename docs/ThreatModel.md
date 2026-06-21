## Data Flow Diagram

I've mapped out YBase's security architecture using a Level 1 Data Flow Diagram to visualize how data moves through the system and where the critical trust boundaries are between services.

**What are trust boundaries?**
Trust boundaries highlight the points where data crosses between zones with different security levels. When data moves across these boundaries, it needs protection in form of validating and authenticating the data before it enters zones with a higher trust, and encrypting before going out to less trusted areas.

### Our Trust Zones

I've organized YBase into five security zones, each with different trust levels and protection mechanisms.

**Public Zone (Untrusted)**

User browsers and devices are here as I can't control if the device is compromised. I therefore treat all input as potentially hostile and validate everything before it enters the system.

**External/Third party Services (Untrusted)**

Google OAuth, Stripe, Resend, and Posthog are trusted partners, but I can't control their closed source code. I protect these integrations with API key protection, webhook signature verification, and TLS encryption.

**Frontend Zone (Semi-Trusted)**

My Next.js application runs on Vercel (Deployment infrastructure) and in user browsers. It's my code, but in environments I don't fully control. I therefore enforce client side validation, Content Security Policy headers, and HTTPS to keep things secure.

**Backend Zone (Trusted)**

The Convex backend is where our business logic (queries & mutations) lives in a fully controlled environment. Every request goes through authentication and authorization checks (role based and organization scoped).

**Data Zone (Most Trusted)**

The database is the single source of truth and gets the highest level of protection. Organization scoped queries, type-safe operations and logging in Convex keep it secure.

![Data Flow Diagram](/docs/Data%20Flow%20Diagram.png)
_(Diagram was created in FigJam)_

## Trust Boundary Analysis using STRIDE

I analyzed each trust boundary using the **STRIDE** framework, which was developed by Microsoft to identify YBase's security strengths and weaknesses.

- **Spoofing:** Pretending to be someone else → Fake login, forged webhook (mitigated through OAuth, JWT verification, webhook signatures)
- **Tampering:** Unauthorized data modification → Changing transaction amounts (Input validation, type-safe queries, digital signatures)
- o**Repudiation:** Denying you did something → "I didn't delete that project" (Audit logs with user ID and timestamps)
- **Information Disclosure:** Leaking sensitive data → Other org's data exposed, API keys in logs (Encryption, organization scoping, secrets management)
- **Denial of Service:** Making system unavailable → DDoS attack, resource exhaustion → Rate limiting, CDN protection
- **Elevation of Privilege:** Gaining unauthorized permissions → Member accessing admin functions (Role checks on every request (requireRole())

#### User <-> Frontend (NextJS)

| **Category**                 | **User**                          |                | **Frontend (NextJS)**                                                                   |                            |
| ---------------------------- | --------------------------------- | -------------- | --------------------------------------------------------------------------------------- | -------------------------- |
|                              | **Strengths**                     | **Weaknesses** | **Strengths**                                                                           | **Weaknesses**             |
| **Spoofing**                 | OAuth using Google (no passwords) |                | HTTPS/TLS enforced, Auth check with redirect to login or dashboard in protected layout  |                            |
| **Tampering**                |                                   |                | CSP headers configured (to tell browser which resources to load to prevent XSS attacks) |                            |
| **Repudiation**              |                                   |                | Audit logs track user actions per organization (`convex/logs`)                          |                            |
| **Information Disclosure**   |                                   |                | HTTPOnly cookies for sessions                                                           |                            |
| **Denial of Service**        |                                   |                |                                                                                         | No bot protection on login |
| **Escalation of Privileges** |                                   |                | Role-based UI rendering using `useIsAdmin()`, AccessDenied UI                           |                            |

#### Frontend (NextJS) <-> Backend (Convex)

| **Category**                 | **Frontend (NextJS)**        |                | **Backend (Convex)**                              |                                                      |
| ---------------------------- | ---------------------------- | -------------- | ------------------------------------------------- | ---------------------------------------------------- |
|                              | **Strengths**                | **Weaknesses** | **Strengths**                                     | **Weaknesses**                                       |
| **Spoofing**                 | JWT tokens using Convex Auth |                | JWT validation automatic                          |                                                      |
| **Tampering**                |                              |                | Convex validators on all inputs                   |                                                      |
| **Repudiation**              |                              | No request IDs | Audit logs for key actions (reimbursements, etc.) |                                                      |
| **Information Disclosure**   | HTTPS/TLS enforced           |                | Encrypted responses                               |
| **Denial of Service**        |                              |                | Rate limiting of queries/ mutations built-in      |                                                      |
| **Escalation of Privileges** | JWT based auth               |                | Role based access control using `requireRole()`   | Permissions re-checked on every request (no caching) |

#### Backend (Convex) <-> Database

| **Category**                 | **Backend (Convex)**                                                  |                | **Database (Convex Cloud)** |                |
| ---------------------------- | --------------------------------------------------------------------- | -------------- | --------------------------- | -------------- |
|                              | **Strengths**                                                         | **Weaknesses** | **Strengths**               | **Weaknesses** |
| **Spoofing**                 |                                                                       |                | Convex Auth                 |                |
| **Tampering**                | Type safe queries (to prevent NoSQL injections)                       |                |                             |                |
| **Repudiation**              | Audit logs stored per organization                                    |                |                             |                |
| **Information Disclosure**   |                                                                       |                | Encryption of database      |                |
| **Denial of Service**        |                                                                       |                | Convex managed optimization |                |
| **Escalation of Privileges** | Organization scoped queries by checking for organizationId in queries |                |                             |                |

#### Backend (Convex) <-> Stripe

| **Category**                 | **Backend (Convex)**                   |                                 | **Stripe Payments**                                        |                |
| ---------------------------- | -------------------------------------- | ------------------------------- | ---------------------------------------------------------- | -------------- |
|                              | **Strengths**                          | **Weaknesses**                  | **Strengths**                                              | **Weaknesses** |
| **Spoofing**                 | API keys saved on Convex cloud backend | Keys in environment variables   | Stripe webhook signature verification using webhook secret |                |
| **Tampering**                | Webhook validation                     |                                 | Signed webhooks                                            |                |
| **Repudiation**              |                                        | No webhook verification logs    |                                                            |                |
| **Information Disclosure**   |                                        | API keys could be in error logs | PCI DSS compliant (payment security standard)              |                |
| **Denial of Service**        |                                        | No explicit retry limits        | Stripe rate limits                                         |                |
| **Escalation of Privileges** | Scoped API keys                        |                                 | Restricted API access                                      |                |

#### Backend (Convex) <-> Google OAuth

| **Category**                 | **Backend (Convex)**                  |                                       | **Google OAuth**             |                |
| ---------------------------- | ------------------------------------- | ------------------------------------- | ---------------------------- | -------------- |
|                              | **Strengths**                         | **Weaknesses**                        | **Strengths**                | **Weaknesses** |
| **Spoofing**                 | OAuth 2.0 handled through Convex Auth | No visible state parameter validation | Google identity verification |                |
| **Tampering**                | Automatic token validation            |                                       | Signed tokens                |                |
| **Repudiation**              |                                       | No failed attempt tracking            |                              |                |
| **Information Disclosure**   | HTTPS/TLS                             |                                       | Minimal user data exposure   |                |
| **Denial of Service**        |                                       |                                       | Google rate limits           |                |
| **Escalation of Privileges** |                                       |                                       | Token expiration managed     |                |

**Security issues I fixed while doing the STRIDE Analysis**
(and therefore aren't in weaknesses column anymore):

- implemented CSP header to prevent cross site scripting attacks
- limited CSV upload to only upload CSV files (confirmed that React & Papa Parse Library limit scripting )
- implemented organization based access control
- added audit logging for key operations (reimbursements, etc.)

## Architecture & Dependencies

- **Frontend**: Next.js 15 (server and client components for security, XSS protection)
- **Backend**: Convex (handles database encryption, queries/mutations and infrastructure)
- **Authentication**: Google OAuth 2.0 user verification implemented with Convex Auth → no passwords stored
  → Convex Auth also handles session management, JWT tokens, HTTPOnly cookies
- **Payment**: Stripe (handles payment compliance)
- **Email**: Resend (for user invitations, API keys stored server-side)
- **Deployment**: Vercel (CDN security, DDoS protection, TLS 1.3 enforcement ) + Convex Cloud (at rest encryption and managed backups)

This analysis focuses on what I can control at the application level. I'm explicitly not covering:

- **Physical security:** As data center security is handled by cloud providers
- **Cloud provider internals:** I trust Convex, Vercel, and Stripe to secure their infrastructure
- **End-user devices:** I can't control if someone's laptop has malware or their browser is outdated
- **Network infrastructure:** ISP security, routing, and network-level DDoS are outside my control
