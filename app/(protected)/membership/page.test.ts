import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/server/memberships/selfServiceResignation", () => ({
  getOwnMembershipOverview: vi.fn(),
}));
vi.mock("./MembershipPage", () => ({ MembershipPage: () => null }));

import { getOwnMembershipOverview } from "@/lib/server/memberships/selfServiceResignation";
import OwnMembershipPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

test("opens the resignation flow from the dashboard deep link", async () => {
  const membership = { membershipNumber: "YFN-2030-MEMBER" };
  vi.mocked(getOwnMembershipOverview).mockResolvedValue(membership as never);

  const page = await OwnMembershipPage({
    searchParams: Promise.resolve({ resign: "1" }),
  });

  expect(page.props).toMatchObject({ membership, openResignation: true });
});

test("keeps the resignation flow closed without the deep link", async () => {
  vi.mocked(getOwnMembershipOverview).mockResolvedValue(null);

  const page = await OwnMembershipPage({
    searchParams: Promise.resolve({}),
  });

  expect(page.props).toMatchObject({
    membership: null,
    openResignation: false,
  });
});
