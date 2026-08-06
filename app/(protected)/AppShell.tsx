import { AppSidebar } from "@/components/Sidebar/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { ReactNode } from "react";

export function AppShell({
  children,
  locked = false,
  navSlot,
}: {
  children: ReactNode;
  locked?: boolean;
  navSlot?: ReactNode;
}) {
  return (
    <SidebarProvider
      className={locked ? "h-svh overflow-hidden bg-sidebar" : "bg-sidebar"}
    >
      <AppSidebar locked={locked} navSlot={navSlot} />
      <div className="flex min-w-0 min-h-0 flex-1 flex-col p-2 transition-[padding-right] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:p-3 lg:p-4 min-[1200px]:has-[[data-member-drawer]]:pr-[calc(var(--member-drawer-width)+2rem)] min-[1280px]:has-[[data-application-review-sidebar]]:pr-[calc(var(--application-review-sidebar-width)+2rem)]">
        <div className="flex min-h-0 flex-1 flex-col rounded-[0.25rem] border bg-background p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
