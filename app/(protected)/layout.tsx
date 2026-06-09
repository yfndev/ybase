"use client";

import { AppSidebar } from "@/components/Sidebar/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const organizationId = useQuery(api.users.queries.getUserOrganizationId, {});
  const initializeOrganization = useMutation(
    api.organizations.functions.initializeOrganization,
  );
  const autoJoinStarted = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (organizationId === null && !autoJoinStarted.current) {
      autoJoinStarted.current = true;
      void initializeOrganization({});
    }
  }, [organizationId, initializeOrganization]);

  if (isLoading || !isAuthenticated || !organizationId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Image
          src="/AppIcon.png"
          alt="Logo"
          width={48}
          height={48}
          className="animate-spin"
        />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="p-3 sm:p-4 lg:px-6 pb-6">{children}</div>
      </div>
    </SidebarProvider>
  );
}
