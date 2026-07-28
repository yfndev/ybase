import {
  getApplicationDisplayStatus,
  type ApplicationDisplayStatus,
} from "../applications/status";
import type { ApplicationWithFiles, MemberStatus, User } from "../db/types";

export const MEMBER_STAGE_OPTIONS = [
  { value: "application", label: "Bewerbung" },
  { value: "interview", label: "Interview" },
  { value: "onboarding", label: "Onboarding" },
  { value: "active", label: "Vereinsmitglied" },
  { value: "inactive", label: "Inaktiv" },
  { value: "offboarded", label: "Offboarded" },
  { value: "archived", label: "Archiviert" },
] as const;

export type MemberStage = (typeof MEMBER_STAGE_OPTIONS)[number]["value"];

const MEMBER_STAGES = new Set<MemberStage>(
  MEMBER_STAGE_OPTIONS.map(({ value }) => value),
);

export function isMemberStage(value: unknown): value is MemberStage {
  return typeof value === "string" && MEMBER_STAGES.has(value as MemberStage);
}

export function memberStageLabel(stage: MemberStage): string {
  return (
    MEMBER_STAGE_OPTIONS.find(({ value }) => value === stage)?.label ?? stage
  );
}

export function memberStageForStatus(status: MemberStatus): MemberStage {
  return status;
}

const APPLICATION_STAGE_STATUSES: Record<
  Extract<MemberStage, "application" | "interview" | "archived">,
  readonly ApplicationDisplayStatus[]
> = {
  application: ["received", "review"],
  interview: ["interview"],
  archived: ["rejected", "withdrawn"],
};

export const MEMBER_STATUS_BY_STAGE: Partial<
  Record<MemberStage, MemberStatus>
> = {
  active: "active",
  inactive: "inactive",
  offboarded: "offboarded",
};

export function applicationsForStage(
  applications: ApplicationWithFiles[],
  stage: MemberStage,
  memberStatusesById: ReadonlyMap<string, MemberStatus>,
): ApplicationWithFiles[] {
  if (stage === "onboarding") {
    return applications.filter((application) => {
      if (application.status !== "accepted") return false;
      if (!application.onboardingUserId) return true;
      const memberStatus = memberStatusesById.get(application.onboardingUserId);
      return memberStatus === undefined || memberStatus === "onboarding";
    });
  }

  if (!(stage in APPLICATION_STAGE_STATUSES)) return [];
  const statuses =
    APPLICATION_STAGE_STATUSES[
      stage as keyof typeof APPLICATION_STAGE_STATUSES
    ];
  return applications.filter((application) =>
    statuses.includes(getApplicationDisplayStatus(application)),
  );
}

export function membersForStage(members: User[], stage: MemberStage): User[] {
  const status = MEMBER_STATUS_BY_STAGE[stage];
  return status
    ? members.filter((member) => member.memberStatus === status)
    : [];
}

export function memberStageCounts(
  applications: ApplicationWithFiles[],
  members: User[],
): Record<MemberStage, number> {
  const memberStatusesById = new Map(
    members.map((member) => [member._id, member.memberStatus]),
  );
  return Object.fromEntries(
    MEMBER_STAGE_OPTIONS.map(({ value }) => {
      const count =
        applicationsForStage(applications, value, memberStatusesById).length +
        membersForStage(members, value).length;
      return [value, count];
    }),
  ) as Record<MemberStage, number>;
}
