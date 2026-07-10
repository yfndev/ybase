import { TriangleAlert } from "lucide-react";

export function ReceiptAddressNotice() {
  return (
    <aside
      aria-label="Hinweis zur Rechnungsadresse"
      className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
    >
      <TriangleAlert
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400"
      />
      <div className="space-y-1 text-sm">
        <p className="font-semibold text-foreground">
          Rechnung auf den Verein ausstellen
        </p>
        <p className="leading-relaxed text-muted-foreground">
          Auf dem Beleg muss die vollständige Vereinsadresse als
          Rechnungsadresse stehen. Prüfe das besonders bei Rechnungen der
          Deutschen Bahn.
        </p>
      </div>
    </aside>
  );
}
