import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { isGettingToKnowConfirmed } from "@/lib/members/gettingToKnow";
import { MembershipOnboarding } from "./MembershipOnboarding";
import { OnboardingProvider } from "./OnboardingContext";

export default async function MembershipOnboardingPage() {
  const member = await requireAuthenticatedUser();
  if (!isGettingToKnowConfirmed(member)) redirect("/");

  return (
    <OnboardingProvider>
      <MembershipOnboarding />
    </OnboardingProvider>
  );
}
