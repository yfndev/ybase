import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../googleWorkspace/users", () => ({
  provisionWorkspaceUser: vi.fn(),
}));
vi.mock("./email", () => ({
  requireTeamWelcomeTemplateId: vi.fn(),
  sendTeamWelcomeEmail: vi.fn(),
}));

import { provisionWorkspaceUser } from "../../googleWorkspace/users";
import { requireTeamWelcomeTemplateId, sendTeamWelcomeEmail } from "./email";
import { provisionManualMemberWorkspace } from "./manualWorkspaceProvisioning";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(provisionWorkspaceUser).mockResolvedValue({
    userId: "google-user-1",
    primaryEmail: "alex@youngfounders.network",
    temporaryPassword: "temporary-password",
  });
  vi.mocked(requireTeamWelcomeTemplateId).mockReturnValue(175);
  vi.mocked(sendTeamWelcomeEmail).mockResolvedValue();
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
  expect(sendTeamWelcomeEmail).toHaveBeenCalledWith({
    recoveryEmail: "alex@example.com",
    memberName: "Alex Beispiel",
    workspaceEmail: "alex@youngfounders.network",
    temporaryPassword: "temporary-password",
  });
});

test("fails onboarding when the team welcome email is not delivered", async () => {
  vi.mocked(sendTeamWelcomeEmail).mockRejectedValueOnce(
    new Error("Team-Zugang konnte nicht versendet werden"),
  );

  await expect(
    provisionManualMemberWorkspace({
      name: "Alex Beispiel",
      primaryEmail: "alex@youngfounders.network",
      privateEmail: "alex@example.com",
    }),
  ).rejects.toThrow("Team-Zugang konnte nicht versendet werden");
});

test("does not provision before the access template is configured", async () => {
  vi.mocked(requireTeamWelcomeTemplateId).mockImplementationOnce(() => {
    throw new Error(
      "Brevo-Template für den Team-Zugang ist nicht konfiguriert",
    );
  });

  await expect(
    provisionManualMemberWorkspace({
      name: "Alex Beispiel",
      primaryEmail: "alex@youngfounders.network",
      privateEmail: "alex@example.com",
    }),
  ).rejects.toThrow("nicht konfiguriert");
  expect(provisionWorkspaceUser).not.toHaveBeenCalled();
});
