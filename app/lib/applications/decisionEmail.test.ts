import { describe, expect, test } from "vitest";
import {
  appendWorkspaceAccessDetails,
  applicationDecisionEmailDefaults,
} from "./decisionEmail";

describe("applicationDecisionEmailDefaults", () => {
  test("prefills an acceptance email with applicant and job title", () => {
    const email = applicationDecisionEmailDefaults({
      decision: "accepted",
      applicantName: "Alex Beispiel",
      jobTitle: "Fundraising",
    });

    expect(email.subject).toContain("Zusage");
    expect(email.subject).toContain("Fundraising");
    expect(email.message).toContain("Hey Alex Beispiel");
    expect(email.message).toContain("Zusage");
  });

  test("adds temporary Workspace access details", () => {
    const message = appendWorkspaceAccessDetails({
      message: "Willkommen im Team!",
      primaryEmail: "alex@youngfounders.network",
      temporaryPassword: "temporary-password",
      loginUrl: "https://ybase.example/login",
    });

    expect(message).toContain("alex@youngfounders.network");
    expect(message).toContain("temporary-password");
    expect(message).toContain("https://ybase.example/login");
  });

  test("prefills a rejection email without requiring a name", () => {
    const email = applicationDecisionEmailDefaults({
      decision: "rejected",
      jobTitle: "Kommunikation",
    });

    expect(email.subject).toContain("Kommunikation");
    expect(email.message).toContain("Hey,");
    expect(email.message).toContain("keine Zusage");
  });
});
