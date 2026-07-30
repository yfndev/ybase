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

function member(
  id: string,
  status: User["memberStatus"],
  overrides: Partial<User> = {},
): User {
  return {
    _id: id,
    _creationTime: 1,
    memberStatus: status,
    teamOnboardingStatus: "completed",
    ...overrides,
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
    member("onboarding-member", "onboarding", {
      applicationId: "linked-onboarding",
    }),
    member("manual-onboarding-member", "onboarding"),
    member("active-member", "active"),
    member("planned-member", "offboarding_planned"),
    member("offboarding-member", "offboarding"),
    member("archived-member", "archived"),
    member("excluded-member", "excluded"),
    member("legacy-offboarded-member", "offboarded"),
  ];
  test("validates stage query parameters", () => {
    expect(isMemberStage("interview")).toBe(true);
    expect(isMemberStage("unknown")).toBe(false);
    expect(memberStageLabel("onboarding")).toBe("Onboarding");
    expect(memberStageLabel("offboarding_planned")).toBe(
      "Offboarding vorgemerkt",
    );
    expect(memberStageForStatus("active")).toBe("active");
    expect(memberStageForStatus("offboarded")).toBe("archived");
    expect(memberStageForStatus("excluded")).toBe("excluded");
  });

  test("groups application records by recruiting step", () => {
    expect(
      applicationsForStage(applications, "application").map(
        (entry) => entry._id,
      ),
    ).toEqual(["new", "review"]);
    expect(
      applicationsForStage(applications, "interview").map((entry) => entry._id),
    ).toEqual(["interview"]);
    expect(
      applicationsForStage(applications, "archived").map((entry) => entry._id),
    ).toEqual([]);
  });

  test("uses member records as the single onboarding source", () => {
    expect(applicationsForStage(applications, "onboarding")).toEqual([]);
    expect(
      membersForStage(members, "onboarding").map((entry) => entry._id),
    ).toEqual(["onboarding-member", "manual-onboarding-member"]);
  });

  test("keeps offboarding phases separate and maps legacy records to archive", () => {
    expect(
      membersForStage(members, "offboarding_planned").map((entry) => entry._id),
    ).toEqual(["planned-member"]);
    expect(
      membersForStage(members, "offboarding").map((entry) => entry._id),
    ).toEqual(["offboarding-member"]);
    expect(
      membersForStage(members, "archived").map((entry) => entry._id),
    ).toEqual(["archived-member", "legacy-offboarded-member"]);
    expect(
      membersForStage(members, "excluded").map((entry) => entry._id),
    ).toEqual(["excluded-member"]);
  });

  test("counts records shown in every tab", () => {
    expect(memberStageCounts(applications, members)).toMatchObject({
      application: 2,
      interview: 1,
      onboarding: 2,
      active: 1,
      offboarding_planned: 1,
      offboarding: 1,
      archived: 2,
      excluded: 1,
    });
  });
});
