import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../email/brevo", () => ({ sendMail: vi.fn() }));

import { sendMail } from "../../email/brevo";
import {
  notifyMemberStatusChange,
  notifyTeamOnboardingChange,
  sendUserStateEmail,
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
  it("does not send before the static Brevo ID is configured", async () => {
    await sendUserStateEmail({ user, event: "member_activated" });

    expect(sendMail).not.toHaveBeenCalled();
  });

  it("emits only for actual state transitions", async () => {
    await notifyMemberStatusChange({
      user,
      previous: "active",
      next: "active",
    });
    await notifyTeamOnboardingChange({
      user,
      previous: "not_started",
      next: "not_started",
    });

    expect(sendMail).not.toHaveBeenCalled();
  });

  it("supports a dedicated Workspace account email", async () => {
    await sendWorkspaceAccountReadyEmail({
      recoveryEmail: "alex@example.com",
      applicantName: "Alex Beispiel",
      workspaceEmail: "alex@youngfounders.network",
      temporaryPassword: "temporary-password",
      loginUrl: "https://ybase.example/login",
    });

    expect(sendMail).not.toHaveBeenCalled();
  });
});
