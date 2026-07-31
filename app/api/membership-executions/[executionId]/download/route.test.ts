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

const executionId = "execution-1";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.hasPermission.mockReturnValue(false);
  mocks.isUnavailableMemberStatus.mockReturnValue(false);
  mocks.findExecution.mockResolvedValue({
    _id: executionId,
    organizationId: "organization-1",
    documentVersionId: "version-1",
    userId: "owner-1",
    completedPdfStorageKey: "executions/execution-1.pdf",
  });
  mocks.findVersion.mockResolvedValue(null);
  mocks.presignNamedDownload.mockResolvedValue(
    "https://storage.example/execution",
  );
});

test("does not expose another member's completed execution", async () => {
  mocks.requireAuthenticatedUser.mockResolvedValue({
    _id: "other-member",
    organizationId: "organization-1",
    role: "member",
    memberStatus: "active",
  });

  const response = await downloadExecution();

  expect(response.status).toBe(404);
  expect(mocks.presignNamedDownload).not.toHaveBeenCalled();
});

test("downloads the current member's completed execution", async () => {
  mocks.requireAuthenticatedUser.mockResolvedValue({
    _id: "owner-1",
    organizationId: "organization-1",
    role: "member",
    memberStatus: "active",
  });

  const response = await downloadExecution();

  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe(
    "https://storage.example/execution",
  );
  expect(mocks.findExecution).toHaveBeenCalledWith({
    _id: executionId,
    organizationId: "organization-1",
    status: "completed",
  });
  expect(mocks.presignNamedDownload).toHaveBeenCalledWith(
    "executions/execution-1.pdf",
    "Mitgliedschaftsdokument-Nachweis.pdf",
  );
});

function downloadExecution() {
  return GET(new Request("https://example.org"), {
    params: Promise.resolve({ executionId }),
  });
}
