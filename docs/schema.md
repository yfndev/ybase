# Database schema

MongoDB stores the following application collections. Every business entity is
scoped through its `organizationId` or through a parent entity carrying that
scope.

```mermaid
erDiagram
    organizations ||--o{ users : has
    organizations ||--o{ projects : has
    organizations ||--o{ reimbursements : has
    organizations ||--o{ volunteerAllowance : has
    organizations ||--o{ logs : has
    organizations ||--o{ applications : has
    jobPostings ||--o{ applications : receives
    organizations ||--o| jobFeedTokens : authenticates
    organizations ||--o{ reimbursementInvites : grants
    reimbursements ||--o{ receipts : has
    reimbursements ||--o| travelDetails : has

    organizations {
        string _id
        string name
        string domain
        string accountingEmail
        string createdBy
    }

    jobFeedTokens {
        string _id
        string organizationId
        string tokenHash
        number rotatedAt
        string rotatedBy
    }

    reimbursementInvites {
        string _id
        string organizationId
        string tokenHash
    }

    users {
        string _id
        string organizationId
        string email
        string role
    }

    projects {
        string _id
        string organizationId
        string name
        boolean isArchived
    }

    reimbursements {
        string _id
        string organizationId
        string projectId
        string createdBy
        number amount
        string type
        string status
    }

    receipts {
        string _id
        string reimbursementId
        string fileStorageId
        number grossAmount
    }

    travelDetails {
        string _id
        string reimbursementId
        string startDate
        string endDate
        string destination
    }

    volunteerAllowance {
        string _id
        string organizationId
        string projectId
        string createdBy
        number amount
        string status
    }

    signatureTokens {
        string _id
        string organizationId
        string createdBy
        string token
        number expiresAt
    }

    applications {
        string _id
        string organizationId
        string jobPostingId
        string applicantEmail
        string status
        array files
    }

    logs {
        string _id
        string organizationId
        string userId
        string action
        string entityId
    }
```

Application files are embedded in the application snapshot so the application
and its initial per-file import status are stored atomically. Source URLs remain
server-only. Imported objects use deterministic storage keys; each file records
its status, attempt count, error and final object key.

The authoritative field definitions live in
[`app/lib/db/types.ts`](../app/lib/db/types.ts), while indexes are defined in
[`app/lib/db/indexes.ts`](../app/lib/db/indexes.ts).
