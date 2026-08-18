import { documentExecutions, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type {
  DocumentExecution,
  DocumentVersion,
  Membership,
  User,
} from "../../db/types";
import {
  applicableDocumentVersions,
  MEMBERSHIP_DOCUMENT_KINDS,
  ONBOARDING_DOCUMENT_KINDS,
  versionsToAssign,
} from "./documentTargeting";

export async function assignOnboardingDocuments(user: User): Promise<number> {
  const { versions, requiresUsageRights } = await applicableDocumentVersions(
    user,
    ONBOARDING_DOCUMENT_KINDS,
  );
  assertOnboardingDocuments(versions, requiresUsageRights);
  return assign(versionsToAssign(versions), user._id);
}

export async function assignMembershipDocuments(
  membership: Membership,
): Promise<number> {
  const user = await requireDocumentUser(membership);
  const { versions } = await applicableDocumentVersions(
    user,
    MEMBERSHIP_DOCUMENT_KINDS,
  );
  assertMembershipDocuments(versions);
  return assign(versionsToAssign(versions), user._id, membership._id);
}

export async function assertOnboardingDocumentConfiguration(
  user: User,
): Promise<void> {
  const { versions, requiresUsageRights } = await applicableDocumentVersions(
    user,
    ONBOARDING_DOCUMENT_KINDS,
  );
  assertOnboardingDocuments(versions, requiresUsageRights);
}

export async function assertMembershipDocumentConfiguration(
  user: User,
): Promise<void> {
  const { versions } = await applicableDocumentVersions(
    user,
    MEMBERSHIP_DOCUMENT_KINDS,
  );
  assertMembershipDocuments(versions);
}

export async function onboardingDocumentsComplete(
  userId: string,
): Promise<boolean> {
  const open = await (
    await documentExecutions()
  ).countDocuments({
    userId,
    membershipId: { $exists: false },
    status: "assigned",
  });
  return open === 0;
}

export async function membershipDocumentsComplete(
  membershipId: string,
): Promise<boolean> {
  const open = await (
    await documentExecutions()
  ).countDocuments({ membershipId, status: "assigned" });
  return open === 0;
}

async function assign(
  versions: DocumentVersion[],
  userId: string,
  membershipId?: string,
): Promise<number> {
  const now = Date.now();
  let created = 0;
  for (const version of versions) {
    const execution: DocumentExecution = {
      _id: newId(),
      _creationTime: now,
      organizationId: version.organizationId,
      documentVersionId: version._id,
      documentHash: version.sha256,
      ...(membershipId ? { membershipId } : {}),
      userId,
      executionType: version.executionType,
      status: "assigned",
      assignedAt: now,
    };
    const result = await (
      await documentExecutions()
    ).updateOne(
      {
        organizationId: version.organizationId,
        documentVersionId: version._id,
        userId,
      },
      { $setOnInsert: execution },
      { upsert: true },
    );
    created += result.upsertedCount;
  }
  return created;
}

async function requireDocumentUser(membership: Membership): Promise<User> {
  const user = await (
    await users()
  ).findOne({
    _id: membership.userId,
    organizationId: membership.organizationId,
  });
  if (!user) throw new Error("User der Mitgliedschaft nicht gefunden.");
  return user;
}

function assertOnboardingDocuments(
  versions: DocumentVersion[],
  requiresUsageRights: boolean,
): void {
  if (!versions.some((version) => version.kind === "privacy_notice")) {
    throw new Error("Die Datenschutzhinweise sind noch nicht veröffentlicht.");
  }
  if (
    requiresUsageRights &&
    !versions.some((version) => version.kind === "usage_rights")
  ) {
    throw new Error(
      "Für das zugewiesene Department fehlt die Sondervereinbarung zu Arbeitsergebnissen.",
    );
  }
}

function assertMembershipDocuments(versions: DocumentVersion[]): void {
  if (!versions.some((version) => version.kind === "bylaws")) {
    throw new Error("Die Satzung ist noch nicht veröffentlicht.");
  }
}
