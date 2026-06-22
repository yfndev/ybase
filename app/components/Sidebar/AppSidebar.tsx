"use client";

import {
  Building2,
  Coins,
  FolderKanban,
  LayoutDashboard,
  ScrollText,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useIsAdmin } from "@/lib/hooks/useCurrentUserRole";
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

const ADMIN_NAV_ITEMS: NavItem[] = [
  { name: "Organisation", url: "/settings/organization", icon: Building2 },
  { name: "Benutzer", url: "/settings/users", icon: Users },
  { name: "Projekte", url: "/settings/projects", icon: FolderKanban },
  { name: "Logs", url: "/settings/logs", icon: ScrollText },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const isAdmin = useIsAdmin();

  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/reimbursements">
                <Image src="/AppIcon.png" alt="YBase" width={32} height={32} />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">YBase</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <MainNav items={NAV_ITEMS} />
        {isAdmin && <MainNav items={ADMIN_NAV_ITEMS} label="Verwaltung" />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
