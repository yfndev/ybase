import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../googleWorkspace/users", () => ({
  provisionWorkspaceUser: vi.fn(),
}));
vi.mock("./email", () => ({
  requireWorkspaceAccountReadyTemplateId: vi.fn(),
  sendUserStateEmail: vi.fn(),
  sendWorkspaceAccountReadyEmail: vi.fn(),
}));

import { provisionWorkspaceUser } from "../../googleWorkspace/users";
import {
  requireWorkspaceAccountReadyTemplateId,
  sendUserStateEmail,
  sendWorkspaceAccountReadyEmail,
} from "./email";
import { provisionManualMemberWorkspace } from "./manualWorkspaceProvisioning";

afterEach(() => vi.unstubAllEnvs());

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://ybase.example");
  vi.mocked(provisionWorkspaceUser).mockResolvedValue({
    userId: "google-user-1",
    primaryEmail: "alex@youngfounders.network",
    temporaryPassword: "temporary-password",
  });
  vi.mocked(requireWorkspaceAccountReadyTemplateId).mockReturnValue(170);
  vi.mocked(sendUserStateEmail).mockResolvedValue();
  vi.mocked(sendWorkspaceAccountReadyEmail).mockResolvedValue();
});

test("creates a Workspace account and sends its credentials privately", async () => {
  await expect(
    provisionManualMemberWorkspace({
      name: "Alex Beispiel",
      primaryEmail: "alex@youngfounders.network",
      privateEmail: "alex@example.com",
    }),
  ).resolves.toEqual({ userId: "google-user-1" });

  expect(provisionWorkspaceUser).toHaveBeenCalledWith({
    applicationId: "manual-member:alex@youngfounders.network",
    primaryEmail: "alex@youngfounders.network",
    recoveryEmail: "alex@example.com",
    givenName: "Alex",
    familyName: "Beispiel",
  });
  expect(sendWorkspaceAccountReadyEmail).toHaveBeenCalledWith({
    recoveryEmail: "alex@example.com",
    applicantName: "Alex Beispiel",
    workspaceEmail: "alex@youngfounders.network",
    temporaryPassword: "temporary-password",
    loginUrl: "https://ybase.example/login",
  });
  expect(sendUserStateEmail).toHaveBeenCalledWith({
    user: {
      name: "Alex Beispiel",
      email: "alex@youngfounders.network",
      privateEmail: "alex@example.com",
    },
    event: "team_onboarding_started",
  });
  expect(
    vi.mocked(sendWorkspaceAccountReadyEmail).mock.invocationCallOrder[0],
  ).toBeLessThan(vi.mocked(sendUserStateEmail).mock.invocationCallOrder[0]);
});

test("fails onboarding when Workspace credentials are not delivered", async () => {
  vi.mocked(sendWorkspaceAccountReadyEmail).mockRejectedValueOnce(
    new Error("Google-Workspace-Zugang konnte nicht versendet werden"),
  );

  await expect(
    provisionManualMemberWorkspace({
      name: "Alex Beispiel",
      primaryEmail: "alex@youngfounders.network",
      privateEmail: "alex@example.com",
    }),
  ).rejects.toThrow("Google-Workspace-Zugang konnte nicht versendet werden");
});

test("does not provision before the access template is configured", async () => {
  vi.mocked(requireWorkspaceAccountReadyTemplateId).mockImplementationOnce(
    () => {
      throw new Error(
        "Brevo-Template für Google-Workspace-Zugang ist nicht konfiguriert",
      );
    },
  );

  await expect(
    provisionManualMemberWorkspace({
      name: "Alex Beispiel",
      primaryEmail: "alex@youngfounders.network",
      privateEmail: "alex@example.com",
    }),
  ).rejects.toThrow("nicht konfiguriert");
  expect(provisionWorkspaceUser).not.toHaveBeenCalled();
});

test("validates the login URL before creating the account", async () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
  vi.stubEnv("AUTH_URL", "");

  await expect(
    provisionManualMemberWorkspace({
      name: "Alex Beispiel",
      primaryEmail: "alex@youngfounders.network",
      privateEmail: "alex@example.com",
    }),
  ).rejects.toThrow("NEXT_PUBLIC_APP_URL");
  expect(provisionWorkspaceUser).not.toHaveBeenCalled();
});
