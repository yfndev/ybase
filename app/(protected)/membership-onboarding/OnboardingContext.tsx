"use client";

import {
  getOwnMembershipOnboardingContext,
  type MembershipOnboardingContext,
  type MembershipOnboardingDocument,
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

const LOAD_ERROR = "Das Onboarding konnte nicht geladen werden.";

export interface ProgressStep {
  label: string;
  complete: boolean;
}

interface OnboardingState {
  context?: MembershipOnboardingContext;
  error?: string;
  steps: ProgressStep[];
  current?: MembershipOnboardingDocument;
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

  const reload = useCallback(async () => {
    try {
      const next = await getOwnMembershipOnboardingContext();
      if ("blocked" in next) {
        setError(next.blocked);
        return;
      }
      setContext(next);
      setError(undefined);
      if (next.activated && next.phase === "membership") router.refresh();
    } catch {
      setError(LOAD_ERROR);
    }
  }, [router]);

  useEffect(() => void reload(), [reload]);

  const value: OnboardingState = {
    context,
    error,
    reload,
    current: context?.documents.find(({ status }) => status === "assigned"),
    done: Boolean(
      context?.documentsComplete &&
      (context.phase === "documents" || context.profile?.applicationSigned),
    ),
    steps: context
      ? [
          ...context.documents.map((document) => ({
            label: document.title,
            complete: document.status === "completed",
          })),
          ...(context.phase === "membership"
            ? [
                {
                  label: "Mitgliedsantrag",
                  complete: Boolean(context.profile?.applicationSigned),
                },
              ]
            : []),
        ]
      : [],
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
