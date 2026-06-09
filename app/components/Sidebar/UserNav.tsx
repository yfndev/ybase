"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Doc } from "@/convex/_generated/dataModel";
import { useAction, useQuery } from "convex/react";
import {
  Building2,
  ChevronsUpDown,
  FolderKanban,
  ScrollText,
  Users,
} from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "../Auth/LogoutButton";

function UserAvatar({ user }: { user: Doc<"users"> }) {
  return (
    <Avatar className="h-8 w-8 rounded-lg">
      <AvatarImage
        src={user.image}
        alt={user.name}
        referrerPolicy="no-referrer"
      />
      <AvatarFallback className="rounded-lg">
        {user.name?.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function UserInfo({ user }: { user: Doc<"users"> }) {
  return (
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium">{user.name}</span>
      <span className="truncate text-xs">{user.email}</span>
    </div>
  );
}

export function NavUser({ user }: { user: Doc<"users"> | null | undefined }) {
  const { isMobile } = useSidebar();
  const isAdmin = user?.role === "admin";

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="grid flex-1 gap-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar user={user} />
              <UserInfo user={user} />
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar user={user} />
                <UserInfo user={user} />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isAdmin && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/organization">
                      <Building2 />
                      Organisation
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/users">
                      <Users />
                      Benutzer
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/projects">
                      <FolderKanban />
                      Projekte
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/logs">
                      <ScrollText />
                      Logs
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem>
              <LogoutButton>Abmelden</LogoutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
