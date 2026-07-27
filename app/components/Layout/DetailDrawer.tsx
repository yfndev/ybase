"use client";

import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDesktopDrawer } from "@/lib/hooks/useDesktopDrawer";

interface Props {
  title: string;
  description: string;
  ariaLabel: string;
  onClose: () => void;
  closeDisabled?: boolean;
  children: ReactNode;
}

export function DetailDrawer({
  title,
  description,
  ariaLabel,
  onClose,
  closeDisabled = false,
  children,
}: Props) {
  const isDesktopDrawer = useDesktopDrawer();

  if (isDesktopDrawer) {
    return (
      <aside
        data-member-drawer
        className="fixed inset-y-4 right-4 z-40 w-(--member-drawer-width) overflow-hidden transition-[width] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] starting:w-0 motion-reduce:transition-none"
        aria-label={ariaLabel}
      >
        <div className="absolute inset-y-0 left-0 flex w-(--member-drawer-width) flex-col overflow-hidden rounded-[0.25rem] border bg-background">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-3 right-3 z-10"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Detailansicht schließen"
          >
            <XIcon />
          </Button>
          {children}
        </div>
      </aside>
    );
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
