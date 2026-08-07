import type { Db } from "mongodb";

export async function ensureMembershipIndexes(db: Db): Promise<void> {
  await db.collection("memberships").createIndexes([
    {
      key: { organizationId: 1, userId: 1 },
      unique: true,
      partialFilterExpression: { isCurrent: true },
    },
    { key: { organizationId: 1, membershipNumber: 1 }, unique: true },
    { key: { applicationId: 1 }, unique: true },
    {
      key: { memberPlatformUserId: 1 },
      unique: true,
      partialFilterExpression: {
        memberPlatformUserId: { $type: "string" },
        isCurrent: true,
      },
    },
    { key: { organizationId: 1, legalStatus: 1, scheduledEndAt: 1 } },
    { key: { organizationId: 1, legalStatus: 1, dateOfBirth: 1 } },
    { key: { isCurrent: 1, legalStatus: 1, scheduledEndAt: 1 } },
    { key: { isCurrent: 1, legalStatus: 1, dateOfBirth: 1 } },
    { key: { legalStatus: 1, userLifecycleSyncedAt: 1 } },
    {
      key: {
        legalStatus: 1,
        workspaceSuspendedAt: 1,
        workspaceSuspensionNotRequiredAt: 1,
      },
    },
  ]);
  await db.collection("membershipCases").createIndexes([
    { key: { organizationId: 1, membershipId: 1, _creationTime: -1 } },
    { key: { organizationId: 1, type: 1, status: 1 } },
    { key: { objectionTokenHash: 1 }, unique: true, sparse: true },
    { key: { "decisionDelivery.messageId": 1 }, unique: true, sparse: true },
    {
      key: { membershipId: 1, type: 1, warningSequence: 1 },
      unique: true,
      partialFilterExpression: { warningSequence: { $exists: true } },
    },
  ]);
  await db.collection("documentVersions").createIndexes([
    { key: { organizationId: 1, kind: 1, isActive: 1 } },
    {
      key: { organizationId: 1, kind: 1, versionLabel: 1 },
      unique: true,
    },
    { key: { sha256: 1 } },
  ]);
  await db.collection("documentExecutions").createIndexes([
    { key: { documentVersionId: 1, membershipId: 1, assignedAt: -1 } },
    { key: { organizationId: 1, membershipId: 1, status: 1 } },
    { key: { organizationId: 1, userId: 1, documentVersionId: 1 } },
    {
      key: { organizationId: 1, userId: 1, status: 1, completedAt: -1 },
    },
  ]);
  await db.collection("membershipEvents").createIndexes([
    { key: { organizationId: 1, occurredAt: -1 } },
    { key: { organizationId: 1, membershipId: 1, occurredAt: 1 } },
    { key: { organizationId: 1, caseId: 1, occurredAt: 1 } },
    {
      key: { organizationId: 1, idempotencyKey: 1 },
      unique: true,
      partialFilterExpression: { idempotencyKey: { $type: "string" } },
    },
  ]);
}
