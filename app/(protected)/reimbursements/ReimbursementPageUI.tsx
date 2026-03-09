"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Download, Loader2, Plus, Share2 } from "lucide-react";
import { ReimbursementRow } from "../../components/Tables/Reimbursements/ReimbursementRow";

type Reimbursement = Doc<"reimbursements"> & {
  creatorName: string;
  projectName: string;
  travelDetails?: Doc<"travelDetails">;
  reviewedByName: string | undefined;
};

type Allowance = Doc<"volunteerAllowance"> & {
  creatorName: string;
  projectName: string;
  organizationName: string;
  organizationStreet: string;
  organizationPlz: string;
  organizationCity: string;
  reviewedByName: string | undefined;
};

type RejectDialog = {
  open: boolean;
  type: "reimbursement" | "allowance";
  id: Id<"reimbursements"> | Id<"volunteerAllowance"> | null;
  note: string;
};

type SelectionKey = `r:${string}` | `a:${string}`;

interface Props {
  isAdmin: boolean;
  isLoading: boolean;
  reimbursements: Reimbursement[];
  allowances: Allowance[];
  rejectDialog: RejectDialog;
  selected: Set<SelectionKey>;
  isBulkDownloading: boolean;
  onNewClick: () => void;
  onShareClick: () => void;
  onRowClick: (id: Id<"reimbursements">) => void;
  onApproveReimbursement: (id: Id<"reimbursements">) => void;
  onApproveAllowance: (id: Id<"volunteerAllowance">) => void;
  onOpenRejectDialog: (
    type: "reimbursement" | "allowance",
    id: Id<"reimbursements"> | Id<"volunteerAllowance">,
  ) => void;
  onRejectDialogChange: (dialog: RejectDialog) => void;
  onReject: () => void;
  onDownloadReimbursement: (id: Id<"reimbursements">) => void;
  onDownloadAllowance: (allowance: Allowance) => void;
  onDeleteReimbursement: (id: Id<"reimbursements">) => void;
  onDeleteAllowance: (id: Id<"volunteerAllowance">) => void;
  onToggleSelect: (key: SelectionKey) => void;
  onBulkDownload: () => void;
}

export type { SelectionKey, Reimbursement, Allowance };

export function ReimbursementPageUI({
  isAdmin,
  isLoading,
  reimbursements,
  allowances,
  rejectDialog,
  selected,
  isBulkDownloading,
  onNewClick,
  onShareClick,
  onRowClick,
  onApproveReimbursement,
  onApproveAllowance,
  onOpenRejectDialog,
  onRejectDialogChange,
  onReject,
  onDownloadReimbursement,
  onDownloadAllowance,
  onDeleteReimbursement,
  onDeleteAllowance,
  onToggleSelect,
  onBulkDownload,
}: Props) {
  const isEmpty = reimbursements.length === 0 && allowances.length === 0;

  return (
    <div className="flex flex-col w-full h-screen">
      <PageHeader title="Erstattungen" />

      <div className="flex justify-end gap-2 mb-4">
        {selected.size > 0 && (
          <Button variant="outline" onClick={onBulkDownload} disabled={isBulkDownloading}>
            {isBulkDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isBulkDownloading ? "Wird erstellt..." : `${selected.size} herunterladen`}
          </Button>
        )}
        <Button variant="outline" onClick={onNewClick}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Erstattung
        </Button>
        <Button variant="outline" onClick={onShareClick}>
          <Share2 className="h-4 w-4 mr-2" />
          Erstattung anfordern
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Keine Erstattungen gefunden.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]" />
                <TableHead className="w-[30px]" />
                <TableHead>Datum</TableHead>
                <TableHead>Projekt</TableHead>
                <TableHead>Beschreibung</TableHead>
                {isAdmin && <TableHead>Ersteller</TableHead>}
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reimbursements.map((item) => (
                <ReimbursementRow
                  key={item._id}
                  item={item}
                  isAdmin={isAdmin}
                  selectionCheckbox={
                    <Checkbox
                      checked={selected.has(`r:${item._id}`)}
                      onCheckedChange={() => onToggleSelect(`r:${item._id}`)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                  description={
                    item.type === "travel" ? (
                      <div>
                        <span>{item.projectName}</span>
                        <span className="block text-xs text-muted-foreground">
                          Reisekostenerstattung
                          {item.travelDetails?.destination &&
                            ` - ${item.travelDetails.destination}`}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span>{item.projectName}</span>
                        <span className="block text-xs text-muted-foreground">
                          Auslagenerstattung
                        </span>
                      </div>
                    )
                  }
                  onClick={() => onRowClick(item._id)}
                  onApprove={() => onApproveReimbursement(item._id)}
                  onReject={() => onOpenRejectDialog("reimbursement", item._id)}
                  onDownload={() => onDownloadReimbursement(item._id)}
                  onDelete={() => onDeleteReimbursement(item._id)}
                />
              ))}

              {allowances.map((item) => (
                <ReimbursementRow
                  key={item._id}
                  item={item}
                  isAdmin={isAdmin}
                  selectionCheckbox={
                    <Checkbox
                      checked={selected.has(`a:${item._id}`)}
                      onCheckedChange={() => onToggleSelect(`a:${item._id}`)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                  description={
                    <div>
                      <span>{item.projectName}</span>
                      <span className="block text-xs text-muted-foreground">
                        Ehrenamtspauschale
                      </span>
                    </div>
                  }
                  onApprove={() => onApproveAllowance(item._id)}
                  onReject={() => onOpenRejectDialog("allowance", item._id)}
                  onDownload={() => onDownloadAllowance(item)}
                  onDelete={() => onDeleteAllowance(item._id)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => onRejectDialogChange({ ...rejectDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ablehnen</DialogTitle>
            <DialogDescription>
              Bitte gib einen Grund für die Ablehnung ein.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectDialog.note}
            onChange={(e) =>
              onRejectDialogChange({ ...rejectDialog, note: e.target.value })
            }
            placeholder="Grund für die Ablehnung..."
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                onRejectDialogChange({ ...rejectDialog, open: false })
              }
            >
              Abbrechen
            </Button>
            <Button onClick={onReject} disabled={!rejectDialog.note}>
              Ablehnen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
