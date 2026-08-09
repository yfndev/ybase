import { documentVersions, teams } from "../../db/collections";
import type {
  DocumentVersion,
  MembershipDocumentKind,
  User,
} from "../../db/types";

export const ONBOARDING_DOCUMENT_KINDS = [
  "privacy_notice",
  "usage_rights",
  "optional_consent",
] as const satisfies readonly MembershipDocumentKind[];

export const MEMBERSHIP_DOCUMENT_KINDS = [
  "bylaws",
] as const satisfies readonly MembershipDocumentKind[];

export interface ApplicableDocuments {
  versions: DocumentVersion[];
  requiresUsageRights: boolean;
}

export async function applicableDocumentVersions(
  user: User,
  kinds: readonly MembershipDocumentKind[],
): Promise<ApplicableDocuments> {
  if (!user.organizationId) {
    throw new Error("User der Unterlagen gehört zu keiner Organisation.");
  }
  const assignedTeamIds = [user.teamId, user.secondaryTeamId].filter(
    (id): id is string => Boolean(id),
  );
  const assignedTeams = assignedTeamIds.length
    ? await (
        await teams()
      )
        .find({
          _id: { $in: assignedTeamIds },
          organizationId: user.organizationId,
        })
        .toArray()
    : [];
  const departmentIds = [
    ...assignedTeams.map((team) => team.departmentId),
    ...(user.boardMembership ? [user.boardMembership.departmentId] : []),
  ];
  const versions = await (
    await documentVersions()
  )
    .find({
      organizationId: user.organizationId,
      isActive: true,
      kind: { $in: [...kinds] },
    })
    .sort({ publishedAt: -1 })
    .toArray();
  const applicable = versions.filter((version) =>
    isTargeted(version, assignedTeamIds, departmentIds),
  );
  return {
    versions: applicable,
    requiresUsageRights: departmentIds.length > 0,
  };
}

function isTargeted(
  version: DocumentVersion,
  teamIds: string[],
  departmentIds: string[],
): boolean {
  if (version.kind !== "usage_rights" && version.kind !== "optional_consent") {
    return true;
  }
  if (
    version.kind === "optional_consent" &&
    version.targetTeamIds.length === 0 &&
    version.targetDepartmentIds.length === 0
  ) {
    return true;
  }
  return (
    version.targetTeamIds.some((id) => teamIds.includes(id)) ||
    version.targetDepartmentIds.some((id) => departmentIds.includes(id))
  );
}

export function versionsToAssign(
  versions: DocumentVersion[],
): DocumentVersion[] {
  const seen = new Set<string>();
  return versions.filter((version) => {
    if (version.kind === "optional_consent") return true;
    const key = assignmentKey(version);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function assignmentKey(version: DocumentVersion): string {
  if (version.kind !== "usage_rights") return version.kind;
  const targets = [
    ...version.targetDepartmentIds,
    ...version.targetTeamIds,
  ].sort();
  return `usage_rights:${targets.join(",")}`;
}
