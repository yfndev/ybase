import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../email/brevo", () => ({ sendMail: vi.fn() }));

import { sendMail } from "../../email/brevo";
import { sendTeamWelcomeEmail, sendUserStateEmail } from "./email";

const user = {
  name: "Alex Beispiel",
  email: "alex@youngfounders.network",
  privateEmail: "alex@example.com",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(sendMail).mockResolvedValue({ status: "sent" });
});

describe("user-state emails", () => {
  it("sends team access and onboarding details in one email", async () => {
    await sendTeamWelcomeEmail({
      recoveryEmail: "alex@example.com",
      memberName: "Alex Beispiel",
      workspaceEmail: "alex@youngfounders.network",
      temporaryPassword: "temporary-password",
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 175,
        params: expect.objectContaining({
          memberName: "Alex Beispiel",
          workspaceEmail: "alex@youngfounders.network",
          temporaryPassword: "temporary-password",
        }),
      }),
    );
  });

  it("sends the membership invitation after the getting-to-know phase", async () => {
    await sendUserStateEmail({ user, event: "membership_invitation" });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 176,
        params: expect.objectContaining({ memberName: "Alex Beispiel" }),
      }),
    );
  });
});
