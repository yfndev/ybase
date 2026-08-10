import { describe, expect, it } from "vitest";
import type { MembershipOnboardingContext } from "@/lib/server/memberships/onboardingData";
import { buildOnboardingSteps } from "./onboardingSteps";

const context: MembershipOnboardingContext = {
  phase: "documents",
  activated: false,
  documentsComplete: false,
  documents: [
    {
      executionId: "privacy",
      kind: "privacy_notice",
      title: "Interne Datenschutzerklärung",
      versionLabel: "1.0",
      type: "acknowledgement",
      status: "assigned",
      content: "<p>Datenschutz</p>",
    },
    {
      executionId: "usage-rights",
      kind: "usage_rights",
      title: "Sondervereinbarung Arbeitsergebnisse",
      versionLabel: "1.0",
      type: "signature",
      status: "assigned",
      content: "<p>Arbeitsergebnisse</p>",
    },
  ],
};

describe("buildOnboardingSteps", () => {
  it("presents the document onboarding as three concise pages", () => {
    const steps = buildOnboardingSteps(context, false);

    expect(steps.map(({ label }) => label)).toEqual([
      "Willkommen",
      "Datenschutzerklärung",
      "Sondervereinbarung",
    ]);
    expect(steps.map(({ title }) => title)).toEqual([
      "Willkommen bei YFN",
      "Datenschutzerklärung",
      "Sondervereinbarung zu Arbeitsergebnissen",
    ]);
    expect(steps.map(({ accessible }) => accessible)).toEqual([
      true,
      false,
      false,
    ]);
  });

  it("keeps completed pages accessible while unlocking the next page", () => {
    const completedContext: MembershipOnboardingContext = {
      ...context,
      documents: [
        { ...context.documents[0], status: "completed" },
        context.documents[1],
      ],
    };

    const steps = buildOnboardingSteps(completedContext, true);

    expect(steps.map(({ complete }) => complete)).toEqual([true, true, false]);
    expect(steps.every(({ accessible }) => accessible)).toBe(true);
  });
});
