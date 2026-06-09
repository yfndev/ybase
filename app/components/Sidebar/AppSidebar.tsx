"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Building2,
  Coins,
  FolderKanban,
  ScrollText,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MainNav, type NavItem } from "./MainNav";
import { NavUser } from "./UserNav";

const NAV_ITEMS: NavItem[] = [
  { name: "Erstattungen", url: "/reimbursements", icon: Coins },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { name: "Organisation", url: "/settings/organization", icon: Building2 },
  { name: "Benutzer", url: "/settings/users", icon: Users },
  { name: "Projekte", url: "/settings/projects", icon: FolderKanban },
  { name: "Logs", url: "/settings/logs", icon: ScrollText },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const user = useQuery(api.users.queries.getCurrentUserProfile);
  const isAdmin = user?.role === "admin";

  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/reimbursements">
                <Image
                  src="/AppIcon.png"
                  alt="YBudget"
                  width={32}
                  height={32}
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">YBudget</span>
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
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
