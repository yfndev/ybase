"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RESIGNATION_DECLARATION_TEXT } from "@/lib/server/memberships/resignationDeclaration";
import type { OwnMembershipOverview } from "@/lib/server/memberships/selfServiceResignation";

export function MembershipResignationDialog({
  membership,
  expectedEndLabel,
  open,
  isPending,
  onOpenChange,
  onSubmit,
}: {
  membership: OwnMembershipOverview;
  expectedEndLabel: string;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const isGuardianFlow = membership.isMinor;
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !isPending && onOpenChange(value)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isGuardianFlow ? "Bestätigung anfordern" : "Austritt erklären"}
          </DialogTitle>
          <DialogDescription className="leading-6">
            {isGuardianFlow
              ? `Da du minderjährig bist, senden wir einen sicheren Bestätigungslink an ${membership.guardianEmail ?? "deine hinterlegte Vertretung"}.`
              : `Deine Mitgliedschaft endet satzungsgemäß am ${expectedEndLabel}.`}
          </DialogDescription>
        </DialogHeader>
        <p className="rounded-md border bg-muted/30 p-4 text-sm leading-6">
          {RESIGNATION_DECLARATION_TEXT}
        </p>
        <DialogFooter>
          <Button variant="destructive" disabled={isPending} onClick={onSubmit}>
            {isPending ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : null}
            {isGuardianFlow
              ? "Bestätigung senden"
              : "Austritt verbindlich erklären"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
