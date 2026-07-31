import {
  documentExecutions,
  documentVersions,
  teams,
  users,
} from "../../db/collections";
import { newId } from "../../db/ids";
import type { DocumentExecution, Membership, User } from "../../db/types";

export async function assignRequiredDocuments(
  membership: Membership,
): Promise<number> {
  const { versions: applicable, requiresUsageRights } =
    await applicableDocumentVersions(membership);
  assertRequiredDocuments(applicable, requiresUsageRights);
  const now = Date.now();
  let assignmentsCreated = 0;
  for (const version of versionsToAssign(applicable)) {
    const execution: DocumentExecution = {
      _id: newId(),
      _creationTime: now,
      organizationId: membership.organizationId,
      documentVersionId: version._id,
      documentHash: version.sha256,
      membershipId: membership._id,
      userId: membership.userId,
      executionType: version.executionType,
      status: "assigned",
      assignedAt: now,
    };
    const result = await (
      await documentExecutions()
    ).updateOne(
      {
        organizationId: membership.organizationId,
        documentVersionId: version._id,
        membershipId: membership._id,
      },
      { $setOnInsert: execution },
      { upsert: true },
    );
    assignmentsCreated += result.upsertedCount;
  }
  return assignmentsCreated;
}

export async function assertRequiredDocumentConfiguration(
  membership: Membership,
  userOverride?: User,
): Promise<void> {
  const { versions, requiresUsageRights } = await applicableDocumentVersions(
    membership,
    userOverride,
  );
  assertRequiredDocuments(versions, requiresUsageRights);
}

async function applicableDocumentVersions(
  membership: Membership,
  userOverride?: User,
) {
  const user =
    userOverride ??
    (await (
      await users()
    ).findOne({
      _id: membership.userId,
      organizationId: membership.organizationId,
    }));
  if (!user) throw new Error("User der Mitgliedschaft nicht gefunden.");
  const assignedTeamIds = [user.teamId, user.secondaryTeamId].filter(
    (id): id is string => Boolean(id),
  );
  const assignedTeams = assignedTeamIds.length
    ? await (
        await teams()
      )
        .find({
          _id: { $in: assignedTeamIds },
          organizationId: membership.organizationId,
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
      organizationId: membership.organizationId,
      isActive: true,
      kind: {
        $in: [
          "bylaws",
          "code_of_conduct",
          "privacy_notice",
          "usage_rights",
          "optional_consent",
        ],
      },
    })
    .sort({ publishedAt: -1 })
    .toArray();
  const applicable = versions.filter((version) => {
    if (
      version.kind !== "usage_rights" &&
      version.kind !== "optional_consent"
    ) {
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
      version.targetTeamIds.some((id) => assignedTeamIds.includes(id)) ||
      version.targetDepartmentIds.some((id) => departmentIds.includes(id))
    );
  });
  const configuredTeams = configuredIds("MEMBERSHIP_USAGE_RIGHTS_TEAM_IDS");
  const configuredDepartments = configuredIds(
    "MEMBERSHIP_USAGE_RIGHTS_DEPARTMENT_IDS",
  );
  return {
    versions: applicable,
    requiresUsageRights:
      assignedTeamIds.some((id) => configuredTeams.has(id)) ||
      departmentIds.some((id) => configuredDepartments.has(id)),
  };
}

function assertRequiredDocuments<T extends { kind: string }>(
  versions: T[],
  requiresUsageRights: boolean,
) {
  if (!versions.some((version) => version.kind === "bylaws")) {
    throw new Error("Die Satzung ist noch nicht veröffentlicht.");
  }
  if (!versions.some((version) => version.kind === "code_of_conduct")) {
    throw new Error("Der Code of Conduct ist noch nicht veröffentlicht.");
  }
  if (!versions.some((version) => version.kind === "privacy_notice")) {
    throw new Error("Die Datenschutzhinweise sind noch nicht veröffentlicht.");
  }
  if (
    requiresUsageRights &&
    !versions.some((version) => version.kind === "usage_rights")
  ) {
    throw new Error(
      "Für das zugewiesene Team fehlt der Nutzungsrechtevertrag.",
    );
  }
}

function configuredIds(name: string) {
  return new Set(
    (process.env[name] ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

function versionsToAssign<T extends { kind: string }>(versions: T[]): T[] {
  const seen = new Set<string>();
  return versions.filter((version) => {
    if (version.kind === "optional_consent") return true;
    if (seen.has(version.kind)) return false;
    seen.add(version.kind);
    return true;
  });
}

export async function requiredDocumentsComplete(
  membershipId: string,
): Promise<boolean> {
  return (
    (await (
      await documentExecutions()
    ).countDocuments({ membershipId, status: "assigned" })) === 0
  );
}
