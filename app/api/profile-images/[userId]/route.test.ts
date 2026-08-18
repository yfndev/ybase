import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  findOne: vi.fn(),
  getObjectBuffer: vi.fn(),
  validateProfileImage: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/db/collections", () => ({
  users: vi.fn(async () => ({ findOne: mocks.findOne })),
}));
vi.mock("@/lib/s3/storage", () => ({
  getObjectBuffer: mocks.getObjectBuffer,
}));
vi.mock("@/lib/server/profile/validation", () => ({
  validateProfileImage: mocks.validateProfileImage,
}));

import { GET } from "./route";

const context = { params: Promise.resolve({ userId: "member-id" }) };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ organizationId: "organization-id" });
  mocks.findOne.mockResolvedValue({
    _id: "member-id",
    profileImageStorageKey: "profile-image",
  });
  mocks.getObjectBuffer.mockResolvedValue(Buffer.from([0xff, 0xd8, 0xff]));
  mocks.validateProfileImage.mockReturnValue("image/jpeg");
});

test("returns a private stored profile image from the actor organization", async () => {
  const response = await GET(
    new Request("http://localhost/api/profile-images/member-id?v=123"),
    context,
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/jpeg");
  expect(response.headers.get("cache-control")).toContain("private");
  expect(response.headers.get("cache-control")).toContain("max-age=300");
  expect(mocks.findOne).toHaveBeenCalledWith({
    _id: "member-id",
    organizationId: "organization-id",
    profileImageStorageKey: { $exists: true },
  });
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(
    new Uint8Array([0xff, 0xd8, 0xff]),
  );
});

test("rejects unauthenticated image requests", async () => {
  mocks.requireUser.mockRejectedValue(new Error("Unauthorized"));

  const response = await GET(
    new Request("http://localhost/api/profile-images/member-id"),
    context,
  );

  expect(response.status).toBe(401);
  expect(mocks.findOne).not.toHaveBeenCalled();
});

test("hides missing or foreign profile images", async () => {
  mocks.findOne.mockResolvedValue(null);

  const response = await GET(
    new Request("http://localhost/api/profile-images/member-id"),
    context,
  );

  expect(response.status).toBe(404);
  expect(mocks.getObjectBuffer).not.toHaveBeenCalled();
});

test("does not serve invalid stored image data", async () => {
  mocks.validateProfileImage.mockImplementation(() => {
    throw new Error("Invalid image");
  });

  const response = await GET(
    new Request("http://localhost/api/profile-images/member-id"),
    context,
  );

  expect(response.status).toBe(404);
});
