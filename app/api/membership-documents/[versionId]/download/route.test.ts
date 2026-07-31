import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  hasPermission: vi.fn(),
  isUnavailableMemberStatus: vi.fn(),
  findExecution: vi.fn(),
  findVersion: vi.fn(),
  presignNamedDownload: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));
vi.mock("@/lib/auth/roles", () => ({ hasPermission: mocks.hasPermission }));
vi.mock("@/lib/db/collections", () => ({
  documentExecutions: vi.fn(async () => ({ findOne: mocks.findExecution })),
  documentVersions: vi.fn(async () => ({ findOne: mocks.findVersion })),
}));
vi.mock("@/lib/s3/storage", () => ({
  presignNamedDownload: mocks.presignNamedDownload,
}));
vi.mock("@/lib/members/status", () => ({
  isUnavailableMemberStatus: mocks.isUnavailableMemberStatus,
}));

import { GET } from "./route";

const versionId = "version-1";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.hasPermission.mockReturnValue(false);
  mocks.isUnavailableMemberStatus.mockReturnValue(false);
  mocks.requireAuthenticatedUser.mockResolvedValue({
    _id: "user-1",
    organizationId: "organization-1",
    role: "member",
    memberStatus: "active",
  });
  mocks.findVersion.mockResolvedValue({
    _id: versionId,
    title: "Datenschutzhinweise",
    versionLabel: "2026-01",
    snapshotStorageKey: "documents/version-1.pdf",
  });
  mocks.presignNamedDownload.mockResolvedValue(
    "https://storage.example/document",
  );
});

test("does not expose an unassigned document version to a member", async () => {
  mocks.findExecution.mockResolvedValue(null);

  const response = await downloadVersion();

  expect(response.status).toBe(404);
  expect(mocks.presignNamedDownload).not.toHaveBeenCalled();
});

test("downloads a document version assigned to the current member", async () => {
  mocks.findExecution.mockResolvedValue({ _id: "execution-1" });

  const response = await downloadVersion();

  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe(
    "https://storage.example/document",
  );
  expect(mocks.findExecution).toHaveBeenCalledWith({
    documentVersionId: versionId,
    userId: "user-1",
    organizationId: "organization-1",
  });
  expect(mocks.presignNamedDownload).toHaveBeenCalledWith(
    "documents/version-1.pdf",
    "Datenschutzhinweise-2026-01.pdf",
  );
});

function downloadVersion() {
  return GET(new Request("https://example.org"), {
    params: Promise.resolve({ versionId }),
  });
}
