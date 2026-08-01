import { describe, expect, it } from "vitest";
import { BREVO_TEMPLATE_IDS, USER_STATE_EMAIL_TEMPLATES } from "./templates";

describe("user-state Brevo templates", () => {
  it("uses the central static Brevo template catalog", () => {
    expect(USER_STATE_EMAIL_TEMPLATES.member_activated.templateId).toBe(
      BREVO_TEMPLATE_IDS.MEMBER_ACTIVATED,
    );
    expect(USER_STATE_EMAIL_TEMPLATES.workspace_account_ready.templateId).toBe(
      BREVO_TEMPLATE_IDS.WORKSPACE_ACCOUNT_READY,
    );
  });

  it("keeps every user-state event tagged", () => {
    for (const template of Object.values(USER_STATE_EMAIL_TEMPLATES)) {
      expect(template.tag).toMatch(/\S/);
    }
  });
});
