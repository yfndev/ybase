import { describe, expect, test } from "vitest";
import { applicationDecisionEmailDefaults } from "./decisionEmail";

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
