import {
  Check,
  ExternalLink,
  MessageSquareWarning,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import styles from "@/components/ui/vertical-action-menu.module.css";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { formatDate } from "@/lib/formatters/formatDate";
import { STATUS_DISPLAY } from "@/lib/reimbursementStatus";
import type { ReimbursementStatus as Status } from "@/lib/reimbursementStatus";
import { ReimbursementRowMetadata } from "./ReimbursementRowMetadata";

interface ReimbursementRowProps {
  item: {
    _id: string;
    _creationTime: number;
    status: Status;
    projectName: string;
    amount: number;
    reviewedByName?: string;
  };
  canManageReimbursements: boolean;
  canEdit: boolean;
  title: string;
  detail?: string;
  applicantName: string;
  selectionCheckbox?: ReactNode;
  onClick?: () => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onReject: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ReimbursementRow({
  item,
  canManageReimbursements,
  canEdit,
  title,
  detail,
  applicantName,
  selectionCheckbox,
  onClick,
  onApprove,
  onRequestChanges,
  onReject,
  onOpen,
  onEdit,
  onDelete,
}: ReimbursementRowProps) {
  const display = STATUS_DISPLAY[item.status];
  const showReviewActions =
    canManageReimbursements && item.status === "pending";
  const showEditAction = canEdit && item.status === "changes_requested";

  return (
    <TableRow
      className={onClick ? "cursor-pointer" : undefined}
      onClick={onClick}
    >
      {selectionCheckbox !== undefined && (
        <TableCell className="px-2" onClick={(e) => e.stopPropagation()}>
          {selectionCheckbox}
        </TableCell>
      )}
      <TableCell className="py-3" data-reimbursement-column="request">
        <div className="min-w-0">
          <div className="font-medium text-foreground">{title}</div>
          {detail ? (
            <div className="max-w-72 truncate text-xs text-muted-foreground">
              {detail}
            </div>
          ) : null}
          <ReimbursementRowMetadata
            canManageReimbursements={canManageReimbursements}
            applicantName={applicantName}
            projectName={item.projectName}
            creationTime={item._creationTime}
          />
        </div>
      </TableCell>
      {canManageReimbursements ? (
        <TableCell
          className="max-w-48 truncate"
          data-reimbursement-column="applicant"
        >
          {applicantName}
        </TableCell>
      ) : null}
      <TableCell
        className="max-w-48 truncate"
        data-reimbursement-column="project"
      >
        {item.projectName}
      </TableCell>
      <TableCell
        className="text-muted-foreground"
        data-reimbursement-column="created"
      >
        {formatDate(item._creationTime)}
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(item.amount)}
      </TableCell>
      <TableCell
        className="max-w-48 truncate text-muted-foreground"
        data-reimbursement-column="reviewed-by"
      >
        {item.reviewedByName ?? "–"}
      </TableCell>
      <TableCell
        data-reimbursement-column="status"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <Badge variant={display.variant} className={display.className}>
            {display.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className={styles.menuTrigger}
                aria-label="Aktionen anzeigen"
                title="Aktionen anzeigen"
              >
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent sideOffset={0} className={styles.menuContent}>
              {showReviewActions ? (
                <>
                  <DropdownMenuItem
                    className={styles.menuItem}
                    onSelect={onApprove}
                  >
                    <Check className="text-current" />
                    Genehmigen
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={styles.menuItem}
                    onSelect={onRequestChanges}
                  >
                    <MessageSquareWarning className="text-current" />
                    Änderungen anfordern
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={`${styles.menuItem} ${styles.destructiveMenuItem}`}
                    onSelect={onReject}
                  >
                    <X className="text-current" />
                    Ablehnen
                  </DropdownMenuItem>
                </>
              ) : null}
              {showEditAction ? (
                <DropdownMenuItem className={styles.menuItem} onSelect={onEdit}>
                  <Pencil className="text-current" />
                  Bearbeiten
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem className={styles.menuItem} onSelect={onOpen}>
                <ExternalLink className="text-current" />
                Öffnen
              </DropdownMenuItem>
              {canManageReimbursements ? (
                <DropdownMenuItem
                  className={`${styles.menuItem} ${styles.destructiveMenuItem}`}
                  onSelect={onDelete}
                >
                  <Trash2 className="text-current" />
                  Löschen
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
