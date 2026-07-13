import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureAppUser: vi.fn(),
}));

vi.mock("./environment", () => ({
  isLocalCredentialsEnabled: () => false,
}));
vi.mock("./provisioning", () => ({
  ensureAppUser: mocks.ensureAppUser,
}));

import { authConfig } from "./config";

describe("auth config", () => {
  beforeEach(() => {
    mocks.ensureAppUser.mockReset();
  });

  it("refreshes a persisted session against the current database", async () => {
    mocks.ensureAppUser.mockResolvedValue({
      _id: "new-user-id",
      _creationTime: 1,
      email: "local@example.com",
      organizationId: "new-organization-id",
      role: "finance",
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
      name: undefined,
      image: undefined,
      firstName: undefined,
      lastName: undefined,
    });
    expect(result).toMatchObject({
      userId: "new-user-id",
      organizationId: "new-organization-id",
      role: "finance",
    });
  });
});
