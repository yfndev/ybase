import { CircleAlert } from "lucide-react";

export function DocumentEditNotice() {
  return (
    <div className="flex gap-3 border-l-4 border-l-primary bg-primary/10 px-4 py-3 text-sm">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">Bestehende Nachweise bleiben geschützt</p>
        <p className="mt-1 text-muted-foreground">
          Diese Unterlage wurde bereits zugewiesen. Beim Speichern wird
          automatisch eine neue Version veröffentlicht und die bisherige
          archiviert.
        </p>
      </div>
    </div>
  );
}
