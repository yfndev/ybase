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
import styles from "./MemberDrawer.module.css";
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
        className={styles.drawerRail}
        aria-label={`Teammitglied ${displayName} bearbeiten`}
      >
        <div className={styles.drawerSurface}>
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
