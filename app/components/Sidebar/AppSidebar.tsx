"use client";

import {
  Coins,
  FileCheck2,
  FolderKanban,
  LayoutDashboard,
  Megaphone,
  Network,
  ScrollText,
  UsersRound,
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

const MEMBER_NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { name: "Erstattungen", url: "/reimbursements", icon: Coins },
];

type ProtectedNavItem = NavItem & { permission: UserPermission };

const ADMINISTRATION_NAV_ITEMS: ProtectedNavItem[] = [
  {
    name: "Struktur",
    url: "/settings/teams",
    icon: Network,
    permission: USER_PERMISSIONS.organizationStructure,
  },
  {
    name: "Unterlagen",
    url: "/settings/documents",
    icon: FileCheck2,
    permission: USER_PERMISSIONS.members,
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

export function AppSidebar({
  locked = false,
  navSlot,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  locked?: boolean;
  navSlot?: React.ReactNode;
}) {
  const role = useCurrentUserRole();
  const homeUrl = "/dashboard";
  const mainItems: NavItem[] = [
    ...MEMBER_NAV_ITEMS,
    ...(hasPermission(role, USER_PERMISSIONS.recruiting)
      ? [{ name: "Ausschreibungen", url: "/recruiting", icon: Megaphone }]
      : []),
    ...(hasPermission(role, USER_PERMISSIONS.members)
      ? [
          {
            name: "Mitglieder",
            url: "/members",
            activeUrls: ["/applications"],
            icon: UsersRound,
          },
        ]
      : []),
  ];
  const administrationItems = ADMINISTRATION_NAV_ITEMS.filter(
    ({ permission }) => hasPermission(role, permission),
  );

  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              {locked ? (
                <span>
                  <Image
                    src="/AppIcon.png"
                    alt="YBase"
                    width={32}
                    height={32}
                  />
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-base font-bold">YBase</span>
                  </div>
                </span>
              ) : (
                <Link href={homeUrl}>
                  <Image
                    src="/AppIcon.png"
                    alt="YBase"
                    width={32}
                    height={32}
                  />
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-base font-bold">YBase</span>
                  </div>
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navSlot ?? (
          <>
            <MainNav items={mainItems} />
            {administrationItems.length > 0 && (
              <MainNav items={administrationItems} label="Verwaltung" />
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
