import { WorkspaceApiError, workspaceRequest } from "./client";
import { isDisplayableWorkspaceError } from "./errors";

export type WorkspaceLifecycleDirectory = {
  suspendUser(userKey: string): Promise<void>;
  restoreUser(userKey: string): Promise<void>;
  deleteUser(userKey: string): Promise<void>;
};

type WorkspaceRequester = (
  path: string,
  init?: { method?: string; data?: unknown },
) => Promise<unknown>;

export async function suspendWorkspaceUser(
  userKey: string,
  directory: WorkspaceLifecycleDirectory = createWorkspaceLifecycleDirectory(),
): Promise<void> {
  await directory.suspendUser(userKey);
}

export async function restoreWorkspaceUser(
  userKey: string,
  directory: WorkspaceLifecycleDirectory = createWorkspaceLifecycleDirectory(),
): Promise<void> {
  await directory.restoreUser(userKey);
}

export async function deleteWorkspaceUser(
  userKey: string,
  directory: WorkspaceLifecycleDirectory = createWorkspaceLifecycleDirectory(),
): Promise<void> {
  await directory.deleteUser(userKey);
}

export function createWorkspaceLifecycleDirectory(
  request: WorkspaceRequester = workspaceRequest,
): WorkspaceLifecycleDirectory {
  return {
    async suspendUser(userKey) {
      await updateWorkspaceSuspension(request, userKey, true);
    },
    async restoreUser(userKey) {
      await updateWorkspaceSuspension(request, userKey, false);
    },
    async deleteUser(userKey) {
      try {
        await request(`users/${encodeURIComponent(userKey)}`, {
          method: "DELETE",
        });
      } catch (error) {
        if (error instanceof WorkspaceApiError && error.status === 404) return;
        throw workspaceLifecycleApiError(error, "gelöscht");
      }
    },
  };
}

async function updateWorkspaceSuspension(
  request: WorkspaceRequester,
  userKey: string,
  isSuspended: boolean,
): Promise<void> {
  try {
    await request(`users/${encodeURIComponent(userKey)}`, {
      method: "PATCH",
      data: { suspended: isSuspended },
    });
  } catch (error) {
    throw workspaceLifecycleApiError(
      error,
      isSuspended ? "gesperrt" : "reaktiviert",
    );
  }
}

function workspaceLifecycleApiError(
  error: unknown,
  action: "gelöscht" | "gesperrt" | "reaktiviert",
): Error {
  if (isDisplayableWorkspaceError(error)) {
    return error;
  }
  if (
    error instanceof WorkspaceApiError &&
    (error.status === 401 || error.status === 403)
  ) {
    return new Error(
      "Google Workspace hat die Kontoänderung nicht autorisiert",
    );
  }
  return new Error(`Google Workspace-Konto konnte nicht ${action} werden`);
}
