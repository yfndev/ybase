"use client";

import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import { useApplicationMutations } from "@/lib/client/applications/hooks/useApplicationMutations";
import {
  type ApplicationNextStatus,
  APPLICATION_STATUS_TRANSITIONS,
} from "@/lib/applications/transitions";
import type { ApplicationStatus } from "@/lib/db/types";
import toast from "react-hot-toast";

interface StatusAction {
  status: ApplicationStatus;
  label: string;
  variant?: "outline" | "destructive";
}

const STATUS_ACTIONS: Record<ApplicationNextStatus, StatusAction> = {
  review: { status: "review", label: "In Prüfung nehmen" },
  interview: { status: "interview", label: "Zum Interview" },
  accepted: { status: "accepted", label: "Annehmen" },
  rejected: { status: "rejected", label: "Ablehnen", variant: "destructive" },
  withdrawn: {
    status: "withdrawn",
    label: "Zurückgezogen",
    variant: "outline",
  },
};

export function ApplicationActionFooter({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const { setStatus } = useApplicationMutations();
  const actions = APPLICATION_STATUS_TRANSITIONS[status].map(
    (nextStatus) => STATUS_ACTIONS[nextStatus],
  );

  async function changeStatus(nextStatus: ApplicationStatus) {
    try {
      await setStatus.mutateAsync({ applicationId, status: nextStatus });
      toast.success("Status aktualisiert");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Status konnte nicht geändert werden",
      );
    }
  }

  return (
    <SheetFooter className="border-t bg-background">
      {actions.length > 0 ? (
        <fieldset
          className="flex flex-wrap gap-2"
          aria-label="Bewerbungsaktionen"
        >
          {actions.map((action) => (
            <Button
              key={action.status}
              variant={action.variant ?? "primary"}
              disabled={setStatus.isPending}
              onClick={() => changeStatus(action.status)}
            >
              {action.label}
            </Button>
          ))}
        </fieldset>
      ) : (
        <p className="text-sm text-muted-foreground">
          Für diese abgeschlossene Bewerbung sind keine weiteren Statuswechsel
          verfügbar.
        </p>
      )}
    </SheetFooter>
  );
}
