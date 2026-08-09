import { beforeEach, describe, expect, test, vi } from "vitest";
import { WorkspaceApiError } from "./client";
import {
  createWorkspaceLifecycleDirectory,
  deleteWorkspaceUser,
  restoreWorkspaceUser,
  suspendWorkspaceUser,
  type WorkspaceLifecycleDirectory,
} from "./membershipLifecycle";

type WorkspaceRequester = (
  path: string,
  init?: { method?: string; data?: unknown },
) => Promise<unknown>;

let request: ReturnType<typeof vi.fn<WorkspaceRequester>>;

beforeEach(() => {
  request = vi.fn<WorkspaceRequester>().mockResolvedValue(undefined);
});

function directory(): WorkspaceLifecycleDirectory {
  return {
    suspendUser: vi.fn().mockResolvedValue(undefined),
    restoreUser: vi.fn().mockResolvedValue(undefined),
    deleteUser: vi.fn().mockResolvedValue(undefined),
  };
}

describe("workspace membership lifecycle", () => {
  test("suspends and restores an account through the directory adapter", async () => {
    const workspace = directory();

    await suspendWorkspaceUser("google-user-1", workspace);
    await restoreWorkspaceUser("google-user-1", workspace);

    expect(workspace.suspendUser).toHaveBeenCalledWith("google-user-1");
    expect(workspace.restoreUser).toHaveBeenCalledWith("google-user-1");
  });

  test("updates the Google suspension flag idempotently", async () => {
    const workspace = createWorkspaceLifecycleDirectory(request);

    await suspendWorkspaceUser("google/user-1", workspace);
    await restoreWorkspaceUser("google/user-1", workspace);

    expect(request).toHaveBeenNthCalledWith(1, "users/google%2Fuser-1", {
      method: "PATCH",
      data: { suspended: true },
    });
    expect(request).toHaveBeenNthCalledWith(2, "users/google%2Fuser-1", {
      method: "PATCH",
      data: { suspended: false },
    });
  });

  test("deletes an account through the directory adapter", async () => {
    const workspace = createWorkspaceLifecycleDirectory(request);

    await deleteWorkspaceUser("google/user-1", workspace);

    expect(request).toHaveBeenCalledWith("users/google%2Fuser-1", {
      method: "DELETE",
    });
  });

  test("treats an already deleted account as a successful retry", async () => {
    request.mockRejectedValue(new WorkspaceApiError(404));
    const workspace = createWorkspaceLifecycleDirectory(request);

    await expect(
      deleteWorkspaceUser("google-user-1", workspace),
    ).resolves.toBeUndefined();
  });

  test("reports missing Google permissions as a lifecycle error", async () => {
    request.mockRejectedValue(new WorkspaceApiError(403));
    const workspace = createWorkspaceLifecycleDirectory(request);

    await expect(
      suspendWorkspaceUser("google-user-1", workspace),
    ).rejects.toThrow("Kontoänderung nicht autorisiert");
  });
});
