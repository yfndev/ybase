import {
  Download,
  FileCode2,
  Loader2,
  Plus,
  Share2,
  Table2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  canManageReimbursements: boolean;
  selectedCount: number;
  canDeleteSelected: boolean;
  isBulkDownloading: boolean;
  onNewClick: () => void;
  onShareClick: () => void;
  onDeleteSelected: () => void;
  onBulkDownload: () => void;
  onFinomCsv: () => void;
  onSepaXml: () => void;
};

export function ReimbursementToolbar({
  canManageReimbursements,
  selectedCount,
  canDeleteSelected,
  isBulkDownloading,
  onNewClick,
  onShareClick,
  onDeleteSelected,
  onBulkDownload,
  onFinomCsv,
  onSepaXml,
}: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-start gap-2">
      {selectedCount > 0 ? (
        <fieldset
          aria-label={`Aktionen für ${selectedCount} ausgewählte ${
            selectedCount === 1 ? "Erstattung" : "Erstattungen"
          }`}
          className="flex w-fit flex-wrap items-center gap-2"
        >
          <div className="flex h-10 items-center rounded-md border-2 bg-muted px-3 text-sm font-medium">
            {selectedCount} ausgewählt
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onBulkDownload}
            disabled={isBulkDownloading}
          >
            {isBulkDownloading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download />
            )}
            {isBulkDownloading ? "Wird erstellt..." : "Herunterladen"}
          </Button>
          {canDeleteSelected ? (
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={onDeleteSelected}
            >
              <Trash2 />
              Löschen
            </Button>
          ) : null}
        </fieldset>
      ) : null}

      <div className="ml-auto flex flex-wrap justify-end gap-2">
        {canManageReimbursements ? (
          <>
            <Button variant="outline" onClick={onFinomCsv}>
              <Table2 />
              Finom CSV
            </Button>
            <Button variant="outline" onClick={onSepaXml}>
              <FileCode2 />
              SEPA XML
            </Button>
          </>
        ) : null}
        <Button variant="primary" onClick={onNewClick}>
          <Plus />
          Neue Erstattung
        </Button>
        {canManageReimbursements ? (
          <Button variant="outline" onClick={onShareClick}>
            <Share2 />
            Erstattung anfordern
          </Button>
        ) : null}
      </div>
    </div>
  );
}
