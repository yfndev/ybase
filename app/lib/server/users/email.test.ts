import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../email/brevo", () => ({ sendMail: vi.fn() }));

import { sendMail } from "../../email/brevo";
import {
  notifyTeamOnboardingChange,
  sendWorkspaceAccountReadyEmail,
} from "./email";

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
  it("emits only for actual state transitions", async () => {
    await notifyTeamOnboardingChange({
      user,
      previous: "not_started",
      next: "not_started",
    });

    expect(sendMail).not.toHaveBeenCalled();
  });

  it("sends the onboarding-required template when onboarding starts", async () => {
    await notifyTeamOnboardingChange({
      user,
      previous: "not_started",
      next: "in_progress",
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: [{ email: "alex@example.com", name: "Alex Beispiel" }],
        templateId: 171,
        params: expect.objectContaining({ memberName: "Alex Beispiel" }),
      }),
    );
  });

  it("does not send a separate team onboarding completion email", async () => {
    await notifyTeamOnboardingChange({
      user,
      previous: "in_progress",
      next: "completed",
    });

    expect(sendMail).not.toHaveBeenCalled();
  });

  it("sends Workspace credentials with the resolved Brevo template", async () => {
    await sendWorkspaceAccountReadyEmail({
      recoveryEmail: "alex@example.com",
      applicantName: "Alex Beispiel",
      workspaceEmail: "alex@youngfounders.network",
      temporaryPassword: "temporary-password",
      loginUrl: "https://ybase.example/login",
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 172,
        params: expect.objectContaining({
          memberName: "Alex Beispiel",
          workspaceEmail: "alex@youngfounders.network",
          temporaryPassword: "temporary-password",
          loginUrl: "https://ybase.example/login",
        }),
      }),
    );
  });
});
