import { Info } from "lucide-react";

interface Props {
  organizationName: string;
}

export function InvoiceOrganizationHint({ organizationName }: Props) {
  if (!organizationName.trim()) return null;

  return (
    <div
      role="note"
      className="flex gap-2 rounded-lg border bg-muted/50 p-3 text-sm"
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        Falls möglich, gib bei Rechnungen im Feld „Unternehmen/Institution“{" "}
        <span className="font-medium">{organizationName}</span> an.
      </p>
    </div>
  );
}
