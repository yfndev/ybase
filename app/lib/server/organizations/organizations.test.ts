import { expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requireUser: vi.fn(),
}));

import { requireUser } from "../../auth/session";
import { YFN_ORGANIZATION } from "../../organization";
import { getOrganization, getOrganizationDomain } from "./data";

test("returns the static YFN organization", async () => {
  vi.mocked(requireUser).mockResolvedValue({
    _id: "user-id",
    _creationTime: Date.now(),
    email: "member@youngfounders.network",
    organizationId: "organization-id",
    role: "member",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });

  await expect(getOrganization()).resolves.toEqual(YFN_ORGANIZATION);
  await expect(getOrganizationDomain()).resolves.toBe(YFN_ORGANIZATION.domain);
  expect(requireUser).toHaveBeenCalledTimes(2);
});
