"use client";

import {
  getOwnMembershipOnboardingContext,
  type MembershipOnboardingContext,
} from "@/lib/server/memberships/onboardingData";
import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  buildOnboardingSteps,
  initialOnboardingStepId,
  type OnboardingStep,
  type OnboardingStepId,
} from "./onboardingSteps";

const LOAD_ERROR = "Das Onboarding konnte nicht geladen werden.";

interface OnboardingState {
  context?: MembershipOnboardingContext;
  error?: string;
  steps: OnboardingStep[];
  activeStep?: OnboardingStep;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  goToStep: (stepId: OnboardingStepId) => void;
  goPrevious: () => void;
  goNext: () => void;
  done: boolean;
  reload: () => Promise<void>;
}

const OnboardingStateContext = createContext<OnboardingState | undefined>(
  undefined,
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [context, setContext] = useState<MembershipOnboardingContext>();
  const [error, setError] = useState<string>();
  const [activeStepId, setActiveStepId] = useState<OnboardingStepId>("welcome");
  const [welcomeComplete, setWelcomeComplete] = useState(false);

  const reload = useCallback(async () => {
    try {
      const next = await getOwnMembershipOnboardingContext();
      if ("blocked" in next) {
        setError(next.blocked);
        return;
      }
      setContext(next);
      setError(undefined);
      setActiveStepId((current) => {
        const steps = buildOnboardingSteps(next, false);
        return steps.some(({ id }) => id === current)
          ? current
          : (initialOnboardingStepId(next) ?? steps[0]?.id ?? current);
      });
      if (next.activated && next.phase === "membership") router.refresh();
    } catch {
      setError(LOAD_ERROR);
    }
  }, [router]);

  useEffect(() => void reload(), [reload]);

  const steps = context ? buildOnboardingSteps(context, welcomeComplete) : [];
  const activeIndex = steps.findIndex(({ id }) => id === activeStepId);
  const activeStep = activeIndex === -1 ? undefined : steps[activeIndex];
  const nextStep = activeIndex === -1 ? undefined : steps[activeIndex + 1];

  function scrollToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  function goToStep(stepId: OnboardingStepId) {
    const step = steps.find(({ id }) => id === stepId);
    if (!step?.accessible || step.id === activeStepId) return;
    setActiveStepId(stepId);
    scrollToTop();
  }

  function goPrevious() {
    const previous = steps[activeIndex - 1];
    if (!previous) return;
    setActiveStepId(previous.id);
    scrollToTop();
  }

  function goNext() {
    if (!activeStep || !nextStep) return;
    if (activeStep.kind !== "welcome" && !activeStep.complete) return;
    if (activeStep.kind === "welcome") setWelcomeComplete(true);
    setActiveStepId(nextStep.id);
    scrollToTop();
  }

  const value: OnboardingState = {
    context,
    error,
    reload,
    steps,
    activeStep,
    canGoPrevious: activeIndex > 0,
    canGoNext: Boolean(
      nextStep && (activeStep?.kind === "welcome" || activeStep?.complete),
    ),
    isLastStep: activeIndex >= 0 && activeIndex === steps.length - 1,
    goToStep,
    goPrevious,
    goNext,
    done: Boolean(
      context?.documentsComplete &&
      (context.phase === "documents" || context.profile?.applicationSigned),
    ),
  };

  return (
    <OnboardingStateContext.Provider value={value}>
      {children}
    </OnboardingStateContext.Provider>
  );
}

export function useOnboarding(): OnboardingState {
  const state = useContext(OnboardingStateContext);
  if (!state) {
    throw new Error("useOnboarding must be used within an OnboardingProvider.");
  }
  return state;
}
