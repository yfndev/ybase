"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

export function MainNav({
  items,
  id,
  label,
}: {
  items: NavItem[];
  id?: string;
  label?: string;
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup id={id}>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              tooltip={item.name}
              isActive={
                pathname === item.url || pathname.startsWith(`${item.url}/`)
              }
            >
              <Link href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
