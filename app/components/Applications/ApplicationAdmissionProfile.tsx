import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFieldValue } from "./applicationPresentation";

export function ApplicationAdmissionProfile({
  dateOfBirth,
  hasProfile,
  isEligible,
  canSync,
  isPending,
  isSigned,
  isSyncing,
  onSync,
}: {
  dateOfBirth?: string;
  hasProfile: boolean;
  isEligible: boolean;
  canSync: boolean;
  isPending: boolean;
  isSigned: boolean;
  isSyncing: boolean;
  onSync: () => void;
}) {
  if (!hasProfile || !dateOfBirth) {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/40 p-4">
        <p className="text-sm text-destructive">
          Über die private Bewerbungs-E-Mail wurde noch kein eindeutiges,
          aktives Member-Plattform-Profil mit Geburtsdatum gefunden.
        </p>
        {canSync ? (
          <SyncButton
            isPending={isPending}
            isSyncing={isSyncing}
            label="Member-Plattform erneut prüfen"
            onSync={onSync}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Geburtsdatum</p>
        <p>{formatFieldValue(dateOfBirth, "INPUT_DATE")}</p>
        <p className="text-xs text-muted-foreground">
          Aus dem eindeutig zugeordneten Member-Plattform-Profil übernommen.
        </p>
      </div>
      {isEligible ? (
        <p className="text-sm text-green-700">
          Die Altersvoraussetzung ist erfüllt.
        </p>
      ) : (
        <p className="text-sm text-destructive">
          Bei der Aufnahme muss die Person mindestens 16 und noch nicht 25 Jahre
          alt sein.
        </p>
      )}
      {canSync && !isSigned ? (
        <SyncButton
          compact
          isPending={isPending}
          isSyncing={isSyncing}
          label="Daten erneut laden"
          onSync={onSync}
        />
      ) : null}
    </div>
  );
}

function SyncButton({
  compact,
  isPending,
  isSyncing,
  label,
  onSync,
}: {
  compact?: boolean;
  isPending: boolean;
  isSyncing: boolean;
  label: string;
  onSync: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "sm" : "member"}
      className={compact ? undefined : "w-full"}
      disabled={isPending}
      onClick={onSync}
    >
      <RefreshCw className={isSyncing ? "size-4 animate-spin" : "size-4"} />
      {label}
    </Button>
  );
}
