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
    reimbursements ||--o{ receipts : has
    reimbursements ||--o| travelDetails : has

    organizations {
        string _id
        string name
        string domain
        string accountingEmail
        string createdBy
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

    logs {
        string _id
        string organizationId
        string userId
        string action
        string entityId
    }
```

The authoritative field definitions live in
[`app/lib/db/types.ts`](../app/lib/db/types.ts), while indexes are defined in
[`app/lib/db/indexes.ts`](../app/lib/db/indexes.ts).
