import { randomBytes } from "node:crypto";
import { WorkspaceApiError, workspaceRequest } from "./client";
import { isDisplayableWorkspaceError } from "./errors";

const APPLICATION_ID_TYPE = "ybase_application_id";

export type WorkspaceUser = {
  id: string;
  primaryEmail: string;
  externalIds?: Array<{
    type?: string;
    customType?: string;
    value?: string;
  }>;
};

export type WorkspaceDirectory = {
  createUser(input: {
    applicationId: string;
    primaryEmail: string;
    recoveryEmail: string;
    givenName: string;
    familyName: string;
    password: string;
  }): Promise<WorkspaceUser>;
  getUser(userKey: string): Promise<WorkspaceUser | null>;
  resetPassword(userKey: string, password: string): Promise<void>;
};

export async function provisionWorkspaceUser(
  input: {
    applicationId: string;
    existingUserId?: string;
    primaryEmail: string;
    recoveryEmail: string;
    givenName: string;
    familyName: string;
  },
  directory: WorkspaceDirectory = createWorkspaceDirectory(),
): Promise<{
  userId: string;
  primaryEmail: string;
  temporaryPassword: string;
}> {
  const temporaryPassword = createTemporaryPassword();
  const existing = input.existingUserId
    ? await directory.getUser(input.existingUserId)
    : await directory.getUser(input.primaryEmail);

  if (existing) {
    const belongsToApplication =
      existing.id === input.existingUserId ||
      existing.externalIds?.some(
        (externalId) =>
          externalId.type === "custom" &&
          externalId.customType === APPLICATION_ID_TYPE &&
          externalId.value === input.applicationId,
      );
    if (!belongsToApplication) {
      throw new Error("Diese Workspace-E-Mail ist bereits vergeben");
    }
    if (
      existing.primaryEmail.trim().toLowerCase() !==
      input.primaryEmail.trim().toLowerCase()
    ) {
      throw new Error("Das Workspace-Konto verwendet eine andere E-Mail");
    }
    await directory.resetPassword(existing.id, temporaryPassword);
    return {
      userId: existing.id,
      primaryEmail: existing.primaryEmail,
      temporaryPassword,
    };
  }

  const created = await directory.createUser({
    applicationId: input.applicationId,
    primaryEmail: input.primaryEmail,
    recoveryEmail: input.recoveryEmail,
    givenName: input.givenName,
    familyName: input.familyName,
    password: temporaryPassword,
  });
  return {
    userId: created.id,
    primaryEmail: created.primaryEmail,
    temporaryPassword,
  };
}

function createWorkspaceDirectory(): WorkspaceDirectory {
  const orgUnitPath = process.env.GOOGLE_WORKSPACE_ORG_UNIT_PATH?.trim() || "/";

  return {
    async getUser(userKey) {
      try {
        return await workspaceRequest<WorkspaceUser>(
          `users/${encodeURIComponent(userKey)}`,
        );
      } catch (error) {
        if (error instanceof WorkspaceApiError && error.status === 404) {
          return null;
        }
        throw workspaceApiError(error);
      }
    },
    async createUser(input) {
      try {
        return await workspaceRequest<WorkspaceUser>("users", {
          method: "POST",
          data: {
            primaryEmail: input.primaryEmail,
            recoveryEmail: input.recoveryEmail,
            name: {
              givenName: input.givenName,
              familyName: input.familyName,
            },
            password: input.password,
            changePasswordAtNextLogin: true,
            orgUnitPath,
            externalIds: [
              {
                type: "custom",
                customType: APPLICATION_ID_TYPE,
                value: input.applicationId,
              },
            ],
          },
        });
      } catch (error) {
        throw workspaceApiError(error);
      }
    },
    async resetPassword(userKey, password) {
      try {
        await workspaceRequest(`users/${encodeURIComponent(userKey)}`, {
          method: "PATCH",
          data: { password, changePasswordAtNextLogin: true },
        });
      } catch (error) {
        throw workspaceApiError(error);
      }
    },
  };
}

function createTemporaryPassword(): string {
  return `${randomBytes(24).toString("base64url")}aA1!`;
}

function workspaceApiError(error: unknown): Error {
  if (isDisplayableWorkspaceError(error)) {
    return error;
  }
  if (error instanceof WorkspaceApiError && error.status === 409) {
    return new Error("Diese Workspace-E-Mail ist bereits vergeben");
  }
  if (
    error instanceof WorkspaceApiError &&
    (error.status === 401 || error.status === 403)
  ) {
    return new Error(
      "Google Workspace hat die Kontoerstellung nicht autorisiert",
    );
  }
  return new Error("Google Workspace-Konto konnte nicht erstellt werden");
}
