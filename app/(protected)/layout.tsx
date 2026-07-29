import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PostHogIdentity } from "@/components/PostHogIdentity";
import { AppSidebar } from "@/components/Sidebar/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { isUnavailableMemberStatus } from "@/lib/members/status";
import { OnboardingNotice } from "./OnboardingNotice";
import { OffboardedNotice } from "./OffboardedNotice";
import { PublicProfileSetup } from "./PublicProfileSetup";

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
  } else if (member.publicProfileSetupRequired === true) {
    content = (
      <PublicProfileSetup
        canUseGooglePhoto={
          member.googlePhotoIsDefault === false && Boolean(member.image)
        }
      />
    );
  } else if (member.memberStatus === "onboarding") {
    content = (
      <OnboardingNotice onboardingStatus={member.teamOnboardingStatus} />
    );
  } else {
    content = (
      <SidebarProvider className="bg-sidebar">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col p-2 transition-[padding-right] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:p-3 lg:p-4 min-[1200px]:has-[[data-member-drawer]]:pr-[calc(var(--member-drawer-width)+2rem)] min-[1280px]:has-[[data-application-review-sidebar]]:pr-[calc(var(--application-review-sidebar-width)+2rem)]">
          <div className="flex-1 rounded-[0.25rem] border bg-background p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </SidebarProvider>
    );
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
