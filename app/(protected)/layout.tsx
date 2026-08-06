import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PostHogIdentity } from "@/components/PostHogIdentity";
import { auth } from "@/lib/auth";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { isUnavailableMemberStatus } from "@/lib/members/status";
import { getMemberPlatformLinkingData } from "@/lib/server/memberPlatform/linking";
import { AppShell } from "./AppShell";
import { MemberPlatformLinking } from "./MemberPlatformLinking";
import { OnboardingNotice } from "./OnboardingNotice";
import { OffboardedNotice } from "./OffboardedNotice";
import { PublicProfileSetup } from "./PublicProfileSetup";
import { MembershipOnboarding } from "./membership-onboarding/MembershipOnboarding";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const member = await requireAuthenticatedUser();

  let content: ReactNode;
  if (isUnavailableMemberStatus(member.memberStatus)) {
    content = <OffboardedNotice />;
  } else if (
    member.publicProfileSetupRequired === true &&
    !member.memberPlatformUserId
  ) {
    content = (
      <PublicProfileSetup
        canUseGooglePhoto={
          member.googlePhotoIsDefault === false && Boolean(member.image)
        }
      />
    );
  } else if (
    member.memberStatus === "onboarding" &&
    !member.memberPlatformUserId
  ) {
    const linkingData = await getMemberPlatformLinkingData(member);
    content = linkingData ? (
      <MemberPlatformLinking data={linkingData} />
    ) : (
      <OnboardingNotice />
    );
  } else if (member.memberStatus === "onboarding") {
    content = (
      <AppShell locked>
        <MembershipOnboarding />
      </AppShell>
    );
  } else {
    content = <AppShell>{children}</AppShell>;
  }

  return (
    <>
      <PostHogIdentity
        userId={member._id}
        organizationId={member.organizationId}
        role={member.role}
      />
      {content}
    </>
  );
}
