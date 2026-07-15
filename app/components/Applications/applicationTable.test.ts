import { describe, expect, test } from "vitest";
import type { ApplicationWithFiles } from "@/lib/db/types";
import {
  ALL_APPLICATIONS,
  type ApplicationFilters,
  filterApplications,
  UNASSIGNED_APPLICATIONS,
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
    applicantEmailNormalized: "alex@example.com",
    fields: [],
    files: [],
    tallyEventId: "event-1",
    tallySubmissionId: "submission-1",
    tallyResponseId: "response-1",
    tallyFormId: "form-1",
    submittedAt: 1,
    ...overrides,
  };
}

const filters: ApplicationFilters = {
  search: "",
  status: ALL_APPLICATIONS,
  ownerId: ALL_APPLICATIONS,
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
      applicantEmailNormalized: "kim@example.com",
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

  test("filters status and unassigned applications", () => {
    const unassigned = application({ _id: "open", status: "review" });
    const assigned = application({
      _id: "owned",
      status: "review",
      ownerId: "user-1",
    });

    expect(
      filterApplications([unassigned, assigned], {
        ...filters,
        status: "review",
        ownerId: UNASSIGNED_APPLICATIONS,
      }),
    ).toEqual([unassigned]);
  });
});
