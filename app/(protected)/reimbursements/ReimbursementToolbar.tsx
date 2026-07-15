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
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";

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
        <ButtonGroup
          aria-label={`Aktionen für ${selectedCount} ausgewählte ${
            selectedCount === 1 ? "Erstattung" : "Erstattungen"
          }`}
        >
          <ButtonGroupText className="h-10 border-2 bg-muted px-3">
            {selectedCount} ausgewählt
          </ButtonGroupText>
          <Button
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
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={onDeleteSelected}
            >
              <Trash2 />
              Löschen
            </Button>
          ) : null}
        </ButtonGroup>
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
