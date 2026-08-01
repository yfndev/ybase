import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../email/brevo", () => ({ sendMail: vi.fn() }));
vi.mock("../../googleWorkspace/users", () => ({
  provisionWorkspaceUser: vi.fn(),
}));

import { sendMail } from "../../email/brevo";
import { BREVO_TEMPLATE_IDS } from "../../email/templates";
import { provisionWorkspaceUser } from "../../googleWorkspace/users";
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
  vi.mocked(sendMail).mockResolvedValue({
    status: "sent",
    messageId: "message-1",
  });
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
  expect(sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: [{ email: "alex@example.com", name: "Alex Beispiel" }],
      templateId: BREVO_TEMPLATE_IDS.APPLICATION_ACCEPTED,
      subject: "Deine Zugangsdaten für YFN",
      params: expect.objectContaining({
        message: expect.stringContaining("temporary-password"),
      }),
    }),
  );
});

test.each([
  { status: "skipped", reason: "disabled" } as const,
  { status: "skipped", reason: "recipient-not-allowed" } as const,
])("fails onboarding when credentials are not delivered", async (delivery) => {
  vi.mocked(sendMail).mockResolvedValueOnce(delivery);

  await expect(
    provisionManualMemberWorkspace({
      name: "Alex Beispiel",
      primaryEmail: "alex@youngfounders.network",
      privateEmail: "alex@example.com",
    }),
  ).rejects.toThrow("Zugangsdaten konnten nicht versendet werden");
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
