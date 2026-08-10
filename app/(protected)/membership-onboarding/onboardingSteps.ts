import type { MembershipOnboardingContext } from "@/lib/server/memberships/onboardingData";

export type OnboardingStepId =
  | "welcome"
  | `document:${string}`
  | "membership-application";

export type OnboardingStep =
  | {
      id: "welcome";
      kind: "welcome";
      label: string;
      title: string;
      complete: boolean;
      accessible: boolean;
    }
  | {
      id: `document:${string}`;
      kind: "document";
      label: string;
      title: string;
      complete: boolean;
      accessible: boolean;
      document: MembershipOnboardingContext["documents"][number];
    }
  | {
      id: "membership-application";
      kind: "membership-application";
      label: string;
      title: string;
      complete: boolean;
      accessible: boolean;
    };

type WithoutAccess<Step> = Step extends unknown
  ? Omit<Step, "accessible">
  : never;
type StepWithoutAccess = WithoutAccess<OnboardingStep>;

const ONBOARDING_DOCUMENT_TITLES = {
  privacy_notice: {
    label: "Datenschutzerklärung",
    title: "Datenschutzerklärung",
  },
  usage_rights: {
    label: "Sondervereinbarung",
    title: "Sondervereinbarung zu Arbeitsergebnissen",
  },
} as const;

export function buildOnboardingSteps(
  context: MembershipOnboardingContext,
  welcomeComplete: boolean,
): OnboardingStep[] {
  const steps: StepWithoutAccess[] = [
    ...(context.phase === "documents"
      ? [
          {
            id: "welcome" as const,
            kind: "welcome" as const,
            label: "Willkommen",
            title: "Willkommen bei YFN",
            complete: welcomeComplete,
          },
        ]
      : []),
    ...context.documents.map((document) => {
      const presentation =
        document.kind in ONBOARDING_DOCUMENT_TITLES
          ? ONBOARDING_DOCUMENT_TITLES[
              document.kind as keyof typeof ONBOARDING_DOCUMENT_TITLES
            ]
          : { label: document.title, title: document.title };
      return {
        id: `document:${document.executionId}` as const,
        kind: "document" as const,
        label: presentation.label,
        title: presentation.title,
        complete: document.status === "completed",
        document,
      };
    }),
    ...(context.phase === "membership"
      ? [
          {
            id: "membership-application" as const,
            kind: "membership-application" as const,
            label: "Mitgliedsantrag",
            title: "Mitgliedsantrag",
            complete: Boolean(context.profile?.applicationSigned),
          },
        ]
      : []),
  ];

  let previousStepsComplete = true;
  return steps.map((step) => {
    const accessible = previousStepsComplete;
    previousStepsComplete = previousStepsComplete && step.complete;
    return { ...step, accessible } as OnboardingStep;
  });
}

export function initialOnboardingStepId(
  context: MembershipOnboardingContext,
): OnboardingStepId | undefined {
  return buildOnboardingSteps(context, false).find(({ complete }) => !complete)
    ?.id;
}
