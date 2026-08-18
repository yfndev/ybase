import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/reimbursements/data", () => ({
  getAllReimbursements: vi.fn(),
}));
vi.mock("@/lib/server/volunteerAllowance/data", () => ({ getAll: vi.fn() }));
vi.mock("@/lib/server/memberships/selfServiceResignation", () => ({
  getOwnMembershipOverview: vi.fn(),
}));
vi.mock("./DashboardPageUI", () => ({ DashboardPageUI: () => null }));

import { auth } from "@/lib/auth";
import { getOwnMembershipOverview } from "@/lib/server/memberships/selfServiceResignation";
import { getAllReimbursements } from "@/lib/server/reimbursements/data";
import { getAll } from "@/lib/server/volunteerAllowance/data";
import DashboardPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAllReimbursements).mockResolvedValue([]);
  vi.mocked(getAll).mockResolvedValue([]);
});

test("renders the dashboard with membership data for regular members", async () => {
  vi.mocked(auth).mockResolvedValue({
    user: { organizationId: "organization-1", role: "member" },
  } as never);
  const membership = { membershipNumber: "YFN-2030-MEMBER" };
  vi.mocked(getOwnMembershipOverview).mockResolvedValue(membership as never);

  const page = await DashboardPage();

  expect(page?.props).toMatchObject({
    entries: [],
    membership,
  });
  expect(getOwnMembershipOverview).toHaveBeenCalledOnce();
});

test("also loads the own membership for the administrative dashboard", async () => {
  vi.mocked(auth).mockResolvedValue({
    user: { organizationId: "organization-1", role: "admin" },
  } as never);
  const membership = { membershipNumber: "YFN-2030-ADMIN" };
  vi.mocked(getOwnMembershipOverview).mockResolvedValue(membership as never);

  const page = await DashboardPage();

  expect(page?.props).toMatchObject({
    entries: [],
    membership,
  });
  expect(getOwnMembershipOverview).toHaveBeenCalledOnce();
});
