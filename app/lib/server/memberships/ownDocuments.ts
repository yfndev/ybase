"use server";

import { requireAuthenticatedUser } from "../../auth/session";
import { documentExecutions, documentVersions } from "../../db/collections";
import { isUnavailableMemberStatus } from "../../members/status";

export async function getOwnCompletedMembershipDocuments() {
  const actor = await requireAuthenticatedUser();
  if (!actor.organizationId) throw new Error("User has no organization");
  if (isUnavailableMemberStatus(actor.memberStatus)) {
    throw new Error("User is unavailable");
  }
  const executions = await (
    await documentExecutions()
  )
    .find({
      organizationId: actor.organizationId,
      userId: actor._id,
      status: "completed",
    })
    .sort({ completedAt: -1 })
    .toArray();
  const versions = executions.length
    ? await (
        await documentVersions()
      )
        .find({
          organizationId: actor.organizationId,
          _id: { $in: executions.map((item) => item.documentVersionId) },
        })
        .toArray()
    : [];
  const versionData = new Map(
    versions.map((version) => [
      version._id,
      { title: version.title, versionLabel: version.versionLabel },
    ]),
  );
  return executions.map((execution) => {
    const version = versionData.get(execution.documentVersionId);
    return {
      executionId: execution._id,
      title: version?.title ?? "Dokument",
      versionLabel: version?.versionLabel,
      completedAt: execution.completedAt,
      downloadUrl: `/api/membership-executions/${execution._id}/download`,
    };
  });
}

export type OwnMembershipDocument = Awaited<
  ReturnType<typeof getOwnCompletedMembershipDocuments>
>[number];
