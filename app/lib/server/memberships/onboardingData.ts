"use server";

import { documentExecutions, documentVersions } from "../../db/collections";
import type { DocumentExecution, DocumentVersion } from "../../db/types";
import { documentOrderIndex } from "../../members/documents";
import { loadDocumentContent } from "./documentContent";
import { activateMembershipOnboardingIfComplete } from "./onboardingCompletion";
import { requireOnboardingUser } from "./onboardingActor";
import { ensureAcceptedApplicantMembership } from "./onboardingMembership";

export async function getOwnMembershipOnboardingContext() {
  const actor = await requireOnboardingUser(true);
  const membership = await ensureAcceptedApplicantMembership(actor);
  const activated = await activateMembershipOnboardingIfComplete(
    membership._id,
  );
  const executions = await (
    await documentExecutions()
  )
    .find({
      organizationId: membership.organizationId,
      membershipId: membership._id,
      userId: actor._id,
      status: { $ne: "revoked" },
    })
    .toArray();
  const versions = await loadVersions(membership.organizationId, executions);
  const ordered = executions.sort(
    (first, second) =>
      orderOf(versions.get(first.documentVersionId)) -
      orderOf(versions.get(second.documentVersionId)),
  );
  const documents = await Promise.all(
    ordered.map((execution) =>
      toDocumentTask(execution, versions.get(execution.documentVersionId)),
    ),
  );

  return {
    activated,
    documentsComplete: documents.every(({ status }) => status === "completed"),
    profile: {
      firstName: membership.firstName,
      lastName: membership.lastName,
      dateOfBirth: membership.dateOfBirth,
      gender: membership.gender,
      privateEmail: membership.privateEmail,
      phone: membership.phone ?? "",
      address: membership.address ?? {
        street: "",
        postalCode: "",
        city: "",
        country: "Deutschland",
      },
      confirmed: Boolean(
        membership.profileConfirmedAt && membership.purposesConfirmedAt,
      ),
    },
    documents,
  };
}

async function loadVersions(
  organizationId: string,
  executions: DocumentExecution[],
): Promise<Map<string, DocumentVersion>> {
  if (executions.length === 0) return new Map();
  const versions = await (
    await documentVersions()
  )
    .find({
      organizationId,
      _id: {
        $in: executions.map(({ documentVersionId }) => documentVersionId),
      },
    })
    .toArray();
  return new Map(versions.map((version) => [version._id, version]));
}

async function toDocumentTask(
  execution: DocumentExecution,
  version?: DocumentVersion,
) {
  if (!version) {
    throw new Error("Die eingefrorene Dokumentversion fehlt.");
  }
  return {
    executionId: execution._id,
    kind: version.kind,
    title: version.title,
    versionLabel: version.versionLabel,
    type: execution.executionType,
    status: execution.status,
    content:
      execution.status === "assigned"
        ? await loadDocumentContent(version.contentStorageKey, version.sha256)
        : "",
  };
}

function orderOf(version?: DocumentVersion): number {
  return version ? documentOrderIndex(version.kind) : Number.MAX_SAFE_INTEGER;
}

export type MembershipOnboardingContext = Awaited<
  ReturnType<typeof getOwnMembershipOnboardingContext>
>;
