"use client";

import {
  Building2,
  Coins,
  FolderKanban,
  LayoutDashboard,
  Network,
  ScrollText,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  hasPermission,
  USER_PERMISSIONS,
  type UserPermission,
} from "@/lib/auth/roles";
import { useCurrentUserRole } from "@/lib/hooks/useCurrentUserRole";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { MainNav, type NavItem } from "./MainNav";
import { NavUser } from "./UserNav";

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { name: "Erstattungen", url: "/reimbursements", icon: Coins },
];

type ProtectedNavItem = NavItem & { permission: UserPermission };

const ADMINISTRATION_NAV_ITEMS: ProtectedNavItem[] = [
  {
    name: "Organisation",
    url: "/settings/organization",
    icon: Building2,
    permission: USER_PERMISSIONS.organizationSettings,
  },
  {
    name: "Benutzer",
    url: "/settings/users",
    icon: Users,
    permission: USER_PERMISSIONS.roles,
  },
  {
    name: "Teams",
    url: "/settings/teams",
    icon: Network,
    permission: USER_PERMISSIONS.organizationStructure,
  },
  {
    name: "Projekte",
    url: "/settings/projects",
    icon: FolderKanban,
    permission: USER_PERMISSIONS.projects,
  },
  {
    name: "Logs",
    url: "/settings/logs",
    icon: ScrollText,
    permission: USER_PERMISSIONS.auditLogs,
  },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const role = useCurrentUserRole();
  const administrationItems = ADMINISTRATION_NAV_ITEMS.filter(
    ({ permission }) => hasPermission(role, permission),
  );

  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <Image src="/AppIcon.png" alt="YBase" width={32} height={32} />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-base font-bold">YBase</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <MainNav items={NAV_ITEMS} />
        {administrationItems.length > 0 && (
          <MainNav items={administrationItems} label="Verwaltung" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
