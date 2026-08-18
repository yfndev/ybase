import { describe, expect, test } from "vitest";
import type { ApplicationWithFiles } from "@/lib/db/types";
import {
  ALL_APPLICATIONS,
  type ApplicationFilters,
  filterApplications,
} from "./applicationTable";

function application(
  overrides: Partial<ApplicationWithFiles>,
): ApplicationWithFiles {
  return {
    _id: overrides._id ?? crypto.randomUUID(),
    _creationTime: overrides._creationTime ?? 1,
    organizationId: "org-1",
    jobPostingId: "posting-1",
    jobPostingTitle: "Fundraising",
    status: "received",
    applicantEmail: "alex@example.com",
    fields: [],
    files: [],
    submittedAt: 1,
    ownerIds: [],
    ...overrides,
  };
}

const filters: ApplicationFilters = {
  search: "",
  status: ALL_APPLICATIONS,
  ownerIds: [],
  sortDirection: "desc",
};

describe("filterApplications", () => {
  test("searches identity and job title and sorts by submission time", () => {
    const older = application({
      _id: "older",
      applicantName: "Alex Beispiel",
      submittedAt: 10,
    });
    const newer = application({
      _id: "newer",
      applicantEmail: "kim@example.com",
      jobPostingTitle: "Kommunikation",
      submittedAt: 20,
    });

    expect(
      filterApplications([older, newer], filters).map((item) => item._id),
    ).toEqual(["newer", "older"]);
    expect(
      filterApplications([older, newer], {
        ...filters,
        search: "kommunikation",
      }),
    ).toEqual([newer]);
  });

  test("filters status and multiple responsible people", () => {
    const unassigned = application({ _id: "open", status: "review" });
    const firstAssigned = application({
      _id: "owned-1",
      status: "review",
      ownerIds: ["user-1", "user-3"],
    });
    const secondAssigned = application({
      _id: "owned-2",
      status: "review",
      ownerIds: ["user-2"],
    });

    expect(
      filterApplications([unassigned, firstAssigned, secondAssigned], {
        ...filters,
        status: "review",
        ownerIds: ["user-1", "user-2"],
      }),
    ).toEqual([firstAssigned, secondAssigned]);
  });

  test("filters accepted applications by their onboarding progress", () => {
    const accepted = application({ _id: "accepted", status: "accepted" });
    const registered = application({
      _id: "registered",
      status: "accepted",
      onboardingUserId: "user-1",
    });
    const completed = application({
      _id: "completed",
      status: "accepted",
      onboardingUserId: "user-2",
      onboardingStartedAt: 21,
      onboardingCompletedAt: 42,
    });
    const onboarding = application({
      _id: "onboarding",
      status: "accepted",
      onboardingUserId: "user-3",
      onboardingStartedAt: 21,
    });

    expect(
      filterApplications([accepted, registered, onboarding, completed], {
        ...filters,
        status: "accepted",
      }),
    ).toEqual([accepted]);
    expect(
      filterApplications([accepted, registered, onboarding, completed], {
        ...filters,
        status: "ybase_registered",
      }),
    ).toEqual([registered]);
    expect(
      filterApplications([accepted, registered, onboarding, completed], {
        ...filters,
        status: "onboarding_active",
      }),
    ).toEqual([onboarding]);
    expect(
      filterApplications([accepted, registered, onboarding, completed], {
        ...filters,
        status: "onboarding_completed",
      }),
    ).toEqual([completed]);
  });
});
