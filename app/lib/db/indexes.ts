import { getDb } from "./client";

export async function ensureIndexes(): Promise<void> {
  const db = await getDb();

  await db
    .collection("organizations")
    .createIndexes([
      { key: { name: 1 } },
      { key: { domain: 1 }, unique: true },
    ]);

  await db
    .collection("users")
    .createIndexes([
      { key: { email: 1 }, unique: true, sparse: true },
      { key: { organizationId: 1 } },
    ]);

  await db
    .collection("projects")
    .createIndexes([
      { key: { organizationId: 1 } },
      { key: { organizationId: 1, isArchived: 1 } },
    ]);

  await db
    .collection("departments")
    .createIndexes([
      { key: { organizationId: 1 } },
      { key: { organizationId: 1, isArchived: 1 } },
    ]);

  await db
    .collection("teams")
    .createIndexes([
      { key: { organizationId: 1 } },
      { key: { organizationId: 1, isArchived: 1 } },
      { key: { organizationId: 1, departmentId: 1 } },
    ]);

  await db
    .collection("jobPostings")
    .createIndexes([
      { key: { organizationId: 1, _creationTime: -1 } },
      { key: { organizationId: 1, status: 1 } },
      { key: { organizationId: 1, teamId: 1 } },
      { key: { tallyFormId: 1 }, sparse: true },
    ]);

  await db.collection("jobFeedTokens").createIndexes([
    { key: { organizationId: 1 }, unique: true },
    { key: { tokenHash: 1 }, unique: true },
  ]);

  await db
    .collection("applications")
    .createIndexes([
      { key: { organizationId: 1, _creationTime: -1 } },
      { key: { organizationId: 1, jobPostingId: 1, _creationTime: -1 } },
      { key: { organizationId: 1, "files._id": 1 } },
      { key: { tallyEventId: 1 }, unique: true },
      { key: { tallySubmissionId: 1 }, unique: true },
      { key: { tallyResponseId: 1 }, unique: true },
      { key: { jobPostingId: 1, applicantEmailNormalized: 1 }, unique: true },
    ]);

  await db
    .collection("tallyWebhookEvents")
    .createIndexes([{ key: { _creationTime: -1 } }]);

  await db
    .collection("reimbursements")
    .createIndexes([
      { key: { organizationId: 1, _creationTime: -1 } },
      { key: { organizationId: 1, createdBy: 1, _creationTime: -1 } },
      { key: { organizationId: 1, projectId: 1 } },
    ]);

  await db
    .collection("travelDetails")
    .createIndexes([{ key: { reimbursementId: 1 } }]);

  await db
    .collection("receipts")
    .createIndexes([{ key: { reimbursementId: 1 } }]);

  await db
    .collection("logs")
    .createIndexes([{ key: { organizationId: 1, _creationTime: -1 } }]);

  await db
    .collection("volunteerAllowance")
    .createIndexes([
      { key: { organizationId: 1, _creationTime: -1 } },
      { key: { organizationId: 1, createdBy: 1, _creationTime: -1 } },
      { key: { organizationId: 1, projectId: 1 } },
    ]);

  await db
    .collection("signatureTokens")
    .createIndexes([
      { key: { token: 1 }, unique: true },
      { key: { createdBy: 1 } },
    ]);

  await db
    .collection("uploadOwnerships")
    .createIndexes([
      { key: { organizationId: 1, userId: 1, _creationTime: -1 } },
      { key: { contextType: 1, contextId: 1 } },
      { key: { claimedByType: 1, claimedById: 1 }, sparse: true },
    ]);
}
