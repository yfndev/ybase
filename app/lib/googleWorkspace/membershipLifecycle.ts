import { WorkspaceApiError, workspaceRequest } from "./client";
import { isDisplayableWorkspaceError } from "./errors";

export type WorkspaceLifecycleDirectory = {
  suspendUser(userKey: string): Promise<void>;
  restoreUser(userKey: string): Promise<void>;
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
  action: "gesperrt" | "reaktiviert",
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
