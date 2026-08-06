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
    organizations ||--o{ memberships : has
    applications ||--o| memberships : admits
    users ||--o{ memberships : holds
    memberships ||--o{ membershipCases : has
    memberships ||--o{ documentExecutions : requires
    documentVersions ||--o{ documentExecutions : executed_as
    memberships ||--o{ membershipEvents : records
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
        string privateEmail
        string phone
        string memberPlatformUserId
        number memberPlatformSyncedAt
        string googleWorkspaceUserId
        string role
        string teamId
        string secondaryTeamId
        boolean isTeamLead
        boolean isSecondaryTeamLead
        object boardMembership "departmentId, isChair"
        string applicationId
        string membershipId
        string memberStatus
        string teamOnboardingStatus
        number offboardingPlannedAt
        number offboardingStartedAt
        number archivedAt
        number excludedAt
        array memberInfractions "_id, reason, createdAt, createdBy"
    }

    memberships {
        string _id
        string organizationId
        string userId
        string applicationId
        string membershipNumber
        boolean isCurrent
        string legalStatus
        number admittedAt
        string memberPlatformUserId
        string dateOfBirth
        string privateEmail
        number scheduledEndAt
        string scheduledEndReason
        number endedAt
        string endReason
        array handoverTasks
    }

    membershipCases {
        string _id
        string organizationId
        string membershipId
        string type
        string status
        string reason
        string decision "excluded or dismissed"
        number decidedAt
        object decisionDelivery
        number objectionExpiresAt
        number objectedAt
        string objectionText
        string objectionOutcome "confirmed or overturned"
        number objectionDecidedAt
    }

    documentVersions {
        string _id
        string organizationId
        string kind
        string versionLabel
        string contentStorageKey "sanitized HTML in object storage"
        string sha256 "hash of the document text"
        array targetTeamIds
        array targetDepartmentIds
    }

    documentExecutions {
        string _id
        string documentVersionId
        string membershipId
        string userId
        string documentHash
        string status
        number completedAt
    }

    membershipEvents {
        string _id
        string organizationId
        string membershipId
        string caseId
        string type
        number occurredAt
        string actorType
        string idempotencyKey
    }

    teams {
        string _id
        string organizationId
        string departmentId
        string name
        boolean isChapter
        boolean isArchived
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
        string applicantPhone
        string status
        array ownerIds
        string yfnEmailNormalized
        string workspaceUserId
        string workspaceProvisioningStatus
        number workspaceProvisionedAt
        string dateOfBirth
        string memberPlatformUserId
        number memberPlatformSyncedAt
        object guardianConsent
        object admissionDecision "result, decidedAt, decidedBy, authority, recordedAt, recordedBy"
        object rejectionDelivery
        number appealExpiresAt
        object appealDecision "result, decidedAt, recordedAt, recordedBy, evidenceStorageKey"
        string onboardingUserId
        number onboardingLinkedAt
        number onboardingCompletedAt
        string onboardingCompletedBy
        number cleanupEligibleAt
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

Accepted applications hold the normalized YFN email and Google Workspace
provisioning state. The same application also records the formal admission
decision, any required guardian consent, rejection delivery and appeal. This
keeps the pre-membership procedure in the existing recruiting record instead of
creating a second application model. No temporary password is persisted. The
first matching Google login links the application to the onboarding user,
copies team and position from the job posting, and sets `cleanupEligibleAt` for
the retention workflow. Link conflicts stay on the application for correction
by P&C.

For new ordinary YFN members, `memberships` is the legal source of truth.
A membership is created at the recorded admission time and contains the durable
admission evidence and required guardian consent. Details about who made and
recorded the decision remain on the application and in its history instead of
being duplicated on the membership.
Onboarding then uses the existing `users.memberStatus`: `onboarding` while the
member confirms personal data and completes required acknowledgements, then
`active`. Before admission, YBase resolves exactly one active member-platform
profile primarily from the applicant name. The private application email only
disambiguates people with the same name and remains a fallback for applications
without a usable name. YBase stores the profile's external ID, birth-date
snapshot and sync time on the application; the birth date is not a search
criterion and is not collected again in YBase. A missing or ambiguous profile
blocks admission; a free global profile search is not exposed. The accepted
onboarding user inherits the confirmed external ID. All document executions
reference the membership directly. Individual tasks determine progress without
introducing a second aggregate operational status. Current board authorization
continues to use `users.boardMembership`; there is no parallel mandate
collection. The internal `memberships.legalStatus` supports legal workflows but
is not displayed as a parallel lifecycle:

The existing YBase profile linker remains available only to legacy users
without `membershipId` and exposes at most one unambiguous suggestion. Once a
membership is managed in YBase, login refreshes no longer overwrite its private
contact data from the member platform.

- `active`: membership continues without a pending legal termination.
- `resigning`: a resignation was received and the membership continues until
  `scheduledEndAt`; it is not awaiting approval.
- `suspended`: the exclusion decision was delivered and all membership rights
  are suspended during the internal remedy process under § 5.4.
- `ended`: membership no longer exists; `endReason` records why.

After the official offboarding workflow, `archived` is the terminal status for
ordinary departures and `excluded` is reserved for a final formal exclusion.
The legacy value `offboarded` is migration-only and must not be written by new
membership workflows. `membershipEvents` is append-only; sensitive case content
remains in `membershipCases` and is intentionally absent from the general
`logs` collection. `membershipCases` is limited to warnings and exclusion
proceedings. Resignation, age limit and death are termination facts on the
membership itself; the handover checklist is attached to that membership.

The authoritative field definitions live in
[`app/lib/db/types.ts`](../app/lib/db/types.ts), while indexes are defined in
[`app/lib/db/indexes.ts`](../app/lib/db/indexes.ts).
