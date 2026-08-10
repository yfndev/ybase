import { describe, expect, it } from "vitest";
import { BREVO_TEMPLATE_IDS, USER_STATE_EMAIL_TEMPLATES } from "./templates";

describe("user-state Brevo templates", () => {
  it("uses the central static Brevo template catalog", () => {
    expect(BREVO_TEMPLATE_IDS.TEAM_WELCOME).toBe(175);
    expect(BREVO_TEMPLATE_IDS.MEMBERSHIP_INVITATION).toBe(176);
    expect(USER_STATE_EMAIL_TEMPLATES.membership_invitation.templateId).toBe(
      BREVO_TEMPLATE_IDS.MEMBERSHIP_INVITATION,
    );
  });

  it("keeps every user-state event tagged", () => {
    expect(Object.keys(USER_STATE_EMAIL_TEMPLATES)).toEqual([
      "getting_to_know_started",
      "getting_to_know_due",
      "getting_to_know_ended",
      "membership_invitation",
    ]);
    for (const template of Object.values(USER_STATE_EMAIL_TEMPLATES)) {
      expect(template.tag).toMatch(/\S/);
    }
  });
});
