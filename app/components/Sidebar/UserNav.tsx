"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
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

type NavUserData = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function UserAvatar({ user }: { user: NavUserData }) {
  return (
    <Avatar className="size-9 rounded-full group-data-[collapsible=icon]:size-8">
      <AvatarImage
        src={user.image ?? undefined}
        alt={user.name ?? ""}
        referrerPolicy="no-referrer"
      />
      <AvatarFallback className="rounded-full">
        {user.name?.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function UserInfo({ user }: { user: NavUserData }) {
  return (
    <div className="grid flex-1 text-left leading-tight">
      <span className="truncate font-medium">{user.name}</span>
      <span className="truncate text-sm">{user.email}</span>
    </div>
  );
}

function UserNavSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="h-auto gap-3 px-[1.125rem] py-3"
          disabled
        >
          <Skeleton className="size-9 rounded-full group-data-[collapsible=icon]:size-8" />
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const { data } = useSession();
  const user = data?.user;

  if (!user) return <UserNavSkeleton />;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-auto gap-3 border border-border px-[1.125rem] py-3 text-base data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
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
            <DropdownMenuItem
              onSelect={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut />
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
