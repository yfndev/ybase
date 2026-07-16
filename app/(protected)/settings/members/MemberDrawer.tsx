"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { XIcon } from "lucide-react";
import { MemberDrawerPanel } from "./MemberDrawerPanel";
import type { MemberDrawerProps } from "./MemberDrawer.types";
import { useDesktopDrawer } from "./useDesktopDrawer";
import { useMemberDrawerForm } from "./useMemberDrawerForm";

export function MemberDrawer(props: MemberDrawerProps) {
  const { member, onClose } = props;
  const isDesktopDrawer = useDesktopDrawer();
  const form = useMemberDrawerForm(props);
  const displayName =
    member.name ||
    [member.firstName, member.lastName].filter(Boolean).join(" ") ||
    "Teammitglied";
  const content = (
    <MemberDrawerPanel
      member={member}
      displayName={displayName}
      form={form}
      onClose={onClose}
    />
  );

  if (isDesktopDrawer) {
    return (
      <aside
        data-member-drawer
        className="fixed inset-y-4 right-4 z-40 w-(--member-drawer-width) overflow-hidden transition-[width] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] starting:w-0 motion-reduce:transition-none"
        aria-label={`Teammitglied ${displayName} bearbeiten`}
      >
        <div className="absolute inset-y-0 left-0 flex w-(--member-drawer-width) flex-col overflow-hidden rounded-[0.25rem] border bg-background">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-3 right-3 z-10"
            onClick={onClose}
            disabled={form.isSaving}
            aria-label="Sidebar schließen"
          >
            <XIcon />
          </Button>
          {content}
        </div>
      </aside>
    );
  }

  return (
    <Sheet open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent side="right" className="w-full overflow-hidden sm:max-w-md">
        <SheetHeader className="sr-only">
          <SheetTitle>{displayName}</SheetTitle>
          <SheetDescription>
            Teammitglied {displayName} bearbeiten
          </SheetDescription>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
