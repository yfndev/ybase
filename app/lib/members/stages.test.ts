import { describe, expect, test } from "vitest";
import type { ApplicationWithFiles, User } from "@/lib/db/types";
import {
  applicationsForStage,
  isMemberStage,
  memberStageForStatus,
  memberStageLabel,
  memberStageCounts,
  membersForStage,
} from "./stages";

function application(
  id: string,
  overrides: Partial<ApplicationWithFiles> = {},
): ApplicationWithFiles {
  return {
    _id: id,
    _creationTime: 1,
    organizationId: "org-1",
    jobPostingId: "posting-1",
    jobPostingTitle: "Fundraising",
    status: "received",
    applicantEmail: `${id}@example.com`,
    fields: [],
    files: [],
    submittedAt: 1,
    ownerIds: [],
    ...overrides,
  };
}

function member(id: string, status: User["memberStatus"]): User {
  return {
    _id: id,
    _creationTime: 1,
    memberStatus: status,
    teamOnboardingStatus: "completed",
  };
}

describe("member lifecycle stages", () => {
  const applications = [
    application("new"),
    application("review", { status: "review" }),
    application("interview", { status: "interview" }),
    application("pending-onboarding", { status: "accepted" }),
    application("linked-onboarding", {
      status: "accepted",
      onboardingUserId: "onboarding-member",
    }),
    application("rejected", { status: "rejected" }),
    application("withdrawn", { status: "withdrawn" }),
  ];
  const members = [
    member("onboarding-member", "onboarding"),
    member("active-member", "active"),
    member("inactive-member", "inactive"),
    member("offboarded-member", "offboarded"),
  ];
  const memberStatusesById = new Map(
    members.map((entry) => [entry._id, entry.memberStatus]),
  );

  test("validates stage query parameters", () => {
    expect(isMemberStage("interview")).toBe(true);
    expect(isMemberStage("unknown")).toBe(false);
    expect(memberStageLabel("onboarding")).toBe("Onboarding");
    expect(memberStageForStatus("active")).toBe("active");
  });

  test("groups application records by recruiting step", () => {
    expect(
      applicationsForStage(applications, "application", memberStatusesById).map(
        (entry) => entry._id,
      ),
    ).toEqual(["new", "review"]);
    expect(
      applicationsForStage(applications, "interview", memberStatusesById).map(
        (entry) => entry._id,
      ),
    ).toEqual(["interview"]);
    expect(
      applicationsForStage(applications, "archived", memberStatusesById).map(
        (entry) => entry._id,
      ),
    ).toEqual(["rejected", "withdrawn"]);
  });

  test("keeps accepted applications in one onboarding list", () => {
    expect(
      applicationsForStage(applications, "onboarding", memberStatusesById).map(
        (entry) => entry._id,
      ),
    ).toEqual(["pending-onboarding", "linked-onboarding"]);
    expect(membersForStage(members, "onboarding")).toEqual([]);
  });

  test("keeps inactive and offboarded members separate", () => {
    expect(
      membersForStage(members, "inactive").map((entry) => entry._id),
    ).toEqual(["inactive-member"]);
    expect(
      membersForStage(members, "offboarded").map((entry) => entry._id),
    ).toEqual(["offboarded-member"]);
  });

  test("counts records shown in every tab", () => {
    expect(memberStageCounts(applications, members)).toMatchObject({
      application: 2,
      interview: 1,
      onboarding: 2,
      active: 1,
      inactive: 1,
      offboarded: 1,
      archived: 2,
    });
  });
});
