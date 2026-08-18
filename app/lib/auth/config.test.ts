import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureAppUser: vi.fn(),
  isLinkedWorkspaceUser: vi.fn(),
}));

vi.mock("./provisioning", () => ({
  ensureAppUser: mocks.ensureAppUser,
  isLinkedWorkspaceUser: mocks.isLinkedWorkspaceUser,
}));

import { authConfig } from "./config";

describe("auth config", () => {
  beforeEach(() => {
    mocks.ensureAppUser.mockReset();
    mocks.isLinkedWorkspaceUser.mockReset();
  });

  it("refreshes a persisted session against the current database", async () => {
    mocks.ensureAppUser.mockResolvedValue({
      _id: "new-user-id",
      _creationTime: 1,
      email: "local@example.com",
      organizationId: "new-organization-id",
      role: "finance",
      profileImageStorageKey: "profile-image",
      publicProfileCompletedAt: 123,
    });
    const token = {
      email: "local@example.com",
      userId: "stale-user-id",
      organizationId: "stale-organization-id",
      role: "admin",
    };

    // Auth.js omits user for persisted JWT sessions despite requiring it in the callback type.
    const result = await authConfig.callbacks.jwt({
      token,
    } as unknown as Parameters<typeof authConfig.callbacks.jwt>[0]);

    expect(mocks.ensureAppUser).toHaveBeenCalledWith({
      email: "local@example.com",
      googleWorkspaceUserId: undefined,
      name: undefined,
      image: undefined,
      firstName: undefined,
      lastName: undefined,
    });
    expect(result).toMatchObject({
      userId: "new-user-id",
      organizationId: "new-organization-id",
      role: "finance",
      profileImageStorageKey: "profile-image",
      publicProfileCompletedAt: 123,
    });
  });

  it("allows linked accounts from another Workspace domain", async () => {
    mocks.isLinkedWorkspaceUser.mockResolvedValue(true);

    const result = await authConfig.callbacks.signIn({
      user: { id: "google-id", email: "member@ybudget.de" },
      account: {
        provider: "google",
        providerAccountId: "google-id",
      },
    } as Parameters<typeof authConfig.callbacks.signIn>[0]);

    expect(result).toBe(true);
    expect(mocks.isLinkedWorkspaceUser).toHaveBeenCalledWith("google-id");
  });

  it("rejects unknown accounts from another domain", async () => {
    mocks.isLinkedWorkspaceUser.mockResolvedValue(false);

    const result = await authConfig.callbacks.signIn({
      user: { id: "google-id", email: "unknown@example.com" },
      account: {
        provider: "google",
        providerAccountId: "google-id",
      },
    } as Parameters<typeof authConfig.callbacks.signIn>[0]);

    expect(result).toBe(false);
  });

  it("keeps the People & Culture role in the session", () => {
    const session = { user: { id: "", role: undefined }, expires: "later" };

    const result = authConfig.callbacks.session({
      session,
      token: {
        userId: "user-id",
        organizationId: "organization-id",
        role: "people_culture",
      },
    } as unknown as Parameters<typeof authConfig.callbacks.session>[0]);

    expect(result.user).toMatchObject({
      id: "user-id",
      organizationId: "organization-id",
      role: "people_culture",
    });
  });

  it("limits invalid session roles to member access", () => {
    const session = { user: { id: "", role: undefined }, expires: "later" };

    const result = authConfig.callbacks.session({
      session,
      token: { userId: "user-id", role: "invalid" },
    } as unknown as Parameters<typeof authConfig.callbacks.session>[0]);

    expect(result.user.role).toBe("member");
  });
});
