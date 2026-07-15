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
  hasSelection: boolean;
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
  hasSelection,
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
    <div className="mb-4 flex flex-wrap justify-end gap-2">
      {hasSelection ? (
        <Button
          variant="outline"
          onClick={onBulkDownload}
          disabled={isBulkDownloading}
        >
          {isBulkDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isBulkDownloading ? "Wird erstellt..." : "Herunterladen"}
        </Button>
      ) : null}
      {canManageReimbursements ? (
        <>
          <Button variant="outline" onClick={onFinomCsv}>
            <Table2 className="mr-2 h-4 w-4" />
            Finom CSV
          </Button>
          <Button variant="outline" onClick={onSepaXml}>
            <FileCode2 className="mr-2 h-4 w-4" />
            SEPA XML
          </Button>
        </>
      ) : null}
      {canDeleteSelected ? (
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={onDeleteSelected}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Löschen
        </Button>
      ) : null}
      <Button variant="primary" onClick={onNewClick}>
        <Plus className="mr-2 h-4 w-4" />
        Neue Erstattung
      </Button>
      {canManageReimbursements ? (
        <Button variant="outline" onClick={onShareClick}>
          <Share2 className="mr-2 h-4 w-4" />
          Erstattung anfordern
        </Button>
      ) : null}
    </div>
  );
}
