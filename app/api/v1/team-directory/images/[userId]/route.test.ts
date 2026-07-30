import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findDepartment: vi.fn(),
  findTeam: vi.fn(),
  findUser: vi.fn(),
  getObjectBuffer: vi.fn(),
  validateProfileImage: vi.fn(),
}));

vi.mock("@/lib/db/collections", () => ({
  departments: vi.fn(async () => ({ findOne: mocks.findDepartment })),
  teams: vi.fn(async () => ({ findOne: mocks.findTeam })),
  users: vi.fn(async () => ({ findOne: mocks.findUser })),
}));
vi.mock("@/lib/members/status", () => ({
  PUBLIC_MEMBER_STATUSES: ["active", "offboarding_planned"],
}));
vi.mock("@/lib/s3/storage", () => ({
  getObjectBuffer: mocks.getObjectBuffer,
}));
vi.mock("@/lib/server/profile/validation", () => ({
  validateProfileImage: mocks.validateProfileImage,
}));

import { GET } from "./route";

const context = { params: Promise.resolve({ userId: "board-member" }) };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("YFN_TEAM_DIRECTORY_ORGANIZATION_ID", "organization-id");
  mocks.findUser.mockResolvedValue({
    _id: "board-member",
    boardMembership: { departmentId: "board-department", isChair: true },
    profileImageStorageKey: "profile-image",
  });
  mocks.findDepartment.mockResolvedValue({
    _id: "board-department",
    isArchived: false,
  });
  mocks.getObjectBuffer.mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff]));
  mocks.validateProfileImage.mockReturnValue("image/jpeg");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("serves the public profile image of a board member", async () => {
  const response = await GET(
    new Request("http://localhost/api/v1/team-directory/images/board-member"),
    context,
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/jpeg");
  expect(mocks.findTeam).not.toHaveBeenCalled();
  expect(mocks.findDepartment).toHaveBeenCalledWith({
    _id: "board-department",
    organizationId: "organization-id",
    isArchived: false,
  });
});

test("hides board images assigned to an inactive department", async () => {
  mocks.findDepartment.mockResolvedValue(null);

  const response = await GET(
    new Request("http://localhost/api/v1/team-directory/images/board-member"),
    context,
  );

  expect(response.status).toBe(404);
  expect(mocks.getObjectBuffer).not.toHaveBeenCalled();
});
