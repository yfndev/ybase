import { CircleAlert } from "lucide-react";

export function DocumentEditNotice() {
  return (
    <div className="flex gap-3 border-l-4 border-l-primary bg-primary/10 px-4 py-3 text-sm">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p>
        Diese Unterlage wurde bereits zugewiesen. Beim Speichern wird eine neue
        Version veröffentlicht und die bisherige archiviert.
      </p>
    </div>
  );
}
