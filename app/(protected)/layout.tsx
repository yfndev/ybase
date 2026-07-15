import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PostHogIdentity } from "@/components/PostHogIdentity";
import { AppSidebar } from "@/components/Sidebar/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { OnboardingNotice } from "./OnboardingNotice";
import { OffboardedNotice } from "./OffboardedNotice";
import { OrgOnboarding } from "./OrgOnboarding";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const member = await requireAuthenticatedUser();

  let content: ReactNode;
  if (member.memberStatus === "offboarded") {
    content = <OffboardedNotice />;
  } else if (!member.organizationId) {
    content = <OrgOnboarding />;
  } else if (member.memberStatus === "onboarding") {
    content = (
      <OnboardingNotice onboardingStatus={member.teamOnboardingStatus} />
    );
  } else {
    content = (
      <SidebarProvider className="bg-sidebar">
        <AppSidebar />
        <div
          data-app-content
          className="flex flex-col flex-1 min-w-0 p-2 sm:p-3 lg:p-4"
        >
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
