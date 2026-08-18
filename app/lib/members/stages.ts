import {
  getApplicationDisplayStatus,
  type ApplicationDisplayStatus,
} from "../applications/status";
import type {
  ApplicationWithFiles,
  MemberStatus,
  StoredMemberStatus,
  User,
} from "../db/types";
import { normalizeMemberStatus } from "./status";

export const MEMBER_STAGE_OPTIONS = [
  { value: "application", label: "Bewerbung" },
  { value: "interview", label: "Interview" },
  { value: "onboarding", label: "Onboarding" },
  { value: "getting_to_know", label: "Kennenlernphase" },
  { value: "active", label: "Vereinsmitglied" },
  { value: "offboarding_planned", label: "Offboarding vorgemerkt" },
  { value: "offboarding", label: "Offboarding" },
  { value: "archived", label: "Archiviert" },
  { value: "excluded", label: "Ausgeschlossen" },
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

export function memberStageForStatus(status: StoredMemberStatus): MemberStage {
  return normalizeMemberStatus(status);
}

const APPLICATION_STAGE_STATUSES: Record<
  Extract<MemberStage, "application" | "interview">,
  readonly ApplicationDisplayStatus[]
> = {
  application: ["received", "review"],
  interview: ["interview"],
};

const MEMBER_STATUSES_BY_STAGE: Partial<
  Record<MemberStage, readonly MemberStatus[]>
> = {
  onboarding: ["onboarding"],
  getting_to_know: ["getting_to_know"],
  active: ["active"],
  offboarding_planned: ["offboarding_planned"],
  offboarding: ["offboarding"],
  archived: ["archived"],
  excluded: ["excluded"],
};

export function memberStatusesForStage(
  stage: MemberStage,
): readonly MemberStatus[] {
  return MEMBER_STATUSES_BY_STAGE[stage] ?? [];
}

export function applicationsForStage(
  applications: ApplicationWithFiles[],
  stage: MemberStage,
): ApplicationWithFiles[] {
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
  const statuses = memberStatusesForStage(stage);
  return members.filter((member) =>
    statuses.includes(normalizeMemberStatus(member.memberStatus)),
  );
}

export function memberStageCounts(
  applications: ApplicationWithFiles[],
  members: User[],
): Record<MemberStage, number> {
  return Object.fromEntries(
    MEMBER_STAGE_OPTIONS.map(({ value }) => {
      const count =
        applicationsForStage(applications, value).length +
        membersForStage(members, value).length;
      return [value, count];
    }),
  ) as Record<MemberStage, number>;
}
