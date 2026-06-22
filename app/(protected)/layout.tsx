import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/Sidebar/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { OrgOnboarding } from "./OrgOnboarding";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.organizationId) return <OrgOnboarding />;

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="p-3 sm:p-4 lg:px-6 pb-6">{children}</div>
      </div>
    </SidebarProvider>
  );
}
