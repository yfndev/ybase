import { describe, expect, it } from "vitest";
import { BREVO_TEMPLATE_IDS, USER_STATE_EMAIL_TEMPLATES } from "./templates";

describe("user-state Brevo templates", () => {
  it("uses the central static Brevo template catalog", () => {
    expect(BREVO_TEMPLATE_IDS.MEMBERSHIP_GUARDIAN_CONSENT).toBeUndefined();
    expect(BREVO_TEMPLATE_IDS.TEAM_ONBOARDING_STARTED).toBe(171);
    expect(BREVO_TEMPLATE_IDS.WORKSPACE_ACCOUNT_READY).toBe(172);
    expect(USER_STATE_EMAIL_TEMPLATES.team_onboarding_started.templateId).toBe(
      BREVO_TEMPLATE_IDS.TEAM_ONBOARDING_STARTED,
    );
    expect(USER_STATE_EMAIL_TEMPLATES.workspace_account_ready.templateId).toBe(
      BREVO_TEMPLATE_IDS.WORKSPACE_ACCOUNT_READY,
    );
  });

  it("keeps every user-state event tagged", () => {
    expect(Object.keys(USER_STATE_EMAIL_TEMPLATES)).toEqual([
      "team_onboarding_started",
      "workspace_account_ready",
    ]);
    for (const template of Object.values(USER_STATE_EMAIL_TEMPLATES)) {
      expect(template.tag).toMatch(/\S/);
    }
  });
});
