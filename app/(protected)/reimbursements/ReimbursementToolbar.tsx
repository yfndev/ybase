import {
  ChevronDown,
  Download,
  FileCode2,
  Loader2,
  Plus,
  Share2,
  Table2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  if (selectedCount > 0) {
    return (
      <fieldset
        aria-label={`Aktionen für ${selectedCount} ausgewählte ${
          selectedCount === 1 ? "Erstattung" : "Erstattungen"
        }`}
        className="mb-4 flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto pb-1"
      >
        <div className="flex h-10 shrink-0 items-center rounded-md border-2 bg-muted px-3 text-sm font-medium">
          {selectedCount} ausgewählt
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onBulkDownload}
          disabled={isBulkDownloading}
          aria-busy={isBulkDownloading}
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
    );
  }

  return (
    <div className="mb-4 flex flex-nowrap items-center justify-end gap-2 overflow-x-auto pb-1">
      {canManageReimbursements ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline">
              <Download />
              Exportieren
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onFinomCsv}>
              <Table2 />
              Finom CSV exportieren
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onSepaXml}>
              <FileCode2 />
              SEPA XML exportieren
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {canManageReimbursements ? (
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" onClick={onShareClick}>
            <Share2 />
            Erstattung anfordern
          </Button>
          <Button type="button" variant="primary" onClick={onNewClick}>
            <Plus />
            Neue Erstattung
          </Button>
        </div>
      ) : (
        <Button type="button" variant="primary" onClick={onNewClick}>
          <Plus />
          Neue Erstattung
        </Button>
      )}
    </div>
  );
}
