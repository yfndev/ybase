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
import { Coins } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MainNav, type NavItem } from "./MainNav";
import { NavUser } from "./UserNav";

const NAV_ITEMS: NavItem[] = [
  { name: "Erstattungen", url: "/reimbursements", icon: Coins },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const user = useQuery(api.users.queries.getCurrentUserProfile);

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
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
