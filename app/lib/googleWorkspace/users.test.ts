import { afterEach, describe, expect, test, vi } from "vitest";
import {
  provisionWorkspaceUser,
  type WorkspaceDirectory,
  type WorkspaceUser,
} from "./users";

const input = {
  applicationId: "application-1",
  primaryEmail: "alex@youngfounders.network",
  recoveryEmail: "alex@example.com",
  givenName: "Alex",
  familyName: "Beispiel",
};

afterEach(() => vi.unstubAllEnvs());

function directory(overrides: Partial<WorkspaceDirectory> = {}) {
  const created: WorkspaceUser = {
    id: "google-user-1",
    primaryEmail: input.primaryEmail,
  };
  return {
    createUser: vi.fn().mockResolvedValue(created),
    getUser: vi.fn().mockResolvedValue(null),
    resetPassword: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } satisfies WorkspaceDirectory;
}

describe("provisionWorkspaceUser", () => {
  test("creates a new account with a temporary password", async () => {
    const workspace = directory();

    const result = await provisionWorkspaceUser(input, workspace);

    expect(workspace.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: input.applicationId,
        primaryEmail: input.primaryEmail,
        password: expect.stringMatching(/^.{12,}$/),
      }),
    );
    expect(result).toMatchObject({
      userId: "google-user-1",
      primaryEmail: input.primaryEmail,
    });
    expect(result.temporaryPassword).not.toBe("");
  });

  test("recovers an account marked with the application id", async () => {
    const workspace = directory({
      getUser: vi.fn().mockResolvedValue({
        id: "google-user-1",
        primaryEmail: input.primaryEmail,
        externalIds: [
          {
            type: "custom",
            customType: "ybase_application_id",
            value: input.applicationId,
          },
        ],
      }),
    });

    await provisionWorkspaceUser(input, workspace);

    expect(workspace.createUser).not.toHaveBeenCalled();
    expect(workspace.resetPassword).toHaveBeenCalledWith(
      "google-user-1",
      expect.any(String),
    );
  });

  test("rejects an existing account that belongs to someone else", async () => {
    const workspace = directory({
      getUser: vi.fn().mockResolvedValue({
        id: "google-user-2",
        primaryEmail: input.primaryEmail,
      }),
    });

    await expect(provisionWorkspaceUser(input, workspace)).rejects.toThrow(
      "bereits vergeben",
    );
    expect(workspace.resetPassword).not.toHaveBeenCalled();
  });

  test("reports a missing Workspace configuration", async () => {
    vi.stubEnv("GOOGLE_WORKSPACE_SERVICE_ACCOUNT_JSON_BASE64", "");

    await expect(provisionWorkspaceUser(input)).rejects.toThrow(
      "Google-Workspace-Integration ist nicht konfiguriert",
    );
  });
});
